/**
 * Demo app configuration.
 *
 * Point API_URL at your running backend. When testing on a physical phone via
 * Expo Go, `localhost` refers to the phone, not your laptop — use your machine's
 * LAN IP (e.g. http://192.168.1.24:3001/api) or a deployed URL.
 */

/** UUID of the `apps` row created via POST /api/apps. */
export const APP_ID = process.env.EXPO_PUBLIC_AUTOPROMO_APP_ID ?? "REPLACE_WITH_REAL_APP_UUID";

/** Base URL of the AutoPromo API. */
export const API_URL = process.env.EXPO_PUBLIC_AUTOPROMO_API_URL ?? "http://localhost:3001/api";

/** Canonical URL of the app being promoted. */
export const APP_URL = process.env.EXPO_PUBLIC_AUTOPROMO_APP_URL ?? "https://pocketrecipe.app";
