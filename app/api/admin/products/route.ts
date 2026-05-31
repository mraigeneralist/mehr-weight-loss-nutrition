import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";

const Body = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
  category_id: z.string().uuid(),
  description: z.string().nullable().optional(),
  price_paise: z.number().int().nonnegative(),
  weight_grams: z.number().int().nonnegative().nullable().optional(),
  stock: z.number().int().nonnegative(),
  image_url: z.string().nullable().optional(),
  gallery_image_urls: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
});

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert(parsed.data)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ product: data });
}
