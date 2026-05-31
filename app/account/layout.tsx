import { redirect } from "next/navigation";
import { User2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/check";
import { AccountNav } from "@/components/site/account-nav";
import { SignOutButton } from "@/components/site/sign-out-button";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) redirect("/?setup=needed");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle<{ full_name: string | null; role: string | null }>();

  const displayName = profile?.full_name ?? null;
  const isAdmin = profile?.role === "admin";

  const initials = (displayName || user.email || "")
    .split(/[ @]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <div className="container-prose py-10 md:py-14">
      <header className="mb-10 flex items-center gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-sage-deep/15 text-base font-semibold text-sage-deep">
          {initials || <User2 className="h-6 w-6" />}
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Account
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold leading-tight md:text-3xl">
            {displayName || "Welcome"}
          </h1>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
        </div>
      </header>

      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <aside className="space-y-3">
          <AccountNav isAdmin={isAdmin} />
          <div className="border-t border-border pt-3">
            <SignOutButton />
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
