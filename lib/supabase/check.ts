/**
 * Returns true when both public Supabase env vars are present.
 * Used to fall back to static seed data on pages that read the catalog,
 * so a fresh Vercel deploy without env vars still renders something
 * recognisable.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
