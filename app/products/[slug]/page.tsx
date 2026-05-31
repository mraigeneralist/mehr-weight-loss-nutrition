import { notFound } from "next/navigation";
import Link from "next/link";
import { Leaf, ShieldCheck, Truck, Undo2 } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/lib/data/catalog";
import { formatINR } from "@/lib/format";
import { ProductCard } from "@/components/site/product-card";
import { AddToCartButton } from "@/components/site/add-to-cart-button";
import { ProductGallery } from "@/components/site/product-gallery";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  return {
    title: p?.name ?? "Product",
    description: p?.description ?? undefined,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const related = await getRelatedProducts(product.category_id, product.id, 4);

  const cover = product.image_url || `/products/${product.slug}.svg`;
  const gallery = [cover, ...(product.gallery_image_urls ?? [])].filter(
    Boolean,
  );

  return (
    <div className="container-prose py-10 md:py-16">
      <nav className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href="/products" className="hover:text-foreground">Pantry</Link>
        {product.category && (
          <>
            <span className="mx-1.5">/</span>
            <Link
              href={`/categories/${product.category.slug}`}
              className="hover:text-foreground"
            >
              {product.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="mt-6 grid gap-10 md:grid-cols-2 md:gap-14">
        <ProductGallery images={gallery} alt={product.name} />

        <div className="flex flex-col">
          {product.category && (
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {product.category.name}
            </p>
          )}
          <h1 className="mt-2 font-display text-4xl font-bold leading-tight md:text-5xl">
            {product.name}
          </h1>

          <div className="mt-5 flex items-baseline gap-4">
            <p className="font-display text-3xl font-semibold tabular-nums">
              {formatINR(product.price_paise)}
            </p>
            {product.weight_grams && (
              <span className="text-sm text-muted-foreground">
                {product.weight_grams} g
              </span>
            )}
          </div>

          {product.description && (
            <p className="mt-6 max-w-prose text-base leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          <div className="mt-8 max-w-sm">
            <AddToCartButton product={product} />
          </div>

          <ul className="mt-10 grid gap-5 text-sm sm:grid-cols-2">
            <Promise icon={Leaf} text="No preservatives, no artificial flavors" />
            <Promise icon={ShieldCheck} text="FSSAI-licensed kitchen" />
            <Promise icon={Truck} text="Free shipping over ₹500" />
            <Promise icon={Undo2} text="7-day no-questions-asked returns" />
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="font-display text-2xl font-bold md:text-3xl">
            Pairs well with
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Promise({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sand text-sage-deep">
        <Icon className="h-4 w-4" />
      </span>
      <span className="pt-1.5 text-muted-foreground">{text}</span>
    </li>
  );
}
