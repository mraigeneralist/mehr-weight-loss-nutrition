import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { Category } from "@/lib/types";

type Props = {
  category: Category;
  productCount?: number;
};

export function CategoryCard({ category, productCount }: Props) {
  const img = category.image_url || `/categories/${category.slug}.svg`;
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group relative block overflow-hidden rounded-3xl bg-sand"
    >
      <div className="aspect-[5/3]">
        <Image
          src={img}
          alt={category.name}
          width={1200}
          height={600}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
      </div>
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/85 via-ink/45 to-ink/10 p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="font-display text-3xl font-bold text-cream drop-shadow">
              {category.name}
            </h3>
            {category.description && (
              <p className="mt-1 text-sm text-cream/85 max-w-xs">
                {category.description}
              </p>
            )}
          </div>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cream text-ink transition-transform group-hover:rotate-12">
            <ArrowUpRight className="h-5 w-5" />
          </span>
        </div>
      </div>
      {typeof productCount === "number" && (
        <span className="absolute top-4 right-4 rounded-full bg-cream/95 px-2.5 py-1 text-[11px] font-medium text-ink">
          {productCount} products
        </span>
      )}
    </Link>
  );
}
