import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

/**
 * Server-side Supabase client using the service-role key.
 *
 * The service-role key bypasses row-level security entirely, so this client
 * must never be imported by anything that runs in a browser. Credentials are
 * validated at boot in `env.ts`.
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
