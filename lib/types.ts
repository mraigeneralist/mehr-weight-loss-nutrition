import type { OrderStatus } from "./constants";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: "customer" | "admin";
  created_at: string;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
};

export type Product = {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  description: string | null;
  price_paise: number;
  weight_grams: number | null;
  stock: number;
  image_url: string | null;
  gallery_image_urls: string[];
  is_active: boolean;
  created_at: string;
};

export type ProductWithCategory = Product & {
  category: Pick<Category, "id" | "slug" | "name"> | null;
};

export type Address = {
  id: string;
  user_id: string;
  label: string | null;
  recipient_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
};

export type Order = {
  id: string;
  user_id: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  status: OrderStatus;
  subtotal_paise: number;
  shipping_paise: number;
  total_paise: number;
  address_snapshot: AddressSnapshot;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  name_snapshot: string;
  price_paise_snapshot: number;
  quantity: number;
};

export type OrderWithItems = Order & {
  items: OrderItem[];
};

export type AddressSnapshot = {
  recipient_name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
};

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  pricePaise: number;
  imageUrl: string | null;
  quantity: number;
  maxStock: number;
};
