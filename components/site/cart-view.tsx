"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/cart-store";
import { formatINR } from "@/lib/format";
import {
  SHIPPING_FLAT_PAISE,
  FREE_SHIP_THRESHOLD_PAISE,
} from "@/lib/constants";

export function CartView() {
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const subtotal = useCart((s) => s.subtotalPaise());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  if (!hydrated) {
    return (
      <div className="rounded-2xl border border-border p-12 text-center text-muted-foreground">
        Loading cart…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card p-14 text-center">
        <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="mt-4 font-display text-2xl font-semibold">
          Your cart is empty
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Once you add something tasty, it'll show up here.
        </p>
        <Button asChild className="mt-6">
          <Link href="/products">Browse the pantry</Link>
        </Button>
      </div>
    );
  }

  const shipping =
    subtotal >= FREE_SHIP_THRESHOLD_PAISE ? 0 : SHIPPING_FLAT_PAISE;
  const total = subtotal + shipping;

  return (
    <div className="grid gap-10 lg:grid-cols-3">
      <ul className="space-y-5 lg:col-span-2">
        {items.map((item) => {
          const img = item.imageUrl || `/products/${item.slug}.svg`;
          return (
            <li
              key={item.productId}
              className="flex gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <Link
                href={`/products/${item.slug}`}
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-sand"
              >
                <Image
                  src={img}
                  alt={item.name}
                  width={400}
                  height={400}
                  className="h-full w-full object-cover"
                />
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/products/${item.slug}`}
                    className="font-display text-lg font-semibold leading-tight hover:underline"
                  >
                    {item.name}
                  </Link>
                  <button
                    onClick={() => remove(item.productId)}
                    aria-label="Remove"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatINR(item.pricePaise)} each
                </p>
                <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                  <div className="inline-flex items-center gap-1 rounded-md border border-border bg-background p-1">
                    <button
                      aria-label="Decrease"
                      onClick={() =>
                        setQuantity(item.productId, item.quantity - 1)
                      }
                      className="grid h-7 w-7 place-items-center rounded hover:bg-sand"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-6 text-center text-sm tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      aria-label="Increase"
                      onClick={() =>
                        setQuantity(item.productId, item.quantity + 1)
                      }
                      disabled={item.quantity >= item.maxStock}
                      className="grid h-7 w-7 place-items-center rounded hover:bg-sand disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="font-medium tabular-nums">
                    {formatINR(item.pricePaise * item.quantity)}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <aside className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-xl font-semibold">Order summary</h2>
        <Separator className="my-4" />
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="tabular-nums">{formatINR(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Shipping</dt>
            <dd className="tabular-nums">
              {shipping === 0 ? "Free" : formatINR(shipping)}
            </dd>
          </div>
        </dl>
        <Separator className="my-4" />
        <div className="flex items-baseline justify-between">
          <p className="font-display text-base font-semibold">Total</p>
          <p className="font-display text-2xl font-bold tabular-nums">
            {formatINR(total)}
          </p>
        </div>

        {subtotal < FREE_SHIP_THRESHOLD_PAISE && (
          <p className="mt-3 rounded-lg bg-sand/70 p-3 text-xs text-foreground/80">
            Spend {formatINR(FREE_SHIP_THRESHOLD_PAISE - subtotal)} more for
            free shipping.
          </p>
        )}

        <Button asChild className="mt-5 w-full" size="lg">
          <Link href="/checkout">Checkout</Link>
        </Button>
        <Button asChild variant="ghost" className="mt-2 w-full">
          <Link href="/products">Keep shopping</Link>
        </Button>
      </aside>
    </div>
  );
}
