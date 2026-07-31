export type Platform = "Twitter" | "Reddit" | "WhatsApp" | "LinkedIn";
export type Tone = "casual" | "professional";
export type EventType = "Launch" | "Milestone" | "New version" | "New review";

export interface App {
  id: string;
  name: string;
  description: string;
  status: "active" | "idle";
}

export interface Post {
  id: string;
  appId: string;
  platform: Platform;
  tone: Tone;
  event: EventType;
  content: string;
  score: number;
}

export interface FeedEvent {
  id: string;
  appId: string;
  ts: string;
  type: string;
  payload: string;
}

export interface PlatformStat {
  platform: Platform;
  shown: number;
  chosen: number;
}

export const apps: App[] = [
  {
    id: "demo-app",
    name: "PocketRecipe",
    description: "Scan your fridge, get a dinner plan in 20 seconds.",
    status: "active",
  },
  {
    id: "focus-timer",
    name: "FocusTimer",
    description: "A pomodoro timer that quietly blocks your loudest apps.",
    status: "active",
  },
  {
    id: "habit-tracker",
    name: "TeamX's Habit Tracker",
    description: "Streak-based habit tracking built for small teams.",
    status: "idle",
  },
];

const postSeed: Record<string, Omit<Post, "id" | "appId">[]> = {
  "demo-app": [
    {
      platform: "Twitter",
      tone: "casual",
      event: "Launch",
      score: 0.91,
      content:
        "PocketRecipe is live 🎉 Point your camera at the fridge, get a dinner you can actually cook tonight. No 800-word blog post before the ingredients. iOS + Android, free.",
    },
    {
      platform: "Twitter",
      tone: "professional",
      event: "Milestone",
      score: 0.78,
      content:
        "PocketRecipe just passed 1,000 downloads in its first week. Median time from photo to full recipe: 19 seconds. Thanks to everyone cooking with us.",
    },
    {
      platform: "Reddit",
      tone: "casual",
      event: "Launch",
      score: 0.84,
      content:
        "I got tired of scrolling past someone's childhood memories to find a pasta recipe, so I built PocketRecipe — snap your fridge shelf, it tells you what you can make with what's already in there. Free, no ads. Would love r/cooking's brutal feedback.",
    },
    {
      platform: "Reddit",
      tone: "professional",
      event: "New version",
      score: 0.66,
      content:
        "PocketRecipe 1.2 is out: offline pantry sync, 40% faster ingredient detection, and a metric/imperial toggle that finally remembers your choice. Changelog and known issues in the comments.",
    },
    {
      platform: "WhatsApp",
      tone: "casual",
      event: "Milestone",
      score: 0.73,
      content:
        "Hey! You know how I never know what to cook? I've been using this app PocketRecipe — take a photo of the fridge and it gives you a recipe from what's in there. Genuinely saved me three takeaways this week: pocketrecipe.app",
    },
    {
      platform: "WhatsApp",
      tone: "professional",
      event: "New review",
      score: 0.52,
      content:
        "Sharing something our users have been enjoying: PocketRecipe turns a photo of your ingredients into a step-by-step meal plan. Rated 4.8 on the App Store this week. pocketrecipe.app",
    },
    {
      platform: "LinkedIn",
      tone: "professional",
      event: "Milestone",
      score: 0.81,
      content:
        "1,000 downloads in seven days for PocketRecipe. What moved the needle wasn't the launch post — it was shipping the pantry-sync fix on day three and telling the 40 people who reported it. Building in public works when the public gets replied to.",
    },
    {
      platform: "LinkedIn",
      tone: "casual",
      event: "New review",
      score: 0.58,
      content:
        "Best review we've had so far: \"I stopped buying coriander I already own.\" Small win, but that's the whole product in one sentence. PocketRecipe is free on iOS and Android.",
    },
    {
      platform: "Twitter",
      tone: "casual",
      event: "New review",
      score: 0.69,
      content:
        "⭐⭐⭐⭐⭐ \"Used it four nights in a row and didn't order once.\" That's the review. That's the whole post. PocketRecipe, free on both stores.",
    },
    {
      platform: "Reddit",
      tone: "casual",
      event: "New review",
      score: 0.61,
      content:
        "Someone left a review saying PocketRecipe stopped them buying duplicate herbs and honestly that's a better pitch than anything on our landing page. AMA about building it solo in six weeks.",
    },
  ],
  "focus-timer": [
    {
      platform: "Twitter",
      tone: "casual",
      event: "Launch",
      score: 0.88,
      content:
        "FocusTimer is out. It's a pomodoro timer, except when the timer starts it actually mutes the apps you doomscroll. Twenty-five minutes, no negotiation. Free on Android today, iOS next week.",
    },
    {
      platform: "Twitter",
      tone: "professional",
      event: "New version",
      score: 0.74,
      content:
        "FocusTimer 2.0: custom block lists, a weekly focus report, and Do Not Disturb handoff so your timer and your phone finally agree with each other.",
    },
    {
      platform: "Reddit",
      tone: "casual",
      event: "Launch",
      score: 0.8,
      content:
        "Built FocusTimer because every timer app I tried let me tab away in the first 90 seconds. This one blocks the apps you pick for the duration of the session. No account, no subscription. r/productivity, tell me what's missing.",
    },
    {
      platform: "Reddit",
      tone: "professional",
      event: "Milestone",
      score: 0.63,
      content:
        "FocusTimer crossed 5,000 sessions completed this month. Average session length is 24m11s, which suggests most people finish. Sharing the aggregate stats in the comments for anyone curious.",
    },
    {
      platform: "WhatsApp",
      tone: "casual",
      event: "Milestone",
      score: 0.57,
      content:
        "Try this if you're revising — FocusTimer locks the apps you keep opening for 25 mins at a time. I've done 12 sessions this week which is 12 more than usual: focustimer.app",
    },
    {
      platform: "WhatsApp",
      tone: "professional",
      event: "New version",
      score: 0.49,
      content:
        "FocusTimer 2.0 is available now with weekly focus reports and custom block lists. Free, no account required: focustimer.app",
    },
    {
      platform: "LinkedIn",
      tone: "professional",
      event: "Milestone",
      score: 0.76,
      content:
        "5,000 focus sessions completed in FocusTimer this month. The interesting number isn't the total — it's that 81% of started sessions run to completion. Friction, applied deliberately, works.",
    },
    {
      platform: "LinkedIn",
      tone: "casual",
      event: "Launch",
      score: 0.6,
      content:
        "Shipped FocusTimer today after four months of evenings. It's a timer that blocks your worst apps while it runs. Simple idea, surprisingly hard to make feel gentle instead of punishing.",
    },
    {
      platform: "Twitter",
      tone: "professional",
      event: "New review",
      score: 0.55,
      content:
        "\"First timer app I haven't uninstalled by Wednesday.\" We'll take it. FocusTimer 2.0 is live on Android and iOS.",
    },
  ],
  "habit-tracker": [
    {
      platform: "Twitter",
      tone: "casual",
      event: "Launch",
      score: 0.86,
      content:
        "We built a habit tracker for teams, not for lonely streak guilt. TeamX's Habit Tracker shows your squad's streaks side by side — miss a day and someone notices. That's the feature. Free beta open now.",
    },
    {
      platform: "Reddit",
      tone: "casual",
      event: "Launch",
      score: 0.71,
      content:
        "Every habit app I've used is single-player. We made one where a small team shares streaks and can cover for each other once a month. Beta is open and free, looking for teams of 3–8 to break it.",
    },
    {
      platform: "Reddit",
      tone: "professional",
      event: "Milestone",
      score: 0.59,
      content:
        "Our team habit tracker hit 250 active squads. Retention at day 30 is 44%, roughly double what we saw in the solo-only prototype. Happy to share the methodology.",
    },
    {
      platform: "WhatsApp",
      tone: "casual",
      event: "Milestone",
      score: 0.64,
      content:
        "Want to do the gym thing properly this time? Join my squad on TeamX's Habit Tracker — we all see each other's streaks so nobody quietly stops. habittracker.teamx.app",
    },
    {
      platform: "LinkedIn",
      tone: "professional",
      event: "Milestone",
      score: 0.79,
      content:
        "250 active squads on TeamX's Habit Tracker. Day-30 retention doubled when we made streaks visible to a small group instead of just the individual. Accountability isn't a feature you add later.",
    },
    {
      platform: "LinkedIn",
      tone: "casual",
      event: "New version",
      score: 0.54,
      content:
        "New in the Habit Tracker: one \"cover day\" per person per month, so a single bad Tuesday doesn't nuke a 60-day team streak. Forgiveness, shipped.",
    },
    {
      platform: "Twitter",
      tone: "professional",
      event: "New version",
      score: 0.67,
      content:
        "Habit Tracker 1.4 adds monthly cover days, squad invites by link, and a weekly digest your team actually reads because it's four lines long.",
    },
    {
      platform: "WhatsApp",
      tone: "professional",
      event: "New review",
      score: 0.47,
      content:
        "TeamX's Habit Tracker is now in open beta — shared streaks for teams of 3 to 8, free while in beta: habittracker.teamx.app",
    },
  ],
};

