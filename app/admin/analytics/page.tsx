import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/format";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { TopProductsChart } from "@/components/admin/top-products-chart";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const since = new Date();
  since.setDate(since.getDate() - 90);
  const sinceIso = since.toISOString();

  const [
    { data: orders },
    { data: items },
    { count: customerCount },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("total_paise, status, created_at")
      .gte("created_at", sinceIso)
      .in("status", ["paid", "shipped", "delivered"]),
    supabase
      .from("order_items")
      .select("name_snapshot, quantity, price_paise_snapshot, order_id"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true }),
  ]);

  const dailyMap = new Map<string, number>();
  for (let i = 0; i < 90; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (89 - i));
    dailyMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const o of orders ?? []) {
    const key = (o.created_at as string).slice(0, 10);
    if (dailyMap.has(key)) {
      dailyMap.set(key, (dailyMap.get(key) ?? 0) + (o.total_paise ?? 0));
    }
  }
  const series = Array.from(dailyMap.entries()).map(([date, paise]) => ({
    date,
    paise,
  }));

  const totalRevenue = (orders ?? []).reduce(
    (sum: number, o: any) => sum + (o.total_paise ?? 0),
    0,
  );
  const orderCount = (orders ?? []).length;
  const aov = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;

  // Top products by units
  const productStats = new Map<string, { qty: number; revenue: number }>();
  for (const it of items ?? []) {
    const key = (it as any).name_snapshot as string;
    const stat = productStats.get(key) ?? { qty: 0, revenue: 0 };
    stat.qty += (it as any).quantity ?? 0;
    stat.revenue += ((it as any).quantity ?? 0) * ((it as any).price_paise_snapshot ?? 0);
    productStats.set(key, stat);
  }
  const top = Array.from(productStats.entries())
    .map(([name, s]) => ({ name, qty: s.qty, revenue: s.revenue }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Last 90 days</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Revenue (90d)" value={formatINR(totalRevenue)} />
        <Stat label="Orders (90d)" value={String(orderCount)} />
        <Stat label="Customers (all-time)" value={String(customerCount ?? 0)} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Revenue trend</h2>
        <p className="text-xs text-muted-foreground">Daily, last 90 days</p>
        <div className="mt-4 h-72">
          <RevenueChart data={series} />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Top products</h2>
        <p className="text-xs text-muted-foreground">By units sold</p>
        <div className="mt-4 h-72">
          {top.length > 0 ? (
            <TopProductsChart data={top} />
          ) : (
            <p className="grid h-full place-items-center text-sm text-muted-foreground">
              No sales yet.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Average order value</h2>
        <p className="mt-2 font-display text-3xl font-bold tabular-nums">
          {formatINR(aov)}
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl font-bold tabular-nums">
        {value}
      </p>
    </div>
  );
}
