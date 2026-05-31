import Link from "next/link";
import { Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatINR, formatDate, shortOrderId } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/site/order-status-badge";
import type { Order } from "@/lib/types";

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const orders = (data ?? []) as Order[];

  if (orders.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card p-14 text-center">
        <Package className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="mt-4 font-display text-2xl font-semibold">
          No orders yet
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          When you place an order, you'll see it here.
        </p>
        <Button asChild className="mt-6">
          <Link href="/products">Start shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {orders.map((o) => (
        <li
          key={o.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5"
        >
          <div>
            <p className="font-display text-lg font-semibold">
              {shortOrderId(o.id)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(o.created_at)}
            </p>
          </div>
          <div className="text-sm tabular-nums">
            {formatINR(o.total_paise)}
          </div>
          <OrderStatusBadge status={o.status} />
          <Button asChild variant="outline" size="sm">
            <Link href={`/account/orders/${o.id}`}>View</Link>
          </Button>
        </li>
      ))}
    </ul>
  );
}
