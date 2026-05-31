import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatINR, formatDate, shortOrderId } from "@/lib/format";
import { OrderStatusBadge } from "@/components/site/order-status-badge";
import { cn } from "@/lib/utils";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Search = { status?: string };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select("id, total_paise, status, created_at, address_snapshot, user_id")
    .order("created_at", { ascending: false });

  if (params.status && ORDER_STATUSES.includes(params.status as OrderStatus)) {
    query = query.eq("status", params.status);
  }

  const { data } = await query;
  const orders = (data ?? []) as Array<{
    id: string;
    total_paise: number;
    status: OrderStatus;
    created_at: string;
    address_snapshot: { recipient_name?: string };
    user_id: string;
  }>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Orders</h1>
        <p className="text-sm text-muted-foreground">
          {orders.length} {orders.length === 1 ? "order" : "orders"}
          {params.status ? ` · ${params.status}` : ""}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <FilterChip href="/admin/orders" active={!params.status} label="All" />
        {ORDER_STATUSES.map((s) => (
          <FilterChip
            key={s}
            href={`/admin/orders?status=${s}`}
            active={params.status === s}
            label={s}
          />
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-sand/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-sand/30">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="font-medium hover:underline"
                  >
                    {shortOrderId(o.id)}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {o.address_snapshot?.recipient_name ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(o.created_at)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatINR(o.total_paise)}
                </td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={o.status} />
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1 text-xs capitalize transition-colors",
        active
          ? "border-sage-deep bg-sage-deep text-cream"
          : "border-border bg-card hover:bg-sand",
      )}
    >
      {label}
    </Link>
  );
}
