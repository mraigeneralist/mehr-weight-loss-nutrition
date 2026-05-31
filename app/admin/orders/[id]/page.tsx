import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatINR, formatDateTime, shortOrderId } from "@/lib/format";
import { OrderStatusBadge } from "@/components/site/order-status-badge";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { Separator } from "@/components/ui/separator";
import type { Order, OrderItem, AddressSnapshot } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle<Order>();
  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", id);

  const addr = order.address_snapshot as AddressSnapshot;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/orders"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← All orders
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border bg-card p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Order
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold">
            {shortOrderId(order.id)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed {formatDateTime(order.created_at)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <OrderStatusBadge status={order.status} />
          <OrderStatusSelect orderId={order.id} status={order.status} />
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Items</h2>
          <ul className="mt-4 divide-y divide-border">
            {((items ?? []) as OrderItem[]).map((it) => (
              <li
                key={it.id}
                className="flex items-start justify-between gap-3 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{it.name_snapshot}</p>
                  <p className="text-muted-foreground">
                    {formatINR(it.price_paise_snapshot)} × {it.quantity}
                  </p>
                </div>
                <p className="tabular-nums">
                  {formatINR(it.price_paise_snapshot * it.quantity)}
                </p>
              </li>
            ))}
          </ul>
          <Separator className="my-4" />
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">
                {formatINR(order.subtotal_paise)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="tabular-nums">
                {order.shipping_paise === 0
                  ? "Free"
                  : formatINR(order.shipping_paise)}
              </dd>
            </div>
            <div className="flex justify-between pt-2 font-display font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">
                {formatINR(order.total_paise)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="space-y-6">
          {addr && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display text-lg font-semibold">
                Shipping to
              </h3>
              <p className="mt-2 text-sm">{addr.recipient_name}</p>
              <p className="text-sm text-muted-foreground">{addr.phone}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {addr.line1}
                {addr.line2 ? `, ${addr.line2}` : ""}
                <br />
                {addr.city}, {addr.state} {addr.pincode}
              </p>
            </div>
          )}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display text-lg font-semibold">Payment</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Razorpay payment ID:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                {order.razorpay_payment_id ?? "—"}
              </code>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Razorpay order ID:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                {order.razorpay_order_id ?? "—"}
              </code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
