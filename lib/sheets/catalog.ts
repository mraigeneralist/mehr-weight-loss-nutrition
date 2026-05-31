import "server-only";
import { readRange } from "./client";
import { rupeesToPaise } from "@/lib/format";
import type { Category, ProductWithCategory } from "@/lib/types";

/**
 * Reads the catalog from a Google Sheet with two tabs:
 *
 * "Categories":  id | slug | name | description | image_url | sort_order
 * "Products":    id | category_slug | slug | name | description | price_inr |
 *                weight_grams | stock | image_url | gallery_image_urls | is_active
 *
 * Header row matching is case-insensitive. `price_inr` is rupees (e.g. 2300),
 * stored internally as paise. `gallery_image_urls` is "|"- or ","-separated.
 * `is_active` accepts TRUE/yes/1 (blank = active).
 */

function toObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows
    .slice(1)
    .filter((r) => r.some((c) => c && c.trim()))
    .map((r) => {
      const o: Record<string, string> = {};
      headers.forEach((h, i) => {
        o[h] = (r[i] ?? "").trim();
      });
      return o;
    });
}

const isTruthy = (v?: string) =>
  !v || ["1", "true", "yes", "y", "active"].includes(v.toLowerCase());

const num = (v?: string) => Number((v ?? "").replace(/[^0-9.]/g, ""));

export async function loadSheetCatalog(): Promise<{
  categories: Category[];
  products: ProductWithCategory[];
}> {
  const [catRows, prodRows] = await Promise.all([
    readRange("Categories"),
    readRange("Products"),
  ]);

  const categories: Category[] = toObjects(catRows)
    .filter((c) => c.slug)
    .map((c, i) => ({
      id: c.id || c.slug,
      slug: c.slug,
      name: c.name || c.slug,
      description: c.description || null,
      image_url: c.image_url || null,
      sort_order: c.sort_order ? num(c.sort_order) : i,
    }))
    .sort((a, b) => a.sort_order - b.sort_order);

  const bySlug = new Map(categories.map((c) => [c.slug, c]));

  const products: ProductWithCategory[] = toObjects(prodRows)
    .filter((p) => p.slug && isTruthy(p.is_active))
    .map((p) => {
      const c = bySlug.get(p.category_slug) ?? null;
      return {
        id: p.id || p.slug,
        category_id: c?.id ?? "",
        slug: p.slug,
        name: p.name || p.slug,
        description: p.description || null,
        price_paise: rupeesToPaise(num(p.price_inr || p.price)),
        weight_grams: p.weight_grams ? num(p.weight_grams) : null,
        stock: p.stock ? num(p.stock) : 100,
        image_url: p.image_url || null,
        gallery_image_urls: (p.gallery_image_urls || "")
          .split(/[|,]/)
          .map((s) => s.trim())
          .filter(Boolean),
        is_active: true,
        created_at: new Date().toISOString(),
        category: c ? { id: c.id, slug: c.slug, name: c.name } : null,
      };
    });

  return { categories, products };
}
