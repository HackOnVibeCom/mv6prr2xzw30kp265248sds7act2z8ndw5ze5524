# AutoPromo Demo App

The Expo app judges hold in their hand. Four buttons, each firing a real SDK event at the real backend, with the generated posts landing in the same screen.

---

## Run it

```sh
cd autopromo-demo
npm install
npx expo start
```

Scan the QR code with Expo Go on a physical phone — that's the demo that lands, not a simulator.

---

## Point it at your backend

Edit [config.ts](config.ts), or set env vars:

```sh
EXPO_PUBLIC_AUTOPROMO_APP_ID=<uuid-from-POST-/api/apps>
EXPO_PUBLIC_AUTOPROMO_API_URL=http://192.168.1.24:3001/api
EXPO_PUBLIC_AUTOPROMO_APP_URL=https://pocketrecipe.app
```

> **On a physical phone, `localhost` means the phone.** Use your laptop's LAN IP or a deployed URL, or the app will silently fail to reach the backend. The status banner tells you when this happens.

Create the app record first:

```sh
curl -X POST http://localhost:3001/api/apps \
  -H "Content-Type: application/json" \
  -d '{"name":"PocketRecipe","description":"Scan your fridge, get dinner in 20 seconds."}'
```

Copy the returned `id` into `APP_ID`.

---

## What it demonstrates

| Action | SDK call | What judges see |
|---|---|---|
| App opens | `trackLaunch()` — automatic | Launch event fires with zero user input |
| Tap "1,000th download" | `trackMilestone()` | 12 ranked variants appear below |
| Tap "New version shipped" | `trackVersion()` | Feature-focused copy per platform |
| Tap "New 5-star review" | `trackReview()` | Posts **plus** a suggested reply draft |
| Tap a post's share button | `share(post, Linking.openURL)` | Real Twitter/Reddit/WhatsApp compose opens, pre-filled |

Sharing also calls `mark-chosen`, so the Strategy Engine learns from the choice and the ranking shifts on the next event.

---

## Integration surface

The entire integration is this:

```typescript
import AutoPromo from "@autopromo/sdk";

AutoPromo.init({ appId, apiUrl, appUrl });
AutoPromo.trackLaunch();
```

Everything else in this app is demo scaffolding to make the loop visible on stage.
