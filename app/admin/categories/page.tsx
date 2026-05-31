import { createClient } from "@/lib/supabase/server";
import { CategoryEditor } from "@/components/admin/category-editor";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Categories</h1>
        <p className="text-sm text-muted-foreground">
          Use these to organize your products. Slugs become part of the URL.
        </p>
      </header>
      <CategoryEditor initial={(data ?? []) as Category[]} />
    </div>
  );
}
