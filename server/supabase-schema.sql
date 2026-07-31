-- ============================================================
-- AutoPromo SDK — Supabase / Postgres schema
-- Run this entire file once in the Supabase SQL editor.
-- Source: plan.md §8
-- ============================================================

-- Apps being promoted
create table if not exists apps (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  description text        not null,
  created_at  timestamptz not null default now()
);

-- Raw events fired by the SDK
create table if not exists events (
  id         uuid        primary key default gen_random_uuid(),
  app_id     uuid        not null references apps(id) on delete cascade,
  type       text        not null check (type in ('launch', 'milestone', 'new_version', 'new_review')),
  payload    jsonb       not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- AI-generated content variants tied to an event
create table if not exists generated_posts (
  id         uuid        primary key default gen_random_uuid(),
  event_id   uuid        not null references events(id) on delete cascade,
  app_id     uuid        not null references apps(id) on delete cascade,
  platform   text        not null check (platform in ('twitter', 'reddit', 'whatsapp', 'telegram', 'linkedin', 'facebook')),
  tone       text        not null check (tone in ('casual', 'professional')),
  content    text        not null,
  link_title text,
  rank_score numeric     not null default 0,
  chosen     boolean     not null default false,
  created_at timestamptz not null default now()
);

-- Rolling stats used by the Strategy Engine to learn preferences per app
create table if not exists platform_stats (
  app_id        uuid not null references apps(id) on delete cascade,
  platform      text not null,
  tone          text not null,
  times_shown   int  not null default 0,
  times_chosen  int  not null default 0,
  primary key (app_id, platform, tone)
);

-- ── Realtime ─────────────────────────────────────────────────────────────────
-- Enable realtime on the tables the dashboard/live feed subscribes to
alter publication supabase_realtime add table events;
alter publication supabase_realtime add table generated_posts;

-- ── Row Level Security ────────────────────────────────────────────────────────
-- Public read (needed for the live feed page using the anon key)
-- Writes only via service role key (server-side)

alter table apps            enable row level security;
alter table events          enable row level security;
alter table generated_posts enable row level security;
alter table platform_stats  enable row level security;

create policy "public read apps"            on apps            for select using (true);
create policy "public read events"          on events          for select using (true);
create policy "public read generated_posts" on generated_posts for select using (true);
create policy "public read platform_stats"  on platform_stats  for select using (true);

-- ── Helper functions ──────────────────────────────────────────────────────────

create or replace function increment_times_shown(
  p_app_id  uuid,
  p_platform text,
  p_tone    text
)
returns void as $$
begin
  insert into platform_stats (app_id, platform, tone, times_shown, times_chosen)
  values (p_app_id, p_platform, p_tone, 1, 0)
  on conflict (app_id, platform, tone)
  do update set times_shown = platform_stats.times_shown + 1;
end;
$$ language plpgsql;

create or replace function increment_times_chosen(
  p_app_id  uuid,
  p_platform text,
  p_tone    text
)
returns void as $$
begin
  update platform_stats
  set times_chosen = times_chosen + 1
  where app_id = p_app_id
    and platform = p_platform
    and tone = p_tone;
end;
$$ language plpgsql;
