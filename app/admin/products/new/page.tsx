import { ProductForm } from "@/components/admin/product-form";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">New product</h1>
        <p className="text-sm text-muted-foreground">
          Customers will see this on the storefront once you save it as Active.
        </p>
      </header>
      <ProductForm categories={(data ?? []) as Category[]} />
    </div>
  );
}
