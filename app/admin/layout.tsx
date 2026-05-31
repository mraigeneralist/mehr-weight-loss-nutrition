import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ok = await isAdmin();
  if (!ok) notFound(); // intentional: don't reveal the route to non-admins

  return (
    <div className="container-prose grid gap-8 py-8 md:grid-cols-[220px_1fr]">
      <AdminSidebar />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
