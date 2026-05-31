import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { ProductCard } from "@/components/site/product-card";
import { DemoBanner } from "@/components/site/demo-banner";
import { isDataConfigured } from "@/lib/data/backend";
import { getCategories, getProducts } from "@/lib/data/catalog";
import { cn } from "@/lib/utils";

export const revalidate = 60;

type Search = { cat?: string; sort?: string };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const configured = isDataConfigured();

  const [categories, list] = await Promise.all([
    getCategories(),
    getProducts({ categorySlug: params.cat, sort: params.sort }),
  ]);

  return (
    <div className="container-prose py-12 md:py-16">
      {!configured && (
        <div className="-mx-4 sm:-mx-6 lg:-mx-8 mb-8">
          <DemoBanner />
        </div>
      )}
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          The pantry
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">
          Everything we make.
        </h1>
      </header>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip href="/products" active={!params.cat} label="All" />
          {categories.map((c) => (
            <FilterChip
              key={c.id}
              href={`/products?cat=${c.slug}`}
              active={params.cat === c.slug}
              label={c.name}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Sort</span>
          <div className="inline-flex items-center rounded-full border border-border bg-card p-1 text-sm">
            <SortLink params={params} value="" label="Newest" />
            <SortLink params={params} value="price-asc" label="₹ Low" />
            <SortLink params={params} value="price-desc" label="₹ High" />
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Nothing in this aisle yet. Check back soon.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
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
        "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
        active
          ? "border-sage-deep bg-sage-deep text-cream"
          : "border-border bg-card hover:bg-sand",
      )}
    >
      {label}
    </Link>
  );
}

function SortLink({
  params,
  value,
  label,
}: {
  params: Search;
  value: string;
  label: string;
}) {
  const cat = params.cat ? `cat=${params.cat}` : "";
  const sort = value ? `sort=${value}` : "";
  const qs = [cat, sort].filter(Boolean).join("&");
  const href = `/products${qs ? `?${qs}` : ""}`;
  const active =
    (value === "" && !params.sort) || params.sort === value;
  return (
    <Link
      href={href}
      aria-pressed={active}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-sage-deep text-cream shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}
