import Link from "next/link";
import { ArrowRight, Leaf, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryCard } from "@/components/site/category-card";
import { ProductCard } from "@/components/site/product-card";
import { DemoBanner } from "@/components/site/demo-banner";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/check";
import { SEED_CATEGORIES, SEED_PRODUCTS } from "@/lib/seed-data";
import type { Category, ProductWithCategory } from "@/lib/types";

export const revalidate = 60;

export default async function HomePage() {
  const configured = isSupabaseConfigured();
  let cats: Category[];
  let featured: ProductWithCategory[];

  if (configured) {
    const supabase = await createClient();
    try {
      const [{ data: categories }, { data: products }] = await Promise.all([
        supabase
          .from("categories")
          .select("*")
          .order("sort_order", { ascending: true }),
        supabase
          .from("products")
          .select("*, category:categories(id, slug, name)")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(8),
      ]);
      cats = (categories ?? []) as Category[];
      featured = (products ?? []) as ProductWithCategory[];
      // If the schema hasn't been seeded yet, fall back so the demo still shows.
      if (cats.length === 0) cats = SEED_CATEGORIES;
      if (featured.length === 0) featured = SEED_PRODUCTS.slice(0, 8);
    } catch {
      cats = SEED_CATEGORIES;
      featured = SEED_PRODUCTS.slice(0, 8);
    }
  } else {
    cats = SEED_CATEGORIES;
    featured = SEED_PRODUCTS.slice(0, 8);
  }

  return (
    <>
      {!configured && <DemoBanner />}
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 hidden h-80 w-80 -translate-x-1/2 rounded-full bg-sage/15 blur-3xl md:block"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-1/4 hidden h-72 w-72 rounded-full bg-terracotta/15 blur-3xl md:block"
        />
        <div className="container-prose flex flex-col items-center py-20 text-center md:py-28">
          <span className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-sage-deep">
            <Leaf className="h-3.5 w-3.5" /> Fitness for a good life
          </span>
          <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            Nutrition that
            <br />
            <span className="text-sage-deep italic">nurtures.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
            Genuine Herbalife nutrition from Mehr Nutrition Centre, Chennai —
            weight-management shakes, daily vitamins, targeted wellness and
            skin care. Your partners in lifelong health.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/products">
                Shop all products <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/categories/weight-management">Weight management</Link>
            </Button>
          </div>

          <dl className="mt-12 grid w-full max-w-xl grid-cols-3 gap-x-4 gap-y-2 text-center md:mt-14 md:gap-6">
            <div>
              <dt className="font-display text-lg font-semibold leading-tight text-sage-deep md:text-2xl">
                100%
              </dt>
              <dd className="mt-1 text-[11px] leading-snug text-muted-foreground md:text-xs">
                Genuine Herbalife
              </dd>
            </div>
            <div>
              <dt className="font-display text-lg font-semibold leading-tight text-sage-deep md:text-2xl">
                FSSAI
              </dt>
              <dd className="mt-1 text-[11px] leading-snug text-muted-foreground md:text-xs">
                Approved products
              </dd>
            </div>
            <div>
              <dt className="font-display text-lg font-semibold leading-tight text-sage-deep md:text-2xl">
                Pan-India
              </dt>
              <dd className="mt-1 text-[11px] leading-snug text-muted-foreground md:text-xs">
                Free over ₹500
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Categories */}
      <section className="container-prose pb-20">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Browse by goal
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">
              Find what your body needs.
            </h2>
          </div>
          <Link
            href="/products"
            className="group hidden shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full text-sm font-medium text-sage-deep transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-deep/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background md:inline-flex"
          >
            See everything
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {cats.map((c) => (
            <CategoryCard key={c.id} category={c} />
          ))}
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="container-prose pb-20">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Bestsellers
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">
                Popular right now.
              </h2>
            </div>
            <Link
              href="/products"
              className="group inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full text-sm font-medium text-sage-deep transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-deep/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              View all
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
            {featured.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Promise band */}
      <section className="bg-sand/60">
        <div className="container-prose grid gap-8 py-16 md:grid-cols-3">
          {[
            {
              icon: Leaf,
              title: "Genuine Herbalife products",
              body: "Every product is authentic Herbalife Nutrition, backed by decades of science.",
            },
            {
              icon: ShieldCheck,
              title: "Personalised wellness plans",
              body: "Guidance from Mehr Nutrition Centre to match the right products to your goals.",
            },
            {
              icon: Truck,
              title: "Pan-India delivery",
              body: "Fast, reliable shipping across India. Free on orders over ₹500.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <div className="grid h-11 w-11 place-items-center rounded-full bg-sage-deep text-cream">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
