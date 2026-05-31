import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { ProductCard } from "@/components/site/product-card";
import { DemoBanner } from "@/components/site/demo-banner";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/check";
import { SEED_CATEGORIES, SEED_PRODUCTS } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import type { Category, ProductWithCategory } from "@/lib/types";

export const revalidate = 60;

type Search = { cat?: string; sort?: string };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();

  let categories: Category[];
  let list: ProductWithCategory[];

  if (configured) {
    const supabase = await createClient();
    try {
      const { data: cats } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      categories = (cats ?? []) as Category[];
      if (categories.length === 0) categories = SEED_CATEGORIES;

      let query = supabase
        .from("products")
        .select("*, category:categories(id, slug, name)")
        .eq("is_active", true);

      if (params.cat) {
        const found = categories.find((c) => c.slug === params.cat);
        if (found) query = query.eq("category_id", found.id);
      }

      if (params.sort === "price-asc") {
        query = query.order("price_paise", { ascending: true });
      } else if (params.sort === "price-desc") {
        query = query.order("price_paise", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data: products } = await query;
      list = (products ?? []) as ProductWithCategory[];
      if (list.length === 0) list = filterAndSort(SEED_PRODUCTS, params);
    } catch {
      categories = SEED_CATEGORIES;
      list = filterAndSort(SEED_PRODUCTS, params);
    }
  } else {
    categories = SEED_CATEGORIES;
    list = filterAndSort(SEED_PRODUCTS, params);
  }

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

function filterAndSort(
  all: ProductWithCategory[],
  params: Search,
): ProductWithCategory[] {
  let list = all;
  if (params.cat) {
    list = list.filter((p) => p.category?.slug === params.cat);
  }
  if (params.sort === "price-asc") {
    list = [...list].sort((a, b) => a.price_paise - b.price_paise);
  } else if (params.sort === "price-desc") {
    list = [...list].sort((a, b) => b.price_paise - a.price_paise);
  }
  return list;
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
