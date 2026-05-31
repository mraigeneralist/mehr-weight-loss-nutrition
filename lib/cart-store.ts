"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/types";

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  totalItems: () => number;
  subtotalPaise: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, quantity = 1) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId,
          );
          if (existing) {
            const next = Math.min(existing.quantity + quantity, item.maxStock);
            return {
              items: state.items.map((i) =>
                i.productId === item.productId ? { ...i, quantity: next } : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { ...item, quantity: Math.min(quantity, item.maxStock) },
            ],
          };
        });
      },
      remove: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.productId === productId
                ? {
                    ...i,
                    quantity: Math.max(
                      0,
                      Math.min(quantity, i.maxStock),
                    ),
                  }
                : i,
            )
            .filter((i) => i.quantity > 0),
        })),
      clear: () => set({ items: [] }),
      totalItems: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotalPaise: () =>
        get().items.reduce((sum, i) => sum + i.pricePaise * i.quantity, 0),
    }),
    {
      name: "mehr-cart-v1",
    },
  ),
);
