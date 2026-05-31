import "server-only";
import { appendRow } from "@/lib/sheets/client";
import { paiseToRupees } from "@/lib/format";

export type CapturedOrderItem = {
  name: string;
  quantity: number;
  price_paise: number;
};

export type CapturedOrder = {
  ref: string;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  items: CapturedOrderItem[];
  subtotal_paise: number;
  shipping_paise: number;
  total_paise: number;
  razorpay_order_id: string;
  razorpay_payment_id: string;
};

/**
 * Appends a paid order as one row to the sheet's "Orders" tab. Create that tab
 * once with a header row (any names) — appends go to the bottom regardless.
 * Suggested columns:
 *   ref | created_at | status | customer_name | email | phone | address |
 *   items | subtotal_inr | shipping_inr | total_inr | razorpay_order_id |
 *   razorpay_payment_id
 */
export async function recordOrderToSheet(order: CapturedOrder): Promise<void> {
  const items = order.items
    .map(
      (i) =>
        `${i.name} x${i.quantity} (${paiseToRupees(i.price_paise * i.quantity)})`,
    )
    .join("; ");

  await appendRow("Orders", [
    order.ref,
    new Date().toISOString(),
    "paid",
    order.customer_name,
    order.email,
    order.phone,
    order.address,
    items,
    paiseToRupees(order.subtotal_paise),
    paiseToRupees(order.shipping_paise),
    paiseToRupees(order.total_paise),
    order.razorpay_order_id,
    order.razorpay_payment_id,
  ]);
}
