# @autopromo/sdk

Drop-in promotion layer for newly launched mobile apps.

Your app already knows when something worth promoting happened — a launch, the 1,000th download, a five-star review. This SDK sends those moments to the AutoPromo backend, which writes platform-tailored copy, ranks it, and hands you back posts ready to publish.

**It never posts on your behalf.** `share()` opens the platform's own compose screen with the text pre-filled; a human presses send. That's what keeps it free, ToS-compliant, and verifiable.

---

## Install

```sh
npm install @autopromo/sdk
```

Works in Expo, React Native, and the browser. No native modules, no peer dependencies.

---

## Quick start

```typescript
import AutoPromo from "@autopromo/sdk";

// 1. Once, at app startup
AutoPromo.init({
  appId: "your-app-uuid",
  apiUrl: "https://autopromo.vercel.app/api",
  appUrl: "https://yourapp.com",
});

// 2. Track real product moments
AutoPromo.trackLaunch({ stores: ["ios", "android"] });
AutoPromo.trackMilestone({ label: "1000 downloads", count: 1000 });
AutoPromo.trackVersion({ build: "2.0.0", notes: "Added dark mode" });
AutoPromo.trackReview({ rating: 5, body: review.text });

// 3. Publish
const posts = await AutoPromo.getRankedPosts();
await AutoPromo.share(posts[0]);
```

In React Native, pass `Linking.openURL` so the share opens natively:

```typescript
import { Linking } from "react-native";

await AutoPromo.share(posts[0], Linking.openURL);
```

---

## API

### `init(config)`

| Option | Type | Required | Notes |
|---|---|---|---|
| `appId` | `string` | ✅ | UUID from `POST /api/apps` |
| `apiUrl` | `string` | ✅ | Base API URL; trailing slash is fine |
| `appUrl` | `string` | — | Canonical URL attached to posts |
| `appName` | `string` | — | Logging only |
| `strict` | `boolean` | — | Throw on network errors instead of swallowing them |
| `debug` | `boolean` | — | Verbose console logging |

### Tracking

All tracking calls resolve to `TrackResult` and **never throw** unless `strict: true`.

```typescript
type TrackResult = {
  ok: boolean;
  eventId?: string;
  generated?: number;   // number of variants created
  replyDraft?: string;  // new_review events only
  error?: string;
};
```

| Method | Event type | Payload |
|---|---|---|
| `trackLaunch(payload?)` | `launch` | `{ stores?: string[] }` |
| `trackMilestone(payload)` | `milestone` | `{ label: string, count?: number }` |
| `trackVersion(payload)` | `new_version` | `{ notes: string, build?: string }` |
| `trackReview(payload)` | `new_review` | `{ text: string, rating: number }` |
| `track(type, payload)` | any | escape hatch |

### `getRankedPosts(options?)`

Returns `RankedPost[]`, already sorted by `rank_score` descending.

```typescript
const twitterOnly = await AutoPromo.getRankedPosts({
  platform: "twitter",
  tone: "casual",
  limit: 10,
});
```

### `share(post, openURL?)`

Opens the compose screen and records the choice so the Strategy Engine learns from it. Returns the URL it opened.

### `markChosen(post)`

Called automatically by `share()`. Only call it directly if you built your own share UI.

### `buildShareUrl(target)`

Pure function — builds the compose URL without opening anything. Useful for `<a href>` in web dashboards.

---

## Failure behaviour

A promotion layer must never take down the app it promotes. By default every network call:

- times out after 10s,
- swallows errors and logs a warning,
- resolves to `{ ok: false, error }` rather than rejecting.

Set `strict: true` if you'd rather handle failures yourself.

---

## Platforms

| Platform | Compose method |
|---|---|
| Twitter / X | `twitter.com/intent/tweet` |
| Reddit | `reddit.com/submit` (text post) |
| WhatsApp | `wa.me/?text=` |
| Telegram | `t.me/share/url` |
| LinkedIn | `linkedin.com/sharing/share-offsite` + OG share page |
| Facebook | `facebook.com/sharer` + OG share page |

LinkedIn and Facebook scrape Open Graph tags rather than accepting arbitrary text, so `appUrl` should point at a per-event share page (the dashboard serves these at `/share/:eventId`).

---

## Build from source

```sh
cd packages/autopromo-sdk
npm install
npm run build
```

MIT © AutoPromo
