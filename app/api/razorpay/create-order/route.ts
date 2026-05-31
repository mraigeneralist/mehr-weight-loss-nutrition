import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getRazorpay } from "@/lib/razorpay";
import {
  SHIPPING_FLAT_PAISE,
  FREE_SHIP_THRESHOLD_PAISE,
} from "@/lib/constants";
import { DATA_BACKEND } from "@/lib/data/backend";
import { getProductsByIds } from "@/lib/data/catalog";
import type { Address, Product } from "@/lib/types";

const Items = z
  .array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive(),
    }),
  )
  .min(1);

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  if (DATA_BACKEND === "sheets") return createOrderSheets(json);
  return createOrderSupabase(json);
}

// ---------------------------------------------------------------------------
// Sheets backend: guest checkout, no Supabase auth. Re-price from the sheet.
// ---------------------------------------------------------------------------
const GuestBody = z.object({
  items: Items,
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email().or(z.literal("")),
    phone: z.string().min(5),
  }),
  address: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().min(4),
  }),
});

async function createOrderSheets(json: unknown) {
  const parsed = GuestBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { items } = parsed.data;
  const products = await getProductsByIds(items.map((i) => i.productId));
  const map = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  for (const item of items) {
    const p = map.get(item.productId);
    if (!p) {
      return NextResponse.json({ error: "Product unavailable" }, { status: 400 });
    }
    if (p.stock < item.quantity) {
      return NextResponse.json(
        { error: `Insufficient stock for ${p.name}` },
        { status: 400 },
      );
    }
    subtotal += p.price_paise * item.quantity;
  }
  const shipping =
    subtotal >= FREE_SHIP_THRESHOLD_PAISE ? 0 : SHIPPING_FLAT_PAISE;
  const total = subtotal + shipping;

  try {
    const rzp = getRazorpay();
    const order = await rzp.orders.create({
      amount: total,
      currency: "INR",
      receipt: `r_${Date.now()}`,
      notes: {
        customer: parsed.data.customer.name,
        phone: parsed.data.customer.phone,
      },
    });
    return NextResponse.json({
      razorpay_order_id: order.id,
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      total_paise: total,
    });
  } catch (e: any) {
    console.error("Razorpay create order failed", e);
    return NextResponse.json(
      { error: e?.error?.description ?? "Could not create order" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Supabase backend: authenticated checkout against a saved address.
// ---------------------------------------------------------------------------
const Body = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  address_id: z.string().uuid(),
});

async function createOrderSupabase(json: unknown) {
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Verify the address belongs to the user
  const { data: address } = await supabase
    .from("addresses")
    .select("*")
    .eq("id", parsed.data.address_id)
    .eq("user_id", user.id)
    .maybeSingle<Address>();
  if (!address) {
    return NextResponse.json({ error: "Address not found" }, { status: 400 });
  }

  // Re-price from DB — never trust client prices.
  const productIds = parsed.data.items.map((i) => i.productId);
  const { data: dbProducts } = await supabase
    .from("products")
    .select("id, name, price_paise, stock, is_active")
    .in("id", productIds);
  const productMap = new Map(
    ((dbProducts ?? []) as Pick<Product, "id" | "name" | "price_paise" | "stock" | "is_active">[]).map(
      (p) => [p.id, p],
    ),
  );

  let subtotal = 0;
  for (const item of parsed.data.items) {
    const p = productMap.get(item.productId);
    if (!p || !p.is_active) {
      return NextResponse.json(
        { error: `Product unavailable` },
        { status: 400 },
      );
    }
    if (p.stock < item.quantity) {
      return NextResponse.json(
        { error: `Insufficient stock for ${p.name}` },
        { status: 400 },
      );
    }
    subtotal += p.price_paise * item.quantity;
  }
  const shipping =
    subtotal >= FREE_SHIP_THRESHOLD_PAISE ? 0 : SHIPPING_FLAT_PAISE;
  const total = subtotal + shipping;

  // Create Razorpay order
  try {
    const rzp = getRazorpay();
    const order = await rzp.orders.create({
      amount: total,
      currency: "INR",
      receipt: `r_${Date.now()}_${user.id.slice(0, 8)}`,
      notes: { user_id: user.id, address_id: address.id },
    });

    return NextResponse.json({
      razorpay_order_id: order.id,
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      total_paise: total,
    });
  } catch (e: any) {
    console.error("Razorpay create order failed", e);
    return NextResponse.json(
      { error: e?.error?.description ?? "Could not create order" },
      { status: 500 },
    );
  }
}
