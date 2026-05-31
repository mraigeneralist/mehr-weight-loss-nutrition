import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { verifyRazorpaySignature, getRazorpay } from "@/lib/razorpay";
import {
  SHIPPING_FLAT_PAISE,
  FREE_SHIP_THRESHOLD_PAISE,
} from "@/lib/constants";
import type { Address, Product } from "@/lib/types";

const Body = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Verify signature first — refuse anything we can't trust.
  const ok = verifyRazorpaySignature({
    orderId: parsed.data.razorpay_order_id,
    paymentId: parsed.data.razorpay_payment_id,
    signature: parsed.data.razorpay_signature,
  });
  if (!ok) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Pull authoritative order info from Razorpay (notes carry user_id + address_id)
  let rzpOrder;
  try {
    rzpOrder = await getRazorpay().orders.fetch(parsed.data.razorpay_order_id);
  } catch (e) {
    return NextResponse.json(
      { error: "Could not fetch Razorpay order" },
      { status: 500 },
    );
  }

  if (rzpOrder.status !== "paid") {
    return NextResponse.json(
      { error: `Order not paid (status: ${rzpOrder.status})` },
      { status: 400 },
    );
  }

  const notes = (rzpOrder.notes ?? {}) as Record<string, string>;
  if (notes.user_id !== user.id) {
    return NextResponse.json({ error: "Order/user mismatch" }, { status: 403 });
  }

  // Fetch line items from Razorpay payments (we'll need item ids/qty from our own session)
  // Instead we look up the latest cart-equivalent: use the address from notes and
  // re-derive items from the payment description? — Razorpay doesn't store our cart.
  // We persisted nothing yet, so we need the cart from the request? — but the
  // verifier shouldn't trust the client cart any more than create-order did.
  //
  // Solution: re-create line items by reading the address and re-pricing the
  // last unverified order whose razorpay_order_id matches. Since we don't
  // persist orders before payment, we read the cart from a separate request body.
  // But we already moved this off the body for security.
  //
  // Simplest robust approach for v1: the client posts the ITEM IDs as well
  // and we re-price from DB and compare against Razorpay's amount. Mismatch → reject.

  // Read items from the request body again (we already parsed via zod which is
  // strict; extend it inline).
  const ExtBody = Body.extend({
    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          quantity: z.number().int().positive(),
        }),
      )
      .min(1)
      .optional(),
    address_id: z.string().uuid().optional(),
  });
  const ext = ExtBody.safeParse(json);
  let lineItemsInput = ext.success ? ext.data.items : undefined;
  let addressIdInput = ext.success ? ext.data.address_id : undefined;
  if (!lineItemsInput || lineItemsInput.length === 0) {
    return NextResponse.json(
      { error: "Missing line items" },
      { status: 400 },
    );
  }
  if (!addressIdInput) addressIdInput = notes.address_id;

  // Re-price authoritative
  const productIds = lineItemsInput.map((i) => i.productId);
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
  for (const it of lineItemsInput) {
    const p = productMap.get(it.productId);
    if (!p || !p.is_active) {
      return NextResponse.json(
        { error: "Product no longer available" },
        { status: 400 },
      );
    }
    subtotal += p.price_paise * it.quantity;
  }
  const shipping =
    subtotal >= FREE_SHIP_THRESHOLD_PAISE ? 0 : SHIPPING_FLAT_PAISE;
  const total = subtotal + shipping;

  if (total !== Number(rzpOrder.amount)) {
    return NextResponse.json(
      { error: "Amount mismatch" },
      { status: 400 },
    );
  }

  // Address snapshot
  const { data: address } = await supabase
    .from("addresses")
    .select("*")
    .eq("id", addressIdInput!)
    .eq("user_id", user.id)
    .maybeSingle<Address>();
  if (!address) {
    return NextResponse.json({ error: "Address not found" }, { status: 400 });
  }
  const addressSnapshot = {
    recipient_name: address.recipient_name,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
  };

  // Service client → bypass RLS for the atomic order write.
  const svc = createServiceClient();

  // Idempotency: if an order already exists for this razorpay_order_id, return it.
  const { data: existing } = await svc
    .from("orders")
    .select("id")
    .eq("razorpay_order_id", parsed.data.razorpay_order_id)
    .maybeSingle<{ id: string }>();
  if (existing) {
    return NextResponse.json({ order_id: existing.id });
  }

  const { data: order, error: orderErr } = await svc
    .from("orders")
    .insert({
      user_id: user.id,
      razorpay_order_id: parsed.data.razorpay_order_id,
      razorpay_payment_id: parsed.data.razorpay_payment_id,
      razorpay_signature: parsed.data.razorpay_signature,
      status: "paid",
      subtotal_paise: subtotal,
      shipping_paise: shipping,
      total_paise: total,
      address_snapshot: addressSnapshot,
    })
    .select()
    .single();

  if (orderErr || !order) {
    console.error("Order insert failed", orderErr);
    return NextResponse.json(
      { error: "Could not save order" },
      { status: 500 },
    );
  }

  // Insert items + decrement stock
  const itemRows = lineItemsInput.map((it) => {
    const p = productMap.get(it.productId)!;
    return {
      order_id: order.id,
      product_id: it.productId,
      name_snapshot: p.name,
      price_paise_snapshot: p.price_paise,
      quantity: it.quantity,
    };
  });
  const { error: itemsErr } = await svc.from("order_items").insert(itemRows);
  if (itemsErr) {
    console.error("Order items insert failed", itemsErr);
  }

  // Decrement stock (best-effort, non-transactional for v1)
  for (const it of lineItemsInput) {
    const p = productMap.get(it.productId)!;
    await svc
      .from("products")
      .update({ stock: Math.max(0, p.stock - it.quantity) })
      .eq("id", it.productId);
  }

  return NextResponse.json({ order_id: order.id });
}
