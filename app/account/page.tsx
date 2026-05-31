import { ProfileForm } from "@/components/site/profile-form";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
      <div className="mb-6">
        <h2 className="font-display text-xl font-semibold">Personal details</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Used on receipts, delivery cards, and order updates.
        </p>
      </div>
      <ProfileForm
        email={user.email ?? ""}
        fullName={profile?.full_name ?? ""}
        phone={profile?.phone ?? ""}
      />
    </div>
  );
}
