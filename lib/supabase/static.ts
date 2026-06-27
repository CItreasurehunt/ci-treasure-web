import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Return a dummy client that will fail on actual calls but won't crash during initialization
    // if the caller has their own guards.
    return createSupabaseClient(
      'https://placeholder.supabase.co',
      'placeholder'
    );
  }

  return createSupabaseClient(url, key);
}
