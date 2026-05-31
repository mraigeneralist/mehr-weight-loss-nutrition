"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/image-upload";
import { MultiImageUpload } from "@/components/admin/multi-image-upload";
import { rupeesToPaise, paiseToRupees } from "@/lib/format";
import type { Category, Product } from "@/lib/types";

const numberFromInput = (msg = "Required") =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number({ message: msg }),
  );

const Schema = z.object({
  name: z.string().min(2, "Required"),
  slug: z
    .string()
    .min(2, "Required")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and dashes only"),
  category_id: z.string().uuid("Pick a category"),
  description: z.string().optional(),
  price_rupees: numberFromInput().pipe(
    z.number().positive("Must be greater than 0"),
  ),
  weight_grams: z
    .preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
      z.number().int().nonnegative().optional(),
    )
    .optional(),
  stock: numberFromInput().pipe(z.number().int().nonnegative()),
  image_url: z.string().nullable().optional(),
  gallery_image_urls: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
});

type Values = z.input<typeof Schema>;
type ParsedValues = z.output<typeof Schema>;

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function ProductForm({
  initial,
  categories,
}: {
  initial?: Product;
  categories: Category[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));

  const form = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: {
      name: initial?.name ?? "",
      slug: initial?.slug ?? "",
      category_id: initial?.category_id ?? categories[0]?.id ?? "",
      description: initial?.description ?? "",
      price_rupees: initial ? paiseToRupees(initial.price_paise) : 0,
      weight_grams: initial?.weight_grams ?? undefined,
      stock: initial?.stock ?? 100,
      image_url: initial?.image_url ?? null,
      gallery_image_urls: initial?.gallery_image_urls ?? [],
      is_active: initial?.is_active ?? true,
    },
  });

  function onSubmit(raw: Values) {
    const values = raw as unknown as ParsedValues;
    start(async () => {
      const payload = {
        name: values.name,
        slug: values.slug,
        category_id: values.category_id,
        description: values.description ?? null,
        price_paise: rupeesToPaise(values.price_rupees),
        weight_grams: values.weight_grams ?? null,
        stock: values.stock,
        image_url: values.image_url ?? null,
        gallery_image_urls: values.gallery_image_urls ?? [],
        is_active: values.is_active,
      };

      const url = initial
        ? `/api/admin/products/${initial.id}`
        : "/api/admin/products";
      const method = initial ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error || "Could not save");
        return;
      }
      toast.success(initial ? "Product updated" : "Product created");
      router.push("/admin/products");
      router.refresh();
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-8 lg:grid-cols-[1fr_320px]"
      >
        <div className="space-y-5 rounded-2xl border border-border bg-card p-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      if (!slugTouched) {
                        form.setValue("slug", slugify(e.target.value));
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(e) => {
                      setSlugTouched(true);
                      field.onChange(e);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea rows={5} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="price_rupees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (₹)</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="decimal"
                      type="number"
                      step="0.01"
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      onChange={field.onChange}
                      value={(field.value ?? "") as string | number}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="weight_grams"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (g)</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      type="number"
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      onChange={field.onChange}
                      value={(field.value ?? "") as string | number}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      type="number"
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      onChange={field.onChange}
                      value={(field.value ?? "") as string | number}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-6">
            <FormLabel>Cover image</FormLabel>
            <p className="mt-1 mb-3 text-xs text-muted-foreground">
              The first image customers see. Used everywhere except the
              gallery on the product detail page.
            </p>
            <ImageUpload
              value={form.watch("image_url") ?? null}
              onChange={(url) =>
                form.setValue("image_url", url, { shouldDirty: true })
              }
            />
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <FormLabel>Gallery images</FormLabel>
            <p className="mt-1 mb-3 text-xs text-muted-foreground">
              Extra angles, packaging, lifestyle shots. Customers swipe
              through these on the product page.
            </p>
            <MultiImageUpload
              value={form.watch("gallery_image_urls") ?? []}
              onChange={(urls) =>
                form.setValue("gallery_image_urls", urls, {
                  shouldDirty: true,
                })
              }
            />
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="active" className="text-sm font-medium">
                Active (visible to customers)
              </Label>
              <Switch
                id="active"
                checked={form.watch("is_active")}
                onCheckedChange={(v) =>
                  form.setValue("is_active", Boolean(v), { shouldDirty: true })
                }
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Inactive products are hidden from /products and don't accept new orders.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={pending}
          >
            {pending ? "Saving…" : initial ? "Save changes" : "Create product"}
          </Button>
        </aside>
      </form>
    </Form>
  );
}
