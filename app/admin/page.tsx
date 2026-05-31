import Link from "next/link";
import { ArrowRight, IndianRupee, Package, ShoppingBag, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatINR, formatDate, shortOrderId } from "@/lib/format";
import { OrderStatusBadge } from "@/components/site/order-status-badge";
import { KpiCard } from "@/components/admin/kpi-card";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();

  const [
    { data: orders30 },
    { data: recentOrders },
    { count: customers30 },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("total_paise, created_at, status")
      .in("status", ["paid", "shipped", "delivered"])
      .gte("created_at", sinceIso),
    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sinceIso),
  ]);

  const revenue30 = (orders30 ?? []).reduce(
    (sum: number, o: any) => sum + (o.total_paise ?? 0),
    0,
  );
  const orderCount30 = (orders30 ?? []).length;
  const aov30 = orderCount30 > 0 ? Math.round(revenue30 / orderCount30) : 0;

  // Build day-by-day series
  const dailyMap = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().slice(0, 10);
    dailyMap.set(key, 0);
  }
  for (const o of orders30 ?? []) {
    const key = (o.created_at as string).slice(0, 10);
    if (dailyMap.has(key)) {
      dailyMap.set(key, (dailyMap.get(key) ?? 0) + (o.total_paise ?? 0));
    }
  }
  const series = Array.from(dailyMap.entries()).map(([date, paise]) => ({
    date,
    paise,
  }));

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Last 30 days
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold">Dashboard</h1>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">+ New product</Link>
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard
          icon={IndianRupee}
          label="Revenue"
          value={formatINR(revenue30)}
        />
        <KpiCard
          icon={ShoppingBag}
          label="Orders"
          value={String(orderCount30)}
        />
        <KpiCard
          icon={Users}
          label="New customers"
          value={String(customers30 ?? 0)}
        />
        <KpiCard
          icon={Package}
          label="Avg. order value"
          value={formatINR(aov30)}
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Revenue</h2>
        <p className="text-xs text-muted-foreground">Daily, last 30 days</p>
        <div className="mt-4 h-64">
          <RevenueChart data={series} />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Recent orders</h2>
          <Link
            href="/admin/orders"
            className="group inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full text-sm font-medium text-sage-deep transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-deep/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            View all
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        {(!recentOrders || recentOrders.length === 0) ? (
          <p className="mt-6 text-sm text-muted-foreground">
            No orders yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {recentOrders.map((o: any) => (
              <li
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="flex flex-col">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="font-medium hover:underline"
                  >
                    {shortOrderId(o.id)}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(o.created_at)}
                  </span>
                </div>
                <span className="tabular-nums text-sm">
                  {formatINR(o.total_paise)}
                </span>
                <OrderStatusBadge status={o.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
