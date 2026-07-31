# AutoPromo Dashboard

Here's a full build prompt you can hand to a coding tool (Claude Code, v0, Cursor, or paste right back into a chat like this one) to generate the entire frontend in one go, using the exact palette we locked in.

Frontend Build Prompt — AutoPromo SDK Dashboard

Project: Build the complete frontend for "AutoPromo SDK" — a dashboard that shows AI-generated promotional content for mobile apps, ranked by a strategy engine, with one-click share buttons that open real social platform compose windows. Use Next.js (App Router), TypeScript, and Tailwind CSS. Populate everything with realistic mock data (no real backend calls needed yet) so the full UI is demoable immediately.

Design system — use exactly these tones, nothing else

Mint ramp (backgrounds, light surfaces, subtle fills): #F4FBF7 #E1F5EA #C3EBD6 #9BDCBB #6FC79C #48A97D #2E7D5E

Green ramp (primary brand — buttons, links, active states, chosen/success indicators): #EAF6EE #C2E8CE #8FD1A6 #4FAE72 #278A52 #186B3E #0F4C2C

Olive ramp (dark surfaces, headings, structural chrome, dark-mode background): #F3F2E9 #DEDCC4 #B4B389 #83815A #5C5A3D #3D3B27 #1F1E14

Warm amber accent (used sparingly — live-feed pulse dot, top-ranked post highlight, "new" badges only, never more than 2–3 uses per screen): #FDF0DD #F6CE8E #E8A13B #B9711A

Rules for using these tones:

Light mode: mint 50/100 for page background, white cards with mint 200 borders, green 500/600 for primary buttons, olive 600/700 for headings and body text.

Dark mode: olive 900 (#1F1E14) or a near-black variant for page background, olive 800 for card surfaces, mint 100/200 for body text, green 400/500 for buttons, amber reserved for live indicators only.

Never use pure black or pure white text — always pull from the ramps (olive 900 for "black" text on light backgrounds, mint 50 for "white" text on dark backgrounds).

Amber must stay rare. If more than 3 elements on one screen use it, replace the extras with green.

Typography

Display/heading font: something with a bit of character but still clean — Space Grotesk or Sora.

Body font: Inter or system-ui for readability at small sizes.

Monospace font (for the live feed timestamps and event payloads): JetBrains Mono or Fira Code.

Pages to build

1. / — Landing / overview

Hero section: product name, one-line pitch, a live-looking animated preview of a "post generating" moment (mock, but should feel alive — e.g. a card that appears with a subtle fade/slide as if just generated).

Below: 3-column feature summary (Generate, Rank, Publish) using green-family icons.

CTA button in green 600, linking to /apps/demo-app.

2. /apps/[appId] — Main dashboard

Left sidebar: list of connected apps (mock 3 apps: "PocketRecipe", "FocusTimer", "TeamX's Habit Tracker" — the third simulating your real onboarded app), each with a small colored status dot (green = active, mint = idle).

Top bar: selected app name, description, and a "Trigger event" dropdown (Launch / Milestone / New version / New review) — clicking it should visually simulate a new event appearing (mock animation, no real backend needed).

Main area: grid of generated post cards, each showing:

Platform icon + name (Twitter, Reddit, WhatsApp, LinkedIn)

Tone label (casual/professional) as a small pill

The generated content text (write 3–4 realistic mock examples per platform)

A rank score (e.g. "0.87") shown subtly in the corner

A "Post to [Platform]" button in green; once clicked (mock), it should visually transition to a "Posted ✓" state with a checkmark and slightly muted styling

The single highest-ranked card per event should have a thin amber left border and a small "Top pick" badge — this is the only place amber appears on this screen

Include a small side panel showing the Strategy Engine's learning: a simple horizontal bar chart per platform showing "times chosen / times shown" ratio, using green-ramp bars on a mint background.

3. /live/[appId] — Public live feed

Full dark-mode page (olive 900 background) regardless of the user's light/dark preference — this page should always feel like a "terminal" or "control room" view.

Monospace timestamped event stream, newest at top, each new item entering with a brief highlight flash in amber before settling into mint/olive tones.

A small pulsing dot (amber, animated pulse/glow using a CSS animation, not a static color) next to "Live" text at the top to reinforce this updates in real time.

Mock a slow trickle of new events appearing every few seconds via setInterval and mock data, so the page feels alive even without a real backend connected yet.

4. /apps — App selector / onboarding

Simple card grid of all connected apps with an "Add new app" card (dashed mint border, green plus icon) that opens a mock form (app name + description fields).

Mock data requirements

At least 3 mock apps with realistic names/descriptions (a recipe app, a productivity app, a habit tracker).

At least 8–10 mock generated posts per app, spread across all 4 platforms and both tones, with genuinely varied, realistic copy (not lorem ipsum) — write actual believable social post text for each.

At least 15–20 mock live feed events with varied timestamps (some seconds ago, some minutes ago, some hours ago) to make the feed look like it has real history.

Mock platform_stats numbers (times_shown/times_chosen) that are believable and not perfectly round (e.g. 14/19, not 10/20).

Motion and "aliveness" requirements

New cards/events should never just snap into place — use a brief fade + slight upward slide (150–250ms) on entry.

The live feed's pulse dot needs a genuine CSS pulse animation (scale + opacity loop), not a static dot.

Buttons need visible hover and active states using the ramp's adjacent shades (e.g., green 600 default → green 700 hover → scale(0.98) on click).

Respect prefers-reduced-motion — fall back to instant state changes for users who have that set.

Accessibility and polish requirements

All interactive elements need visible keyboard focus rings (use a green-ramp focus ring, not browser default blue).

Color contrast must pass WCAG AA for all text/background combinations from the ramps above — double-check pale mint text is never placed on pale mint backgrounds.

Fully responsive down to mobile width (375px) — sidebar collapses to a bottom nav or hamburger on small screens.

Empty states (e.g., an app with no generated posts yet) should read as an invitation, not an error — e.g. "No posts yet — trigger an event above to generate your first one," not "No data found."

What NOT to do

Do not use gradients, drop shadows, or neon glow effects anywhere — flat surfaces only, per the palette.

Do not introduce any color outside the four ramps above (no random blues, purples, or reds sneaking in via default component libraries — override any default theme colors).

Do not make every element animate — motion should be occasional and purposeful (new items entering, the live pulse, button presses), not constant background movement.

Paste this directly into whatever tool builds your frontend. Want me to also write the actual mock data file (a mockData.ts with the 3 apps, ~10 posts each, and ~20 feed events) so the tool has real content to work from instead of generating its own?

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f0a7b634-fb29-440b-bf30-a3d816b99306).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
