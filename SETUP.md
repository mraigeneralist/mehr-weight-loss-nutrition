# Mehr Nutrition — Setup Guide

Step-by-step to get the storefront running locally and deployed on Vercel.
Plain English, no detective work.

---

## 1. Prerequisites

You need accounts on:
- **Supabase** — https://supabase.com (free tier is fine)
- **Razorpay** — https://razorpay.com (test keys are fine to start)
- **Vercel** — https://vercel.com (free hobby plan is fine)
- **GitHub** — already done; the repo is at
  https://github.com/mraigeneralist/heath-foods-ecom-website

And on your machine:
- **Node.js 20+** — `node --version`
- **Git** — `git --version`

---

## 2. Clone & install

```bash
git clone https://github.com/mraigeneralist/heath-foods-ecom-website
cd heath-foods-ecom-website
npm install
```

---

## 3. Supabase setup

### 3a. Create a project

1. Go to https://supabase.com/dashboard, click **New project**.
2. Pick a name (e.g. *sattva*), set a strong DB password, choose a region
   close to your customers (Mumbai for India), click Create.
3. Wait ~1 minute for the project to provision.

### 3b. Grab your keys

In the project: **Project Settings → API**. Copy these (you'll paste them
into `.env.local` in a minute):
- **Project URL** → goes into `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public key** → goes into `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** → goes into `SUPABASE_SERVICE_ROLE_KEY`
  (treat this like a password — server-side only, never commit it)

### 3c. Run the schema + seed SQL

1. Open **SQL Editor** in the Supabase dashboard.
2. Click **+ New query**.
3. Open `supabase/seed.sql` from this repo, copy the whole file, paste into
   the SQL editor, and click **Run**.

> **If you hit `relation "..." does not exist`**: paste the SQL from the
> raw GitHub view (`raw.githubusercontent.com/.../seed.sql`) instead of
> through any markdown/code-rendered preview — some renderers silently
> convert straight quotes to "smart" quotes which breaks string literals.

That creates every table (`profiles`, `categories`, `products`, `addresses`,
`orders`, `order_items`), enables Row-Level Security, defines an `is_admin()`
helper, sets up a sign-up trigger, and seeds 3 categories × 5 products.

### 3d. Create the storage bucket

1. Open **Storage** → **New bucket**.
2. Name: `product-images`. Toggle **Public bucket: ON**. Click Create.
3. Re-run `supabase/seed.sql` (or just the storage policy block at the
   bottom) — the storage RLS policies need the bucket to exist first.

That's it for Supabase storage. The admin upload UI handles the rest.

### 3e. Email confirmation (optional but recommended)

By default Supabase requires email confirmation on sign-up. For local
testing it's easier without it:

- **Authentication → Providers → Email**, scroll to **Confirm email** and
  toggle it OFF. (Turn it back on for production.)

---

## 4. Razorpay setup

1. Sign in at https://dashboard.razorpay.com.
2. Make sure you're in **Test Mode** (toggle in the top bar). Keep this on
   until you've completed KYC and want to take real money.
3. Go to **Account & Settings → API Keys** → **Generate Test Key**.
4. Copy:
   - **Key Id** → `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - **Key Secret** → `RAZORPAY_KEY_SECRET`

Test card for the checkout: `4111 1111 1111 1111`, any future expiry, any CVV,
any OTP.

---

## 5. Local environment file

Copy `.env.local.example` to `.env.local` and fill in the values you collected:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiI...

NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 6. Run it locally

```bash
npm run dev
```

Open http://localhost:3000. You should see the home page with three category
cards and the seeded products. Click around:

- Sign up at `/sign-up`
- Add things to cart, hit `/cart`, then `/checkout`
- Pay with the test card → land on the order confirmation page

If anything looks broken, double-check the env vars and that the SQL ran
without errors in the Supabase SQL editor.

---

## 7. Push to GitHub

```bash
git add .
git commit -m "Initial scaffold"
git remote add origin https://github.com/mraigeneralist/heath-foods-ecom-website.git
git branch -M main
git push -u origin main
```

(If you cloned the repo, the remote is already set; just `git add` /
`git commit` / `git push`.)

---

## 8. Deploy to Vercel

1. Go to https://vercel.com/new, **Import** your GitHub repo.
2. Framework preset is auto-detected as Next.js. Leave defaults.
3. Add environment variables (the same six from step 5). Set
   `NEXT_PUBLIC_SITE_URL` to your Vercel URL (e.g.
   `https://sattva-foods.vercel.app`).
