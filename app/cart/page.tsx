import type { Metadata } from "next";
import { CartView } from "@/components/site/cart-view";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <div className="container-prose py-12 md:py-16">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-bold md:text-5xl">
          Your cart
        </h1>
      </header>
      <CartView />
    </div>
  );
}
