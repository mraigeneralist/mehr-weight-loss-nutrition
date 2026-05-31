# Mehr Nutrition — Nutrition & Wellness E-commerce

A production-ready Next.js storefront for **Mehr Nutrition Centre**, Chennai —
a Herbalife nutrition distributor. Weight management, daily wellness, targeted
health, sports nutrition and skin care. Cart, accounts, Razorpay checkout, and
a built-in admin dashboard for managing products, orders, and analytics.

## Stack

Next.js 16 · TypeScript · Tailwind v4 · shadcn/ui · Supabase (auth + DB +
storage) · Razorpay · Vercel.

## Quick start

```bash
npm install
cp .env.local.example .env.local   # then fill in your keys
npm run dev
```

Then open http://localhost:3000.

## First-time setup

Read **[SETUP.md](./SETUP.md)** — it walks through Supabase, Razorpay,
Vercel, and how to promote an account to admin. Takes about 15 minutes
end-to-end.

## Architecture & conventions

Read **[CLAUDE.md](./CLAUDE.md)** — directory map, payment flow, admin
model, and the "things NOT to do" list.

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — eslint
- `node scripts/generate-placeholders.mjs` — regenerate the SVG product
  tiles in `public/`