4. Click **Deploy**. ~2 minutes later, your site is live.

---

## 9. Tell Supabase about your new domain

In Supabase: **Authentication → URL Configuration**:

- **Site URL** → your Vercel URL (e.g. `https://sattva-foods.vercel.app`)
- **Redirect URLs** → add the same URL plus `https://<vercel-url>/auth/callback`

Without this, email confirmation links and password resets won't redirect
back to your site.

---

## 10. Promote yourself (or the owner) to admin

The first sign-up is just a normal customer. To unlock the admin dashboard:

1. Sign up through `/sign-up` with the email you (or the owner) want to use
   as the admin.
2. Open **Supabase → SQL Editor** and run:

   ```sql
   update profiles
     set role = 'admin'
     where id = (select id from auth.users where email = 'owner@example.com');
   ```

3. Refresh the website. An "Admin" link appears in the header for that
   account. `/admin` is now accessible.

You can promote multiple people the same way.

---

## 11. Using the admin dashboard

- **Add a product** → `/admin/products/new`. Fill in the form, drop an
  image (≤ 5 MB). The product appears on the storefront immediately.
- **Mark out of stock** → `/admin/products` → flip the inline toggle on
  any row.
- **Ship an order** → `/admin/orders/[id]` → change the status select.
  The customer sees the new status on their `/account/orders/[id]` page.
- **Watch sales** → `/admin/analytics` for revenue trends and top
  products. Quick KPIs are on `/admin`.

When the owner gives you real product photos:
- Upload via the admin UI for each product (recommended), OR
- For batch updates: drop the photos at `public/products/<slug>.jpg` and
  update `image_url` in the `products` table to `/products/<slug>.jpg`.

---

## 12. Going live with Razorpay

1. Complete KYC on Razorpay (PAN, bank account, business proof).
2. Switch the dashboard from Test Mode to Live Mode.
3. **Account & Settings → API Keys** → generate **Live** keys.
4. Replace `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Vercel
   → Project → Settings → Environment Variables with the live values.
5. Redeploy.

---

## Troubleshooting

- **"Invalid signature" on checkout** — `RAZORPAY_KEY_SECRET` doesn't match
  the `key_id` you used. They must come from the same Razorpay account/mode.
- **Image upload fails with "permission denied"** — the storage bucket
  policy didn't apply. Run the storage policy block from `supabase/seed.sql`
  again. Check that the bucket name is exactly `product-images`.
- **`/admin` shows 404 even after promoting** — log out and back in to
  refresh the session cookie, then refresh the page.
- **Email confirmation never arrives** — check Supabase → Authentication →
  Logs. For local dev, just turn email confirmation off (step 3e).
- **Cart shows 0 even with items** — clear localStorage; the persist key is
  `sattva-cart-v1`.

---

## What lives where

- Storefront pages: `app/` (everything except `app/admin/` and
  `app/api/admin/`)
- Admin pages: `app/admin/`
- Server-side payment + admin write logic: `app/api/`
- Reusable code: `lib/`
- UI components: `components/site/` (public) and `components/admin/`
- Database schema (single source of truth): `supabase/seed.sql`

The CLAUDE.md file has more detail about how the code is laid out and the
"Things NOT to do" list — read it next.
