import { notFound } from "next/navigation";
import Image from "next/image";
import { ProductCard } from "@/components/site/product-card";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/check";
import {
  seedCategoryBySlug,
  seedProductsByCategoryId,
} from "@/lib/seed-data";
import type { Category, ProductWithCategory } from "@/lib/types";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isSupabaseConfigured()) {
    const c = seedCategoryBySlug(slug);
    return {
      title: c?.name ?? "Category",
      description: c?.description ?? undefined,
    };
  }
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("categories")
      .select("name, description")
      .eq("slug", slug)
      .maybeSingle();
    return {
      title: data?.name ?? "Category",
      description: data?.description ?? undefined,
    };
  } catch {
    const c = seedCategoryBySlug(slug);
    return { title: c?.name ?? "Category" };
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const configured = isSupabaseConfigured();

  let category: Category | null;
  let products: ProductWithCategory[];

  if (configured) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", slug)
        .maybeSingle<Category>();
      category = data ?? seedCategoryBySlug(slug);
      if (!category) notFound();

      const { data: productsRaw } = await supabase
        .from("products")
        .select("*, category:categories(id, slug, name)")
        .eq("category_id", category.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      products = (productsRaw ?? []) as ProductWithCategory[];
      if (products.length === 0) {
        products = seedProductsByCategoryId(category.id);
      }
    } catch {
      category = seedCategoryBySlug(slug);
      if (!category) notFound();
      products = seedProductsByCategoryId(category.id);
    }
  } else {
    category = seedCategoryBySlug(slug);
    if (!category) notFound();
    products = seedProductsByCategoryId(category.id);
  }

  const banner = category.image_url || `/categories/${category.slug}.svg`;

  return (
    <>
      <section className="relative overflow-hidden bg-sand/60">
        <div className="container-prose grid gap-10 py-14 md:grid-cols-12 md:py-20">
          <div className="md:col-span-6 flex flex-col justify-center">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Aisle
            </p>
            <h1 className="mt-2 font-display text-5xl font-bold tracking-tight md:text-6xl">
              {category.name}
            </h1>
            {category.description && (
              <p className="mt-4 max-w-md text-muted-foreground md:text-lg">
                {category.description}
              </p>
            )}
            <p className="mt-5 text-sm text-muted-foreground">
              {products.length} {products.length === 1 ? "product" : "products"}
            </p>
          </div>
          <div className="md:col-span-6">
            <div className="aspect-[5/3] overflow-hidden rounded-3xl bg-sand">
              <Image
                src={banner}
                alt={category.name}
                width={1200}
                height={600}
                className="h-full w-full object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container-prose py-14">
        {products.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
            We're restocking. Come back soon.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
