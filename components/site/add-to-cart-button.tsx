"use client";

import { useState } from "react";
import { ShoppingBag, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-store";
import type { Product } from "@/lib/types";

type Props = {
  product: Product;
  compact?: boolean;
};

export function AddToCartButton({ product, compact }: Props) {
  const add = useCart((s) => s.add);
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const inCart = items.find((i) => i.productId === product.id);
  const [adding, setAdding] = useState(false);

  const outOfStock = !product.is_active || product.stock <= 0;

  function onAdd() {
    setAdding(true);
    add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        pricePaise: product.price_paise,
        imageUrl: product.image_url,
        maxStock: product.stock,
      },
      1,
    );
    toast.success(`Added to cart`, { description: product.name });
    setTimeout(() => setAdding(false), 200);
  }

  if (outOfStock) {
    return (
      <Button
        variant="outline"
        disabled
        size={compact ? "sm" : "default"}
        className="w-full"
      >
        Out of stock
      </Button>
    );
  }

  if (inCart) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-1 py-1">
        <button
          aria-label="Decrease"
          onClick={() => setQuantity(product.id, inCart.quantity - 1)}
          className="grid h-7 w-7 place-items-center rounded hover:bg-sand"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="text-sm font-medium tabular-nums">
          {inCart.quantity} in cart
        </span>
        <button
          aria-label="Increase"
          onClick={() => setQuantity(product.id, inCart.quantity + 1)}
          disabled={inCart.quantity >= product.stock}
          className="grid h-7 w-7 place-items-center rounded hover:bg-sand disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <Button
      onClick={onAdd}
      disabled={adding}
      size={compact ? "sm" : "default"}
      className="w-full"
    >
      <ShoppingBag className="h-4 w-4" />
      Add to cart
    </Button>
  );
}
