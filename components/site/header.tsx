import Link from "next/link";
import Image from "next/image";
import { User2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/check";
import { CartButton } from "@/components/site/cart-button";
import { AccountMenu } from "@/components/site/account-menu";
import { STORE_NAME } from "@/lib/constants";

const NAV = [
  { href: "/products", label: "Shop all" },
  { href: "/categories/weight-management", label: "Weight" },
  { href: "/categories/daily-wellness", label: "Wellness" },
  { href: "/categories/sports-energy", label: "Sports" },
  { href: "/categories/skin-care", label: "Skin Care" },
];

export async function SiteHeader() {
  let user: { id: string; email?: string } | null = null;
  let displayName: string | null = null;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      user = authUser;
      if (authUser) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", authUser.id)
          .maybeSingle();
        displayName = data?.full_name ?? null;
      }
    } catch {
      // Misconfigured Supabase URL — render the header without auth state.
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container-prose flex h-16 items-center gap-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-display text-2xl font-bold tracking-tight"
        >
          <Image
            src="/logo.png"
            alt={STORE_NAME}
            width={40}
            height={40}
            className="h-9 w-9 object-contain"
            priority
          />
          {STORE_NAME}
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="text-foreground/75 transition-colors hover:text-foreground"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <CartButton />
          {user ? (
            <AccountMenu
              email={user.email ?? ""}
              displayName={displayName}
            />
          ) : (
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm hover:bg-sand transition-colors"
            >
              <User2 className="h-4 w-4" /> Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
