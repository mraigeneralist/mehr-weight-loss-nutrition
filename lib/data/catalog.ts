import "server-only";
import { cache } from "react";
import { DATA_BACKEND, isSheetsConfigured } from "./backend";
import { isSupabaseConfigured } from "@/lib/supabase/check";
import { createClient } from "@/lib/supabase/server";
import { loadSheetCatalog } from "@/lib/sheets/catalog";
import { SEED_CATEGORIES, SEED_PRODUCTS } from "@/lib/seed-data";
import type { Category, ProductWithCategory } from "@/lib/types";

export type Catalog = {
  categories: Category[];
  products: ProductWithCategory[];
};

function seedCatalog(): Catalog {
  return { categories: SEED_CATEGORIES, products: SEED_PRODUCTS };
}

/**
 * Loads the full active catalog from the configured backend, memoised per
 * request. Always returns something — falls back to static seed data when the
 * backend is unconfigured or errors. The catalog is small (tens of rows), so
 * the page-facing helpers below filter/sort this in memory.
 */
export const loadCatalog = cache(async (): Promise<Catalog> => {
  if (DATA_BACKEND === "sheets") {
    if (isSheetsConfigured()) {
      try {
        const c = await loadSheetCatalog();
        if (c.products.length > 0) return c;
      } catch (e) {
        console.error("Sheets catalog load failed; using seed data", e);
      }
    }
    return seedCatalog();
  }

  // Supabase
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const [{ data: cats }, { data: prods }] = await Promise.all([
        supabase
          .from("categories")
          .select("*")
          .order("sort_order", { ascending: true }),
        supabase
          .from("products")
          .select("*, category:categories(id, slug, name)")
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
      ]);
      const categories = (cats ?? []) as Category[];
      const products = (prods ?? []) as ProductWithCategory[];
      if (categories.length > 0 && products.length > 0) {
        return { categories, products };
      }
    } catch (e) {
      console.error("Supabase catalog load failed; using seed data", e);
    }
  }
  return seedCatalog();
});

type ProductQuery = { categorySlug?: string; sort?: string; limit?: number };

function sortProducts(
  list: ProductWithCategory[],
  sort?: string,
): ProductWithCategory[] {
  if (sort === "price-asc") {
    return [...list].sort((a, b) => a.price_paise - b.price_paise);
  }
  if (sort === "price-desc") {
    return [...list].sort((a, b) => b.price_paise - a.price_paise);
  }
  return list; // backend already returns newest-first
}

export async function getCategories(): Promise<Category[]> {
  return (await loadCatalog()).categories;
}

export async function getProducts(
  q: ProductQuery = {},
): Promise<ProductWithCategory[]> {
  let list = (await loadCatalog()).products;
  if (q.categorySlug) {
    list = list.filter((p) => p.category?.slug === q.categorySlug);
  }
  list = sortProducts(list, q.sort);
  if (q.limit) list = list.slice(0, q.limit);
  return list;
}

export async function getCategoryBySlug(
  slug: string,
): Promise<Category | null> {
  return (await loadCatalog()).categories.find((c) => c.slug === slug) ?? null;
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductWithCategory | null> {
  return (await loadCatalog()).products.find((p) => p.slug === slug) ?? null;
}

export async function getRelatedProducts(
  categoryId: string,
  excludeId: string,
  limit = 4,
): Promise<ProductWithCategory[]> {
  return (await loadCatalog()).products
    .filter((p) => p.category_id === categoryId && p.id !== excludeId)
    .slice(0, limit);
}

/** Used by the Razorpay routes to re-price a cart from the authoritative source. */
export async function getProductsByIds(
  ids: string[],
): Promise<ProductWithCategory[]> {
  const set = new Set(ids);
  return (await loadCatalog()).products.filter((p) => set.has(p.id));
}
