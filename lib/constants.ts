export const SHIPPING_FLAT_PAISE = 4900;
export const FREE_SHIP_THRESHOLD_PAISE = 50000;

export const ORDER_STATUSES = [
  "created",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
  "failed",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  created: "Created",
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  failed: "Failed",
};

export const STORE_NAME = "Mehr Nutrition";
export const STORE_TAGLINE = "Nutrition That Nurtures";

export const STORE_PHONE = "+91 94990 05286";
export const STORE_WHATSAPP = "919499005286";
export const STORE_EMAIL = "info@mehrnutrition.in";
export const STORE_ADDRESS =
  "No. 10, Sathyamoorthy Street, Vijayalakshmipuram, Ambattur, Chennai 600053";

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;
