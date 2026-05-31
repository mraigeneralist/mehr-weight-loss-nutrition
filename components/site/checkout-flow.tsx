"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AddressManager } from "@/components/site/address-manager";
import { useCart } from "@/lib/cart-store";
import { formatINR } from "@/lib/format";
import {
  SHIPPING_FLAT_PAISE,
  FREE_SHIP_THRESHOLD_PAISE,
} from "@/lib/constants";
import type { Address } from "@/lib/types";
import { cn } from "@/lib/utils";

function mergeAddress(prev: Address[], next: Address): Address[] {
  const idx = prev.findIndex((a) => a.id === next.id);
  // If the newly-saved address is default, clear is_default on the rest.
  const cleared = next.is_default
    ? prev.map((a) => (a.id === next.id ? a : { ...a, is_default: false }))
    : prev;
  if (idx >= 0) {
    return cleared.map((a) => (a.id === next.id ? next : a));
  }
  return [...cleared, next];
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

type Props = {
  userId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  addresses: Address[];
};

export function CheckoutFlow({
  userEmail,
  userName,
  userPhone,
  addresses: initialAddresses,
}: Props) {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotalPaise());
  const clear = useCart((s) => s.clear);

  const [addresses, setAddresses] = useState(initialAddresses);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialAddresses.find((a) => a.is_default)?.id ??
      initialAddresses[0]?.id ??
      null,
  );
  const [hydrated, setHydrated] = useState(false);
  const [placing, setPlacing] = useState(false);

  useEffect(() => setHydrated(true), []);

  const shipping =
    subtotal >= FREE_SHIP_THRESHOLD_PAISE ? 0 : SHIPPING_FLAT_PAISE;
  const total = subtotal + shipping;

  if (hydrated && items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Button asChild className="mt-4">
          <Link href="/products">Browse products</Link>
        </Button>
      </div>
    );
  }

  async function placeOrder() {
    if (!selectedId) {
      toast.error("Pick a shipping address");
      return;
    }
    if (typeof window === "undefined" || !window.Razorpay) {
      toast.error("Payment SDK didn't load. Refresh and try again.");
      return;
    }

    setPlacing(true);

    try {
      // Step 1: create Razorpay order on the server
      const createRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
          address_id: selectedId,
        }),
      });

      const created = await createRes.json();
      if (!createRes.ok) {
        throw new Error(created.error || "Could not create order");
      }

      const rzp = new window.Razorpay({
        key: created.key_id,
        amount: created.total_paise,
        currency: "INR",
        name: "Mehr Nutrition",
        description: `${items.length} item${items.length > 1 ? "s" : ""}`,
        order_id: created.razorpay_order_id,
        prefill: {
          name: userName,
          email: userEmail,
          contact: userPhone,
        },
        theme: { color: "#5F7A52" },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                items: items.map((i) => ({
                  productId: i.productId,
                  quantity: i.quantity,
                })),
                address_id: selectedId,
              }),
            });
            const verified = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verified.error || "Verification failed");
            }
            clear();
            toast.success("Order placed!");
            router.push(`/account/orders/${verified.order_id}`);
          } catch (e: any) {
            toast.error(e.message ?? "Verification failed");
          } finally {
            setPlacing(false);
          }
        },
        modal: {
          ondismiss: () => setPlacing(false),
        },
      });
      rzp.open();
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong");
      setPlacing(false);
    }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-semibold">
              Shipping address
            </h2>
            {addresses.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Add an address below to continue.
              </p>
            ) : (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {addresses.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(a.id)}
                      className={cn(
                        "w-full rounded-2xl border p-4 text-left transition-colors",
                        selectedId === a.id
                          ? "border-sage-deep bg-sage/10"
                          : "border-border bg-background hover:bg-sand/40",
                      )}
                    >
                      <p className="text-sm font-medium">
                        {a.label || "Address"}
                        {a.is_default && (
                          <span className="ml-2 rounded-full bg-sage/15 px-2 py-0.5 text-[10px] font-medium text-sage-deep">
                            Default
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-sm">{a.recipient_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.line1}
                        {a.line2 ? `, ${a.line2}` : ""},{" "}
                        {a.city}, {a.state} {a.pincode}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-5">
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-sage-deep">
                  + Add a new address
                </summary>
                <div className="mt-4">
                  <AddressManager
                    initial={[]}
                    onSaved={(addr) => {
                      setAddresses((prev) => mergeAddress(prev, addr));
                      setSelectedId(addr.id);
                    }}
                    onDeleted={(id) => {
                      setAddresses((prev) =>
                        prev.filter((a) => a.id !== id),
                      );
                      setSelectedId((curr) => (curr === id ? null : curr));
                    }}
                  />
                </div>
              </details>
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-xl font-semibold">Summary</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.productId} className="flex justify-between gap-3">
                <span className="truncate">
                  {i.name}{" "}
                  <span className="text-muted-foreground">× {i.quantity}</span>
                </span>
                <span className="tabular-nums">
                  {formatINR(i.pricePaise * i.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <Separator className="my-4" />
          <dl className="space-y-1 text-sm">
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
          <Button
            className="mt-5 w-full"
            size="lg"
            onClick={placeOrder}
            disabled={placing || !selectedId || items.length === 0}
          >
            {placing ? "Processing…" : "Pay with Razorpay"}
          </Button>
          {!selectedId && hydrated && items.length > 0 && (
            <p className="mt-2 text-center text-xs text-terracotta">
              {addresses.length === 0
                ? "Add a shipping address to continue."
                : "Select a shipping address to continue."}
            </p>
          )}
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Cards, UPI, net-banking and wallets accepted.
          </p>
        </aside>
      </div>
    </>
  );
}
