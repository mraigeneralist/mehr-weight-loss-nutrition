import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/check";
import type { Profile } from "@/lib/types";

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile(): Promise<{
  user: Awaited<ReturnType<typeof getCurrentUser>>;
  profile: Profile | null;
}> {
  if (!isSupabaseConfigured()) return { user: null, profile: null };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  return { user, profile };
}

export async function isAdmin(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { profile } = await getCurrentProfile();
  return profile?.role === "admin";
}
