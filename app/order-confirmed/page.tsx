import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Order confirmed" };

export default async function OrderConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <div className="container-prose flex flex-col items-center py-24 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-sage/15 text-sage-deep">
        <CheckCircle2 className="h-8 w-8" />
      </span>
      <h1 className="mt-6 font-display text-4xl font-bold md:text-5xl">
        Thank you for your order!
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        Your payment was successful and your order has been recorded. Our team
        at Mehr Nutrition will reach out shortly to confirm delivery.
      </p>
      {ref && (
        <p className="mt-6 rounded-full bg-sand px-4 py-2 text-sm">
          Order reference:{" "}
          <span className="font-semibold tracking-wide">{ref}</span>
        </p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/products">Continue shopping</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/">Back home</Link>
        </Button>
      </div>
    </div>
  );
}
