/**
 * One-off: push the catalog from lib/seed-data.ts into the live Supabase
 * tables. Upserts by `slug`, so it's safe to re-run and won't duplicate rows.
 * Uses the service-role key (bypasses RLS). Stock is left untouched on
 * existing rows.
 *
 *   node scripts/sync-supabase.mjs
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { SEED_CATEGORIES, SEED_PRODUCTS } from "../lib/seed-data.ts";

// --- load .env.local into process.env ---
const envText = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  if (!process.env[m[1]]) process.env[m[1]] = v;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

// --- categories ---
const cats = SEED_CATEGORIES.map((c) => ({
  slug: c.slug,
  name: c.name,
  description: c.description,
  image_url: c.image_url,
  sort_order: c.sort_order,
}));
{
  const { error } = await sb.from("categories").upsert(cats, {
    onConflict: "slug",
  });
  if (error) {
    console.error("Category upsert failed:", error.message);
    process.exit(1);
  }
}

// map slug -> live category id
const { data: catRows, error: catErr } = await sb
  .from("categories")
  .select("id, slug");
if (catErr) {
  console.error("Category read failed:", catErr.message);
  process.exit(1);
}
const idBySlug = Object.fromEntries(catRows.map((c) => [c.slug, c.id]));

// --- products (omit stock so existing stock isn't reset) ---
const prods = SEED_PRODUCTS.map((p) => ({
  category_id: idBySlug[p.category.slug],
  slug: p.slug,
  name: p.name,
  description: p.description,
  price_paise: p.price_paise,
  weight_grams: p.weight_grams,
  image_url: p.image_url,
  gallery_image_urls: p.gallery_image_urls,
  is_active: p.is_active,
}));
{
  const { error } = await sb.from("products").upsert(prods, {
    onConflict: "slug",
  });
  if (error) {
    console.error("Product upsert failed:", error.message);
    process.exit(1);
  }
}

console.log(`✓ Synced ${cats.length} categories and ${prods.length} products.`);

// quick sanity check
const { data: sample } = await sb
  .from("products")
  .select("name, price_paise, image_url")
  .in("slug", ["formula-1-nutritional-shake", "niteworks", "h24-hydrate"]);
for (const r of sample ?? []) {
  console.log(`  ${r.name}: ₹${r.price_paise / 100} — ${r.image_url}`);
}
