@AGENTS.md

# Mehr Nutrition — Nutrition & Wellness E-commerce

This repo is a production-ready e-commerce site for **Mehr Nutrition Centre**
(mehrnutrition.in), a Chennai-based Herbalife nutrition distributor. The owner
sells weight-management shakes, daily-wellness supplements, targeted health
products, sports nutrition, and skin care (5 categories, 33 products). The site
has a public storefront, customer accounts, Razorpay checkout, and a built-in
admin dashboard so the owner can manage everything without ever touching SQL.

Catalog images live in `public/products/*.webp` (product shots) and
`public/product-info/*.jpeg` (benefit/ingredient info cards, used as the gallery
image on each product detail page). Brand/contact constants are in
`lib/constants.ts`.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15+ (App Router, RSC) + TypeScript |
| Styling | Tailwind CSS v4 with custom earthy theme tokens in `app/globals.css` |
| UI primitives | shadcn/ui (Radix-based) in `components/ui/*` |
| Forms | react-hook-form + zod |
| State | zustand for cart (persisted to localStorage as `sattva-cart-v2`) |
| Auth + DB | Supabase (`@supabase/ssr`, cookie-based sessions) |
| Payments | Razorpay (server-create-order → client-checkout → server-verify-signature) |
| File uploads | Supabase Storage bucket `product-images` (public read, admin write) |
| Charts | recharts |
| Fonts | Inter (body) + Fraunces (display serif) via `next/font/google` |
| Deployment | Vercel |

## Directory map

```
app/
  page.tsx                       Home
  products/                      Catalog + product detail
  categories/[slug]/             Category landing
  cart/                          Cart page
  checkout/                      Checkout (Razorpay)
  account/                       Customer account (auth-guarded)
  admin/                         Admin dashboard (role='admin'-guarded)
  (auth)/login,sign-up           Auth pages
  auth/callback/                 Email confirmation handler
  api/razorpay/{create-order,verify}/   Payment routes
  api/admin/{products,upload-image,orders/[id]/status}/   Admin write APIs

components/
  ui/                            shadcn primitives
  site/                          Storefront components
  admin/                         Admin-only components

lib/
  supabase/{client,server,middleware}.ts
  razorpay.ts                    Razorpay client + signature verifier
  cart-store.ts                  zustand store
  format.ts                      formatINR(paise), date helpers
  constants.ts                   shipping, statuses, store name, states
  types.ts                       DB row types
  auth.ts                        getCurrentProfile(), isAdmin()

scripts/
  generate-placeholders.mjs      Generates SVG tiles into public/

supabase/
  seed.sql                       Schema + RLS + bucket policies + seed data

middleware.ts                    Refreshes Supabase session every request
```

## Database schema

All in `supabase/seed.sql`. Tables:

- `profiles` — extends `auth.users`. Has `role: 'customer' | 'admin'`. Trigger
  auto-creates a row on sign-up.
- `categories`, `products` — public catalog. Prices stored as **paise** (int).
  `formatINR(paise)` for display, `rupeesToPaise(rupees)` to write.
- `addresses` — per user, with `is_default` flag.
- `orders`, `order_items` — written ONLY by `/api/razorpay/verify` using the
  service-role key after signature verification.

RLS is on for every table. The SQL helper `is_admin()` is used by every
admin-write policy.

## Admin model

- Role-based, single role: `admin` (set on `profiles.role`).
- Layout `app/admin/layout.tsx` calls `isAdmin()` server-side and 404s if not.
- Admin writes go through `/api/admin/*` routes which re-check `isAdmin()`
  before touching the DB.
- "Admin" link appears in the header only for admin sessions.

## How payments work

1. Client → `POST /api/razorpay/create-order` with cart item ids + address id.
2. Server re-prices from DB, creates a Razorpay order, returns the order id.
3. Razorpay Checkout JS opens, user pays, returns `{order_id, payment_id, signature}`.
4. Client → `POST /api/razorpay/verify` with the trio + items + address.
5. Server verifies HMAC-SHA256 signature, fetches Razorpay order to confirm
   `status='paid'` and `notes.user_id` matches, re-prices once more, then
   inserts `orders` + `order_items` (service-role, bypasses RLS) and decrements
   stock.

## Common tasks

- **Owner adds a product** → `/admin/products/new`. Do NOT instruct them to edit SQL.
- **Owner marks out of stock** → toggle on `/admin/products` row.
- **Owner ships an order** → status select on `/admin/orders/[id]`. Customer
  sees the new status on `/account/orders/[id]`.
- **Add a new product image to seed data** → drop `<slug>.svg` (or `.jpg`)
  into `public/products/` and point `image_url` in the DB at it.
- **Change theme colors** → CSS variables in `app/globals.css`.
- **Add a new admin page** → drop under `app/admin/`. The layout's role guard
  applies automatically.

## Things NOT to do

- Don't trust client-side prices. `/api/razorpay/create-order` and
  `/api/razorpay/verify` re-price every item from the DB.
- Don't expose `SUPABASE_SERVICE_ROLE_KEY` to the browser. Only used in
  `lib/supabase/server.ts#createServiceClient`, called from server routes.
- Don't bypass `is_admin()` by reading admin data with the service-role
  client. Use the user-context client so RLS enforces the role check.
- Don't delete products in admin — soft-delete via `is_active=false` so
  existing orders still resolve product names.

## Setup / first-time install

See `SETUP.md` for the full step-by-step (Supabase project, env vars,
Razorpay keys, Vercel deploy, promoting yourself to admin).
