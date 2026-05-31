import Link from "next/link";
import Image from "next/image";
import { formatINR } from "@/lib/format";
import { AddToCartButton } from "@/components/site/add-to-cart-button";
import type { Product } from "@/lib/types";

type Props = {
  product: Product & { category?: { slug: string; name: string } | null };
};

export function ProductCard({ product }: Props) {
  const outOfStock = !product.is_active || product.stock <= 0;
  const img = product.image_url || `/products/${product.slug}.svg`;

  return (
    <article className="group flex h-full flex-col">
      <Link
        href={`/products/${product.slug}`}
        className="relative block overflow-hidden rounded-2xl bg-sand/50"
      >
        <div className="aspect-square">
          <Image
            src={img}
            alt={product.name}
            width={800}
            height={800}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
        {outOfStock && (
          <span className="absolute top-3 left-3 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-cream">
            Out of stock
          </span>
        )}
      </Link>
      <div className="mt-4 flex flex-1 items-start justify-between gap-3">
        <div className="min-w-0">
          {product.category && (
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {product.category.name}
            </p>
          )}
          <Link
            href={`/products/${product.slug}`}
            className="mt-0.5 block font-display text-lg font-semibold leading-snug hover:underline underline-offset-4 line-clamp-2"
          >
            {product.name}
          </Link>
          <p className="text-xs text-muted-foreground">
            {product.weight_grams ? `${product.weight_grams} g` : " "}
          </p>
        </div>
        <p className="shrink-0 font-medium tabular-nums">
          {formatINR(product.price_paise)}
        </p>
      </div>
      <div className="mt-3">
        <AddToCartButton product={product} compact />
      </div>
    </article>
  );
}
