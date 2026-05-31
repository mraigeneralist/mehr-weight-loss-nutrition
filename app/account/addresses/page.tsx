import { AddressManager } from "@/components/site/address-manager";
import { createClient } from "@/lib/supabase/server";
import type { Address } from "@/lib/types";

export default async function AddressesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("id", { ascending: true });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-xl font-semibold">Saved addresses</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Used at checkout for faster orders.
        </p>
      </div>
      <AddressManager initial={(data ?? []) as Address[]} />
    </div>
  );
}
