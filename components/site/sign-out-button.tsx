"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/lib/cart-store";

export function SignOutButton() {
  const [pending, start] = useTransition();
  const clearCart = useCart((s) => s.clear);

  function signOut() {
    start(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      clearCart();
      window.location.assign("/");
    });
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={pending}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sand hover:text-foreground disabled:opacity-50"
    >
      <LogOut className="h-4 w-4" />
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
