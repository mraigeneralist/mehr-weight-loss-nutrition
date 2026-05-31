import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/check";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) redirect("/account");
    } catch {
      // fall through to render the auth pages anyway
    }
  }

  return (
    <div className="container-prose flex min-h-[calc(100vh-12rem)] items-center justify-center py-12">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
