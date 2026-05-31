import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { createClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/lib/types";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle<Product>(),
    supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true }),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Edit product</h1>
        <p className="text-sm text-muted-foreground">/{product.slug}</p>
      </header>
      <ProductForm
        initial={product}
        categories={(categories ?? []) as Category[]}
      />
    </div>
  );
}
