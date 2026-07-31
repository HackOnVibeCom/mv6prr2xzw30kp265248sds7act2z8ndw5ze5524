export type Platform = "Twitter" | "Reddit" | "WhatsApp" | "LinkedIn" | "Telegram" | "Facebook";
export type Tone = "casual" | "professional" | "hype" | "technical";
export type EventType = "Launch" | "Milestone" | "New version" | "New review";

export const PLATFORMS: Platform[] = [
  "Twitter",
  "Reddit",
  "WhatsApp",
  "LinkedIn",
  "Telegram",
  "Facebook",
];
export const TONES: Tone[] = ["casual", "professional", "hype", "technical"];
export const EVENTS: EventType[] = ["Launch", "Milestone", "New version", "New review"];

export interface App {
  id: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  status: "active" | "idle" | "onboarding";
  sdkVersion: string;
  platform: string;
  apiKey: string;
  installs: number;
  rating: number;
  postsGenerated: number;
  postsPublished: number;
  connectedAt: string;
}

export interface Post {
  id: string;
  appId: string;
  platform: Platform;
  tone: Tone;
  event: EventType;
  content: string;
  score: number;
  hashtags: string[];
  createdAt: string;
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

export interface Review {
  id: string;
  appId: string;
  author: string;
  rating: number;
  body: string;
  store: "App Store" | "Play Store";
  date: string;
}

export interface DayPoint {
  day: string;
  generated: number;
  published: number;
}

/* ------------------------------------------------------------------ apps */

export const apps: App[] = [
  {
    id: "demo-app",
    name: "PocketRecipe",
    tagline: "Scan your fridge, get dinner.",
    description: "Scan your fridge, get a dinner plan in 20 seconds. No 800-word blog post first.",
    url: "https://pocketrecipe.app",
    status: "active",
    sdkVersion: "0.4.1",
    platform: "Expo / React Native",
    apiKey: "ap_live_7f3c9a21b4de",
    installs: 1284,
    rating: 4.8,
    postsGenerated: 96,
    postsPublished: 41,
    connectedAt: "12 Jul 2026",
  },
  {
    id: "focus-timer",
    name: "FocusTimer",
    tagline: "A timer that mutes your loudest apps.",
    description: "A pomodoro timer that quietly blocks the apps you doomscroll while it runs.",
    url: "https://focustimer.app",
    status: "active",
    sdkVersion: "0.4.1",
    platform: "React Native",
    apiKey: "ap_live_2b81ef40c7aa",
    installs: 5390,
    rating: 4.6,
    postsGenerated: 74,
    postsPublished: 33,
    connectedAt: "28 Jun 2026",
  },
  {
    id: "habit-tracker",
    name: "TeamX Habit Tracker",
    tagline: "Streaks your squad can see.",
    description: "Streak-based habit tracking built for small teams, with one cover day a month.",
    url: "https://habittracker.teamx.app",
    status: "idle",
    sdkVersion: "0.4.0",
    platform: "Flutter",
    apiKey: "ap_live_9d20cc65fe13",
    installs: 2210,
    rating: 4.4,
    postsGenerated: 52,
    postsPublished: 18,
    connectedAt: "03 Jul 2026",
  },
  {
    id: "splitbill",
    name: "SplitBill Lite",
    tagline: "Settle the group tab in two taps.",
    description: "Photograph the receipt, tag who ate what, send everyone a payment link.",
    url: "https://splitbill.app",
    status: "active",
    sdkVersion: "0.4.1",
    platform: "Swift / iOS",
    apiKey: "ap_live_51ba7d38e0cf",
    installs: 860,
    rating: 4.7,
    postsGenerated: 38,
    postsPublished: 12,
    connectedAt: "21 Jul 2026",
  },
  {
    id: "nightsky",
    name: "NightSky AR",
    tagline: "Point up, learn the sky.",
    description: "Augmented-reality star map that names what you're looking at, offline.",
    url: "https://nightsky.app",
    status: "onboarding",
    sdkVersion: "0.4.1",
    platform: "Unity",
    apiKey: "ap_test_c4e9012aa7b6",
    installs: 143,
    rating: 4.9,
    postsGenerated: 9,
    postsPublished: 2,
    connectedAt: "29 Jul 2026",
  },
];

export function getApp(appId: string) {
  return apps.find((a) => a.id === appId);
}

/* ----------------------------------------------------------------- posts */

type Seed = Omit<Post, "id" | "appId" | "createdAt"> & { createdAt?: string };

const postSeed: Record<string, Seed[]> = {
  "demo-app": [
    {
      platform: "Twitter",
      tone: "casual",
      event: "Launch",
      score: 0.91,
      hashtags: ["#buildinpublic", "#iosdev"],
      content:
        "PocketRecipe is live 🎉 Point your camera at the fridge, get a dinner you can actually cook tonight. No 800-word blog post before the ingredients. iOS + Android, free.",
    },
    {
      platform: "Twitter",
      tone: "hype",
      event: "Milestone",
      score: 0.87,
      hashtags: ["#1000downloads", "#indieapp"],
      content:
        "1,000 downloads in SEVEN DAYS 🔥 A thousand people pointed their phone at a fridge this week and cooked something. PocketRecipe is free, go break it.",
    },
    {
      platform: "Twitter",
      tone: "professional",
      event: "Milestone",
      score: 0.78,
      hashtags: ["#productanalytics"],
      content:
        "PocketRecipe just passed 1,000 downloads in its first week. Median time from photo to full recipe: 19 seconds. Thanks to everyone cooking with us.",
    },
    {
      platform: "Twitter",
      tone: "casual",
      event: "New review",
      score: 0.69,
      hashtags: ["#appreview"],
      content:
        '⭐⭐⭐⭐⭐ "Used it four nights in a row and didn\'t order once." That\'s the review. That\'s the whole post. PocketRecipe, free on both stores.',
    },
    {
      platform: "Reddit",
      tone: "casual",
      event: "Launch",
      score: 0.84,
      hashtags: [],
      content:
        "I got tired of scrolling past someone's childhood memories to find a pasta recipe, so I built PocketRecipe — snap your fridge shelf, it tells you what you can make with what's already in there. Free, no ads. Would love r/cooking's brutal feedback.",
    },
    {
      platform: "Reddit",
      tone: "technical",
      event: "New version",
      score: 0.66,
      hashtags: [],
      content:
        "PocketRecipe 1.2: on-device ingredient detection moved to a quantised MobileNetV3 head (40% faster, 11MB smaller), offline pantry sync via CRDT, and a metric/imperial toggle that finally persists. Full changelog and known issues in the comments.",
    },
    {
      platform: "Reddit",
      tone: "casual",
      event: "New review",
      score: 0.61,
      hashtags: [],
      content:
        "Someone left a review saying PocketRecipe stopped them buying duplicate herbs and honestly that's a better pitch than anything on our landing page. AMA about building it solo in six weeks.",
    },
    {
      platform: "WhatsApp",
      tone: "casual",
      event: "Milestone",
      score: 0.73,
      hashtags: [],
      content:
        "Hey! You know how I never know what to cook? I've been using this app PocketRecipe — take a photo of the fridge and it gives you a recipe from what's in there. Genuinely saved me three takeaways this week: pocketrecipe.app",
    },
    {
      platform: "WhatsApp",
      tone: "professional",
      event: "New review",
      score: 0.52,
      hashtags: [],
      content:
        "Sharing something our users have been enjoying: PocketRecipe turns a photo of your ingredients into a step-by-step meal plan. Rated 4.8 on the App Store this week. pocketrecipe.app",
    },
    {
      platform: "LinkedIn",
      tone: "professional",
      event: "Milestone",
      score: 0.81,
      hashtags: ["#productdevelopment", "#startups"],
      content:
        "1,000 downloads in seven days for PocketRecipe. What moved the needle wasn't the launch post — it was shipping the pantry-sync fix on day three and telling the 40 people who reported it. Building in public works when the public gets replied to.",
    },
    {
      platform: "LinkedIn",
      tone: "casual",
      event: "New review",
      score: 0.58,
      hashtags: ["#indiehackers"],
      content:
        'Best review we\'ve had so far: "I stopped buying coriander I already own." Small win, but that\'s the whole product in one sentence. PocketRecipe is free on iOS and Android.',
    },
    {
      platform: "Telegram",
      tone: "casual",
      event: "New version",
      score: 0.64,
      hashtags: [],
      content:
        "PocketRecipe 1.2 just landed — offline pantry, faster scans, and it remembers whether you're a grams or cups person. Update is live on both stores: pocketrecipe.app",
    },
    {
      platform: "Facebook",
      tone: "casual",
      event: "Launch",
      score: 0.56,
      hashtags: [],
      content:
        "We made an app for the 6pm 'what's for dinner' panic. Photograph the fridge, PocketRecipe does the rest. Free, no ads, no login. pocketrecipe.app",
    },
  ],
  "focus-timer": [
    {
      platform: "Twitter",
      tone: "casual",
      event: "Launch",
      score: 0.88,
      hashtags: ["#productivity"],
      content:
        "FocusTimer is out. It's a pomodoro timer, except when the timer starts it actually mutes the apps you doomscroll. Twenty-five minutes, no negotiation. Free on Android today, iOS next week.",
    },
    {
      platform: "Twitter",
      tone: "professional",
      event: "New version",
      score: 0.74,
      hashtags: ["#androiddev"],
      content:
        "FocusTimer 2.0: custom block lists, a weekly focus report, and Do Not Disturb handoff so your timer and your phone finally agree with each other.",
    },
    {
      platform: "Twitter",
      tone: "professional",
      event: "New review",
      score: 0.55,
      hashtags: [],
      content:
        '"First timer app I haven\'t uninstalled by Wednesday." We\'ll take it. FocusTimer 2.0 is live on Android and iOS.',
    },
    {
      platform: "Reddit",
      tone: "casual",
      event: "Launch",
      score: 0.8,
      hashtags: [],
      content:
        "Built FocusTimer because every timer app I tried let me tab away in the first 90 seconds. This one blocks the apps you pick for the duration of the session. No account, no subscription. r/productivity, tell me what's missing.",
    },
    {
      platform: "Reddit",
      tone: "technical",
      event: "Milestone",
      score: 0.63,
      hashtags: [],
      content:
        "FocusTimer crossed 5,000 completed sessions this month. Average length 24m11s, completion rate 81%, measured on-device with no analytics SDK. Sharing the aggregate numbers and how we collect them in the comments.",
    },
    {
      platform: "WhatsApp",
      tone: "casual",
      event: "Milestone",
      score: 0.57,
      hashtags: [],
      content:
        "Try this if you're revising — FocusTimer locks the apps you keep opening for 25 mins at a time. I've done 12 sessions this week which is 12 more than usual: focustimer.app",
    },
    {
      platform: "WhatsApp",
      tone: "professional",
      event: "New version",
      score: 0.49,
      hashtags: [],
      content:
        "FocusTimer 2.0 is available now with weekly focus reports and custom block lists. Free, no account required: focustimer.app",
    },
    {
      platform: "LinkedIn",
      tone: "professional",
      event: "Milestone",
      score: 0.76,
      hashtags: ["#focus", "#buildinpublic"],
      content:
        "5,000 focus sessions completed in FocusTimer this month. The interesting number isn't the total — it's that 81% of started sessions run to completion. Friction, applied deliberately, works.",
    },
    {
      platform: "LinkedIn",
      tone: "casual",
      event: "Launch",
      score: 0.6,
      hashtags: [],
      content:
        "Shipped FocusTimer today after four months of evenings. It's a timer that blocks your worst apps while it runs. Simple idea, surprisingly hard to make feel gentle instead of punishing.",
    },
    {
      platform: "Telegram",
      tone: "hype",
      event: "Milestone",
      score: 0.68,
      hashtags: [],
      content:
        "5,000 SESSIONS. That's 2,000+ hours of people not looking at their phones, on purpose. FocusTimer 2.0 is free: focustimer.app",
    },
    {
      platform: "Facebook",
      tone: "casual",
      event: "New version",
      score: 0.45,
      hashtags: [],
      content:
        "FocusTimer 2.0 is here: pick the apps that steal your attention, and they stay shut while the timer runs. Free on Android and iOS.",
    },
  ],
  "habit-tracker": [
    {
      platform: "Twitter",
      tone: "casual",
      event: "Launch",
      score: 0.86,
      hashtags: ["#habits"],
      content:
        "We built a habit tracker for teams, not for lonely streak guilt. TeamX Habit Tracker shows your squad's streaks side by side — miss a day and someone notices. That's the feature. Free beta open now.",
    },
    {
      platform: "Twitter",
      tone: "professional",
      event: "New version",
      score: 0.67,
      hashtags: [],
      content:
        "Habit Tracker 1.4 adds monthly cover days, squad invites by link, and a weekly digest your team actually reads because it's four lines long.",
    },
    {
      platform: "Reddit",
      tone: "casual",
      event: "Launch",
      score: 0.71,
      hashtags: [],
      content:
        "Every habit app I've used is single-player. We made one where a small team shares streaks and can cover for each other once a month. Beta is open and free, looking for teams of 3–8 to break it.",
    },
    {
      platform: "Reddit",
      tone: "technical",
      event: "Milestone",
      score: 0.59,
      hashtags: [],
      content:
        "250 active squads on our team habit tracker. Day-30 retention is 44%, roughly double the solo-only prototype, same onboarding. Cohort methodology and the raw curve in the comments.",
    },
    {
      platform: "WhatsApp",
      tone: "casual",
      event: "Milestone",
      score: 0.64,
      hashtags: [],
      content:
        "Want to do the gym thing properly this time? Join my squad on TeamX Habit Tracker — we all see each other's streaks so nobody quietly stops. habittracker.teamx.app",
    },
    {
      platform: "WhatsApp",
      tone: "professional",
      event: "New review",
      score: 0.47,
      hashtags: [],
      content:
        "TeamX Habit Tracker is now in open beta — shared streaks for teams of 3 to 8, free while in beta: habittracker.teamx.app",
    },
    {
      platform: "LinkedIn",
      tone: "professional",
      event: "Milestone",
      score: 0.79,
      hashtags: ["#retention", "#productled"],
      content:
        "250 active squads on TeamX Habit Tracker. Day-30 retention doubled when we made streaks visible to a small group instead of just the individual. Accountability isn't a feature you add later.",
    },
    {
      platform: "LinkedIn",
      tone: "casual",
      event: "New version",
      score: 0.54,
      hashtags: [],
      content:
        'New in the Habit Tracker: one "cover day" per person per month, so a single bad Tuesday doesn\'t nuke a 60-day team streak. Forgiveness, shipped.',
    },
    {
      platform: "Telegram",
      tone: "casual",
      event: "New review",
      score: 0.5,
      hashtags: [],
      content:
        '"My squad noticed before I did." Best review we\'ve had. Open beta, free: habittracker.teamx.app',
    },
  ],
  splitbill: [
    {
      platform: "Twitter",
      tone: "casual",
      event: "Launch",
      score: 0.83,
      hashtags: ["#iosdev"],
      content:
        "SplitBill Lite is live. Photograph the receipt, tap who had the calamari, everyone gets a payment link. No group chat maths at midnight. Free on iOS.",
    },
    {
      platform: "Twitter",
      tone: "hype",
      event: "Milestone",
      score: 0.72,
      hashtags: ["#indieapp"],
      content:
        "500 bills split in the first fortnight 🧾 That's roughly 2,300 people who didn't have to say 'just Venmo me whatever'. SplitBill Lite, free.",
    },
    {
      platform: "Reddit",
      tone: "casual",
      event: "Launch",
      score: 0.75,
      hashtags: [],
      content:
        "Made SplitBill Lite after a birthday dinner took 40 minutes to settle. Scan the receipt, assign items by tapping, it generates payment links. No signup, nothing stored after 24h. Roast the UX please.",
    },
    {
      platform: "WhatsApp",
      tone: "casual",
      event: "Milestone",
      score: 0.7,
      hashtags: [],
      content:
        "For next time we go out — SplitBill Lite. Photo of the receipt, tap what you had, it sends everyone their exact amount: splitbill.app",
    },
    {
      platform: "LinkedIn",
      tone: "professional",
      event: "Milestone",
      score: 0.62,
      hashtags: ["#fintech"],
      content:
        "500 bills split in two weeks with SplitBill Lite. Average settle time went from 'sometime next week' to 90 seconds. Receipt OCR runs entirely on-device.",
    },
    {
      platform: "Telegram",
      tone: "casual",
      event: "New version",
      score: 0.48,
      hashtags: [],
      content:
        "SplitBill 1.1: multi-currency, tip splitting, and a share sheet that doesn't lose your selections. splitbill.app",
    },
    {
      platform: "Facebook",
      tone: "casual",
      event: "New review",
      score: 0.41,
      hashtags: [],
      content:
        '"Paid off the whole table before the waiter came back." Thanks for the review — SplitBill Lite is free on iOS.',
    },
  ],
  nightsky: [
    {
      platform: "Twitter",
      tone: "hype",
      event: "Launch",
      score: 0.79,
      hashtags: ["#astronomy", "#AR"],
      content:
        "NightSky AR is out 🌌 Point your phone up, it names every star, planet and satellite you're looking at. Works with zero signal in the middle of nowhere. Free.",
    },
    {
      platform: "Reddit",
      tone: "technical",
      event: "Launch",
      score: 0.68,
      hashtags: [],
      content:
        "NightSky AR ships a 12MB offline catalogue (Hipparcos subset + Starlink TLEs refreshed weekly) and does plate-solving on the gyro feed alone. r/astrophotography, tell me where the alignment drifts.",
    },
    {
      platform: "LinkedIn",
      tone: "professional",
      event: "Launch",
      score: 0.57,
      hashtags: ["#AR", "#unity"],
      content:
        "Launched NightSky AR today — a fully offline augmented-reality star map. The hard part wasn't rendering the sky, it was making orientation stable enough to trust at arm's length.",
    },
    {
      platform: "WhatsApp",
      tone: "casual",
      event: "Launch",
      score: 0.44,
      hashtags: [],
      content:
        "If you're camping this weekend get NightSky AR — hold your phone up and it labels everything in the sky, no signal needed: nightsky.app",
    },
  ],
};

const baseTimes = ["09:14", "10:02", "11:47", "12:41", "13:30", "14:08", "14:29", "15:03", "15:52", "16:20", "17:05", "18:12", "19:40"];

export const posts: Post[] = Object.entries(postSeed).flatMap(([appId, list]) =>
  list.map((p, i) => ({
    ...p,
    appId,
    id: `${appId}-${i}`,
    createdAt: baseTimes[i % baseTimes.length]!,
  })),
);

export function getPosts(appId: string) {
  return posts.filter((p) => p.appId === appId);
}

/* ------------------------------------------------------- strategy engine */

export const platformStats: Record<string, PlatformStat[]> = {
  "demo-app": [
    { platform: "Twitter", shown: 19, chosen: 14 },
    { platform: "Reddit", shown: 17, chosen: 9 },
    { platform: "LinkedIn", shown: 11, chosen: 7 },
    { platform: "WhatsApp", shown: 13, chosen: 4 },
    { platform: "Telegram", shown: 8, chosen: 3 },
    { platform: "Facebook", shown: 7, chosen: 1 },
  ],
  "focus-timer": [
    { platform: "Twitter", shown: 23, chosen: 13 },
    { platform: "Reddit", shown: 16, chosen: 11 },
    { platform: "LinkedIn", shown: 14, chosen: 5 },
    { platform: "WhatsApp", shown: 9, chosen: 2 },
    { platform: "Telegram", shown: 6, chosen: 2 },
    { platform: "Facebook", shown: 5, chosen: 0 },
  ],
  "habit-tracker": [
    { platform: "LinkedIn", shown: 12, chosen: 6 },
    { platform: "WhatsApp", shown: 6, chosen: 5 },
    { platform: "Reddit", shown: 7, chosen: 4 },
    { platform: "Twitter", shown: 8, chosen: 3 },
    { platform: "Telegram", shown: 4, chosen: 1 },
    { platform: "Facebook", shown: 3, chosen: 0 },
  ],
  splitbill: [
    { platform: "Twitter", shown: 11, chosen: 6 },
    { platform: "WhatsApp", shown: 9, chosen: 5 },
    { platform: "Reddit", shown: 6, chosen: 2 },
    { platform: "LinkedIn", shown: 5, chosen: 2 },
    { platform: "Telegram", shown: 3, chosen: 1 },
    { platform: "Facebook", shown: 2, chosen: 0 },
  ],
  nightsky: [
    { platform: "Twitter", shown: 4, chosen: 2 },
    { platform: "Reddit", shown: 3, chosen: 1 },
    { platform: "LinkedIn", shown: 2, chosen: 1 },
    { platform: "WhatsApp", shown: 2, chosen: 0 },
    { platform: "Telegram", shown: 1, chosen: 0 },
    { platform: "Facebook", shown: 1, chosen: 0 },
  ],
};

export const toneStats: Record<string, { tone: Tone; chosen: number; shown: number }[]> = {
  "demo-app": [
    { tone: "casual", shown: 31, chosen: 21 },
    { tone: "professional", shown: 24, chosen: 11 },
    { tone: "hype", shown: 12, chosen: 5 },
    { tone: "technical", shown: 9, chosen: 4 },
  ],
  "focus-timer": [
    { tone: "casual", shown: 26, chosen: 15 },
    { tone: "professional", shown: 22, chosen: 12 },
    { tone: "technical", shown: 11, chosen: 5 },
    { tone: "hype", shown: 8, chosen: 1 },
  ],
  "habit-tracker": [
    { tone: "professional", shown: 18, chosen: 9 },
    { tone: "casual", shown: 16, chosen: 7 },
    { tone: "technical", shown: 5, chosen: 2 },
    { tone: "hype", shown: 3, chosen: 0 },
  ],
  splitbill: [
    { tone: "casual", shown: 14, chosen: 8 },
    { tone: "hype", shown: 6, chosen: 2 },
    { tone: "professional", shown: 8, chosen: 2 },
    { tone: "technical", shown: 2, chosen: 0 },
  ],
  nightsky: [
    { tone: "hype", shown: 4, chosen: 1 },
    { tone: "technical", shown: 3, chosen: 1 },
    { tone: "professional", shown: 2, chosen: 0 },
    { tone: "casual", shown: 2, chosen: 0 },
  ],
};

/* --------------------------------------------------------------- history */

export const activity: Record<string, DayPoint[]> = {
  "demo-app": [
    { day: "Mon", generated: 8, published: 3 },
    { day: "Tue", generated: 14, published: 6 },
    { day: "Wed", generated: 11, published: 5 },
    { day: "Thu", generated: 19, published: 9 },
    { day: "Fri", generated: 16, published: 7 },
    { day: "Sat", generated: 13, published: 6 },
    { day: "Sun", generated: 15, published: 5 },
  ],
  "focus-timer": [
    { day: "Mon", generated: 10, published: 4 },
    { day: "Tue", generated: 9, published: 5 },
    { day: "Wed", generated: 12, published: 6 },
    { day: "Thu", generated: 7, published: 3 },
    { day: "Fri", generated: 15, published: 7 },
    { day: "Sat", generated: 11, published: 5 },
    { day: "Sun", generated: 10, published: 3 },
  ],
  "habit-tracker": [
    { day: "Mon", generated: 6, published: 2 },
    { day: "Tue", generated: 8, published: 3 },
    { day: "Wed", generated: 5, published: 1 },
    { day: "Thu", generated: 9, published: 4 },
    { day: "Fri", generated: 7, published: 2 },
    { day: "Sat", generated: 10, published: 3 },
    { day: "Sun", generated: 7, published: 3 },
  ],
  splitbill: [
    { day: "Mon", generated: 4, published: 1 },
    { day: "Tue", generated: 6, published: 2 },
    { day: "Wed", generated: 5, published: 2 },
    { day: "Thu", generated: 8, published: 3 },
    { day: "Fri", generated: 6, published: 2 },
    { day: "Sat", generated: 5, published: 1 },
    { day: "Sun", generated: 4, published: 1 },
  ],
  nightsky: [
    { day: "Mon", generated: 0, published: 0 },
    { day: "Tue", generated: 1, published: 0 },
    { day: "Wed", generated: 2, published: 1 },
    { day: "Thu", generated: 1, published: 0 },
    { day: "Fri", generated: 2, published: 1 },
    { day: "Sat", generated: 2, published: 0 },
    { day: "Sun", generated: 1, published: 0 },
  ],
};

/* --------------------------------------------------------------- reviews */

export const reviews: Review[] = [
  { id: "r1", appId: "demo-app", author: "hannah_k", rating: 5, store: "App Store", date: "30 Jul", body: "Used it four nights in a row and didn't order takeaway once. The fridge scan is genuinely accurate." },
  { id: "r2", appId: "demo-app", author: "m.oduya", rating: 5, store: "Play Store", date: "29 Jul", body: "I stopped buying coriander I already own. Worth it for that alone." },
  { id: "r3", appId: "demo-app", author: "tinytoast", rating: 4, store: "App Store", date: "27 Jul", body: "Great idea, but it thinks every green thing is a courgette. Still cooking with it daily." },
  { id: "r4", appId: "focus-timer", author: "dev_marcus", rating: 5, store: "Play Store", date: "30 Jul", body: "First timer app I haven't uninstalled by Wednesday. The blocking is what makes it work." },
  { id: "r5", appId: "focus-timer", author: "reva.s", rating: 4, store: "Play Store", date: "26 Jul", body: "Weekly report is lovely. Wish I could schedule sessions in advance." },
  { id: "r6", appId: "habit-tracker", author: "squadleadjo", rating: 5, store: "App Store", date: "28 Jul", body: "My squad noticed I'd stopped before I did. That's the entire point of it." },
  { id: "r7", appId: "habit-tracker", author: "p_ferreira", rating: 4, store: "Play Store", date: "24 Jul", body: "Cover days saved our 60-day streak. Invites could be simpler." },
  { id: "r8", appId: "splitbill", author: "nkechi.a", rating: 5, store: "App Store", date: "29 Jul", body: "Paid off the whole table before the waiter came back. Ridiculous how fast it is." },
  { id: "r9", appId: "splitbill", author: "tomtomtom", rating: 4, store: "App Store", date: "25 Jul", body: "OCR struggled with a faded receipt but manual entry was quick." },
  { id: "r10", appId: "nightsky", author: "orion_dad", rating: 5, store: "Play Store", date: "30 Jul", body: "Took it camping with no signal and it worked perfectly. My kid named six constellations." },
];

export function getReviews(appId: string) {
  return reviews.filter((r) => r.appId === appId);
}

/* ------------------------------------------------------------- live feed */

const rawFeed: Omit<FeedEvent, "id">[] = [
  { appId: "demo-app", ts: "14:32:07", type: "post.published", payload: 'platform="twitter" tone="casual" score=0.91' },
  { appId: "demo-app", ts: "14:31:44", type: "content.generated", payload: 'event="milestone" variants=8 latency=612ms' },
  { appId: "demo-app", ts: "14:29:58", type: "event.received", payload: 'type="milestone" value="1000_downloads"' },
  { appId: "splitbill", ts: "14:28:12", type: "post.published", payload: 'platform="whatsapp" tone="casual" score=0.70' },
  { appId: "focus-timer", ts: "14:26:11", type: "post.published", payload: 'platform="reddit" tone="casual" score=0.80' },
  { appId: "demo-app", ts: "14:24:03", type: "strategy.reranked", payload: 'twitter=+0.04 whatsapp=-0.06' },
  { appId: "nightsky", ts: "14:21:49", type: "sdk.handshake", payload: 'sdk="0.4.1" platform="unity" ok=true' },
  { appId: "habit-tracker", ts: "14:19:37", type: "sdk.handshake", payload: 'sdk="0.4.0" platform="flutter" ok=true' },
  { appId: "demo-app", ts: "14:12:50", type: "content.generated", payload: 'event="new_review" variants=4 latency=488ms' },
  { appId: "demo-app", ts: "14:08:19", type: "event.received", payload: 'type="new_review" rating=5' },
  { appId: "splitbill", ts: "14:02:31", type: "content.generated", payload: 'event="milestone" variants=6 latency=534ms' },
  { appId: "focus-timer", ts: "13:57:02", type: "post.published", payload: 'platform="linkedin" tone="professional" score=0.76' },
  { appId: "focus-timer", ts: "13:44:26", type: "content.generated", payload: 'event="new_version" variants=6 latency=703ms' },
  { appId: "habit-tracker", ts: "13:31:15", type: "event.received", payload: 'type="milestone" value="250_squads"' },
  { appId: "habit-tracker", ts: "13:30:58", type: "content.generated", payload: 'event="milestone" variants=8 latency=559ms' },
  { appId: "nightsky", ts: "13:14:20", type: "event.received", payload: 'type="launch" store="android"' },
  { appId: "demo-app", ts: "12:58:41", type: "post.skipped", payload: 'platform="whatsapp" reason="user_dismissed"' },
  { appId: "demo-app", ts: "12:41:09", type: "strategy.reranked", payload: 'reddit=+0.02 linkedin=+0.01' },
  { appId: "focus-timer", ts: "12:20:33", type: "event.received", payload: 'type="new_version" build="2.0.0"' },
  { appId: "splitbill", ts: "12:04:57", type: "event.received", payload: 'type="milestone" value="500_bills"' },
  { appId: "demo-app", ts: "11:47:52", type: "post.published", payload: 'platform="reddit" tone="casual" score=0.84' },
  { appId: "habit-tracker", ts: "11:12:04", type: "post.published", payload: 'platform="whatsapp" tone="casual" score=0.64' },
  { appId: "nightsky", ts: "10:51:38", type: "content.generated", payload: 'event="launch" variants=4 latency=655ms' },
  { appId: "demo-app", ts: "10:39:21", type: "event.received", payload: 'type="launch" store="ios,android"' },
  { appId: "focus-timer", ts: "09:58:47", type: "sdk.handshake", payload: 'sdk="0.4.1" platform="react-native" ok=true' },
  { appId: "demo-app", ts: "09:14:36", type: "content.generated", payload: 'event="launch" variants=8 latency=771ms' },
];

export const feedEvents: FeedEvent[] = rawFeed.map((e, i) => ({ ...e, id: `f${i + 1}` }));

const eventTemplates: { type: string; payload: string }[] = [
  { type: "event.received", payload: 'type="milestone" value="referral_sent"' },
  { type: "content.generated", payload: 'event="milestone" variants=8 latency=624ms' },
  { type: "post.published", payload: 'platform="twitter" tone="casual" score=0.88' },
  { type: "strategy.reranked", payload: 'twitter=+0.03 reddit=-0.01' },
  { type: "post.skipped", payload: 'platform="linkedin" reason="user_dismissed"' },
  { type: "sdk.heartbeat", payload: "sessions=41 queue=0 ok=true" },
];

export function nextMockEvent(appId: string, seq: number): FeedEvent {
  const t = eventTemplates[seq % eventTemplates.length]!;
  const now = new Date();
  const ts = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
  return { id: `live-${seq}-${now.getTime()}`, appId, ts, ...t };
}

/* ---------------------------------------------------------- SDK snippets */

export const snippets: { id: string; label: string; language: string; code: string }[] = [
  {
    id: "install",
    label: "Install",
    language: "bash",
    code: `npm install @autopromo/sdk
# or
yarn add @autopromo/sdk`,
  },
  {
    id: "init",
    label: "Initialise",
    language: "ts",
    code: `import { AutoPromo } from "@autopromo/sdk";

AutoPromo.init({
  apiKey: process.env.AUTOPROMO_KEY!,
  appName: "PocketRecipe",
  appUrl: "https://pocketrecipe.app",
  defaultTone: "casual",
});`,
  },
  {
    id: "events",
    label: "Send events",
    language: "ts",
    code: `// first launch of a fresh install
AutoPromo.track("launch", { stores: ["ios", "android"] });

// any product milestone you care about
AutoPromo.track("milestone", { value: "1000_downloads", count: 1000 });

// after a release
AutoPromo.track("new_version", { build: "1.2.0", notes: "Offline pantry" });

// when a store review lands
AutoPromo.track("new_review", { rating: 5, body: review.text });`,
  },
  {
    id: "share",
    label: "Open compose sheet",
    language: "tsx",
    code: `const posts = await AutoPromo.getRankedPosts();

// opens the real native compose screen, pre-filled.
// a human always presses send.
await AutoPromo.share(posts[0]);`,
  },
];

/* -------------------------------------------------------------- rollups */

export const totals = {
  apps: apps.length,
  generated: apps.reduce((n, a) => n + a.postsGenerated, 0),
  published: apps.reduce((n, a) => n + a.postsPublished, 0),
  installs: apps.reduce((n, a) => n + a.installs, 0),
};
