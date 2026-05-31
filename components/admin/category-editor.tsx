"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/types";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function CategoryEditor({ initial }: { initial: Category[] }) {
  const router = useRouter();
  const [list, setList] = useState<Category[]>(initial);
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState({ name: "", slug: "", description: "" });

  function update(c: Category, patch: Partial<Category>) {
    const next = list.map((x) => (x.id === c.id ? { ...x, ...patch } : x));
    setList(next);
  }

  async function save(c: Category) {
    start(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("categories")
        .update({
          name: c.name,
          slug: c.slug,
          description: c.description,
          sort_order: c.sort_order,
        })
        .eq("id", c.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(`${c.name} saved`);
      router.refresh();
    });
  }

  async function remove(c: Category) {
    if (!confirm(`Delete category "${c.name}"? Products won't be deleted but they'll need a new category.`)) return;
    start(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", c.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Category removed");
      setList((prev) => prev.filter((x) => x.id !== c.id));
      router.refresh();
    });
  }

  async function add() {
    if (!draft.name) return;
    start(async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("categories")
        .insert({
          name: draft.name,
          slug: draft.slug || slugify(draft.name),
          description: draft.description || null,
          sort_order: list.length,
        })
        .select()
        .single();
      if (error) {
        toast.error(error.message);
        return;
      }
      setList((prev) => [...prev, data as Category]);
      setDraft({ name: "", slug: "", description: "" });
      toast.success("Category added");
      router.refresh();
    });
  }

  return (
    <>
      <ul className="space-y-3">
        {list.map((c) => (
          <li
            key={c.id}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_2fr_auto] md:items-end">
              <div>
                <Label className="text-xs">Name</Label>
                <Input
                  value={c.name}
                  onChange={(e) => update(c, { name: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Slug</Label>
                <Input
                  value={c.slug}
                  onChange={(e) => update(c, { slug: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Textarea
                  rows={1}
                  value={c.description ?? ""}
                  onChange={(e) =>
                    update(c, { description: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => save(c)}
                  disabled={pending}
                >
                  Save
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => remove(c)}
                  disabled={pending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="rounded-2xl border border-dashed border-border bg-card p-5">
        <h3 className="font-display text-base font-semibold">New category</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_2fr_auto] md:items-end">
          <div>
            <Label className="text-xs">Name</Label>
            <Input
              value={draft.name}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  name: e.target.value,
                  slug: draft.slug || slugify(e.target.value),
                })
              }
            />
          </div>
          <div>
            <Label className="text-xs">Slug</Label>
            <Input
              value={draft.slug}
              onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea
              rows={1}
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
            />
          </div>
          <Button
            type="button"
            onClick={add}
            disabled={pending || !draft.name}
          >
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>
    </>
  );
}
