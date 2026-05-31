import Razorpay from "razorpay";
import crypto from "node:crypto";

let _instance: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (_instance) return _instance;
  const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("Razorpay keys are not configured");
  }
  _instance = new Razorpay({ key_id, key_secret });
  return _instance;
}

export function verifyRazorpaySignature(args: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const body = `${args.orderId}|${args.paymentId}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  // timing-safe equality
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(args.signature, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
