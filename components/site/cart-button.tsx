"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-store";

export function CartButton() {
  const totalItems = useCart((s) => s.totalItems());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  return (
    <Link
      href="/cart"
      aria-label="Open cart"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-sand transition-colors"
    >
      <ShoppingBag className="h-5 w-5" />
      {hydrated && totalItems > 0 && (
        <span className="absolute -top-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-terracotta text-[11px] font-semibold text-white">
          {totalItems}
        </span>
      )}
    </Link>
  );
}
