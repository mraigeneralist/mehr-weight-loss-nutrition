import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/check";
import { CheckoutFlow } from "@/components/site/checkout-flow";
import type { Address } from "@/lib/types";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  if (!isSupabaseConfigured()) redirect("/?setup=needed");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/checkout");

  const [{ data: addresses }, { data: profile }] = await Promise.all([
    supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false }),
    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  return (
    <div className="container-prose py-12">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-bold md:text-5xl">
          Checkout
        </h1>
        <p className="mt-1 text-muted-foreground">
          Pay securely via Razorpay. UPI, cards, and net-banking supported.
        </p>
      </header>
      <CheckoutFlow
        userId={user.id}
        userEmail={user.email ?? ""}
        userName={profile?.full_name ?? ""}
        userPhone={profile?.phone ?? ""}
        addresses={(addresses ?? []) as Address[]}
      />
    </div>
  );
}
