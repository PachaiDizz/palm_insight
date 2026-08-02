import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client configuration.
 *
 * SECURITY: Row-Level Security (RLS) MUST be enabled on all Supabase tables.
 * All client-side queries filter by user_id for defense-in-depth, but RLS
 * policies are the primary security boundary. Without RLS, any authenticated
 * user could potentially access other users' data.
 *
 * Required RLS policies (verify in Supabase Dashboard → Authentication → Policies):
 * - daily_entries: user_id = auth.uid()
 * - team_leaders: user_id = auth.uid()
 * - plantations: user_id = auth.uid()
 * - biji_relai: user_id = auth.uid()
 *
 * See: https://supabase.com/docs/guides/auth/row-level-security
 *
 * NOTE: `supabase` is a module-level singleton. This is the recommended pattern
 * for `@supabase/ssr` browser clients — it handles token refresh and auth state
 * internally via cookies. Do NOT call `createClient()` inside component renders.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const supabase = createClient();