export const posts: Post[] = Object.entries(postSeed).flatMap(([appId, list]) =>
  list.map((p, i) => ({ ...p, appId, id: `${appId}-${i}` })),
);

export const platformStats: Record<string, PlatformStat[]> = {
  "demo-app": [
    { platform: "Twitter", shown: 19, chosen: 14 },
    { platform: "Reddit", shown: 17, chosen: 9 },
    { platform: "WhatsApp", shown: 13, chosen: 4 },
    { platform: "LinkedIn", shown: 11, chosen: 7 },
  ],
  "focus-timer": [
    { platform: "Twitter", shown: 23, chosen: 13 },
    { platform: "Reddit", shown: 16, chosen: 11 },
    { platform: "WhatsApp", shown: 9, chosen: 2 },
    { platform: "LinkedIn", shown: 14, chosen: 5 },
  ],
  "habit-tracker": [
    { platform: "Twitter", shown: 8, chosen: 3 },
    { platform: "Reddit", shown: 7, chosen: 4 },
    { platform: "WhatsApp", shown: 6, chosen: 5 },
    { platform: "LinkedIn", shown: 12, chosen: 6 },
  ],
};

export const feedEvents: FeedEvent[] = [
  { id: "f1", appId: "demo-app", ts: "14:32:07", type: "post.published", payload: 'platform="twitter" tone="casual" score=0.91' },
  { id: "f2", appId: "demo-app", ts: "14:31:44", type: "content.generated", payload: 'event="milestone" variants=8 latency=612ms' },
  { id: "f3", appId: "demo-app", ts: "14:29:58", type: "event.received", payload: 'type="milestone" value="1000_downloads"' },
  { id: "f4", appId: "focus-timer", ts: "14:26:11", type: "post.published", payload: 'platform="reddit" tone="casual" score=0.80' },
  { id: "f5", appId: "demo-app", ts: "14:24:03", type: "strategy.reranked", payload: 'twitter=+0.04 whatsapp=-0.06' },
  { id: "f6", appId: "habit-tracker", ts: "14:19:37", type: "sdk.handshake", payload: 'sdk="0.4.1" platform="expo" ok=true' },
  { id: "f7", appId: "demo-app", ts: "14:12:50", type: "content.generated", payload: 'event="new_review" variants=4 latency=488ms' },
  { id: "f8", appId: "demo-app", ts: "14:08:19", type: "event.received", payload: 'type="new_review" rating=5' },
  { id: "f9", appId: "focus-timer", ts: "13:57:02", type: "post.published", payload: 'platform="linkedin" tone="professional" score=0.76' },
  { id: "f10", appId: "focus-timer", ts: "13:44:26", type: "content.generated", payload: 'event="new_version" variants=6 latency=703ms' },
  { id: "f11", appId: "habit-tracker", ts: "13:31:15", type: "event.received", payload: 'type="milestone" value="250_squads"' },
  { id: "f12", appId: "habit-tracker", ts: "13:30:58", type: "content.generated", payload: 'event="milestone" variants=8 latency=559ms' },
  { id: "f13", appId: "demo-app", ts: "12:58:41", type: "post.skipped", payload: 'platform="whatsapp" reason="user_dismissed"' },
  { id: "f14", appId: "demo-app", ts: "12:41:09", type: "strategy.reranked", payload: 'reddit=+0.02 linkedin=+0.01' },
  { id: "f15", appId: "focus-timer", ts: "12:20:33", type: "event.received", payload: 'type="new_version" build="2.0.0"' },
  { id: "f16", appId: "demo-app", ts: "11:47:52", type: "post.published", payload: 'platform="reddit" tone="casual" score=0.84' },
  { id: "f17", appId: "habit-tracker", ts: "11:12:04", type: "post.published", payload: 'platform="whatsapp" tone="casual" score=0.64' },
  { id: "f18", appId: "demo-app", ts: "10:39:21", type: "event.received", payload: 'type="launch" store="ios,android"' },
  { id: "f19", appId: "focus-timer", ts: "09:58:47", type: "sdk.handshake", payload: 'sdk="0.4.1" platform="react-native" ok=true' },
  { id: "f20", appId: "demo-app", ts: "09:14:36", type: "content.generated", payload: 'event="launch" variants=8 latency=771ms' },
];

const eventTemplates = [
  { type: "event.received", payload: 'type="milestone" value="referral_sent"' },
  { type: "content.generated", payload: 'event="milestone" variants=8 latency=624ms' },
  { type: "post.published", payload: 'platform="twitter" tone="casual" score=0.88' },
  { type: "strategy.reranked", payload: 'twitter=+0.03 reddit=-0.01' },
  { type: "post.skipped", payload: 'platform="linkedin" reason="user_dismissed"' },
  { type: "sdk.heartbeat", payload: 'sessions=41 queue=0 ok=true' },
];

export function nextMockEvent(appId: string, seq: number): FeedEvent {
  const t = eventTemplates[seq % eventTemplates.length];
  const now = new Date();
  const ts = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
  return { id: `live-${seq}-${now.getTime()}`, appId, ts, ...t };
}

export function getApp(appId: string) {
  return apps.find((a) => a.id === appId);
}
