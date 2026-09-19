import { createClient } from '@supabase/supabase-js';

/**
 * Shared backend with the RecruitOps portal. Both values are public by design —
 * the anon key ships in the browser bundle and its reach is bounded by the
 * row-level security policies on the database, not by secrecy. See the portal's
 * supabase/migrations/00024_public_job_board_anon_read.sql: `anon` may read only
 * Active/Open requisitions, and only the columns this job board renders.
 *
 * The literals are a last-resort default so a fresh checkout with no .env.local
 * still renders live roles. Set NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY (they take
 * precedence) to point a preview deployment at a different project.
 */
const DEFAULT_SUPABASE_URL = 'https://hdlliptixzorubbulkay.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkbGxpcHRpeHpvcnViYnVsa2F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNDg0NjAsImV4cCI6MjEwMjkyNDQ2MH0.YzIlZL0n9LYRY6OAkcqOkuuU_8AC5R-YPBfmSY9soF8';

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

/**
 * Whether it is worth attempting a query at all. With the defaults above this
 * is effectively always true — the seed-data path in lib/jobs-service.ts is
 * reached by an empty or failing response, not by a missing configuration.
 */
export const isSupabaseConfigured = (): boolean =>
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  supabaseUrl !== 'https://placeholder-project.supabase.co';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // A public job board has no session to keep, and persisting one would make
    // the server-rendered and client-rendered reads disagree about their role.
    persistSession: false,
    autoRefreshToken: false,
  },
});

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;
