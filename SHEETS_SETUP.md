# Google Sheets backend — Setup Guide

Run the Mehr Nutrition store with a **Google Sheet** as the database instead of
Supabase. The catalog is read from the sheet, and every paid order is appended
to an **Orders** tab. No SQL, no Postgres.

Set `DATA_BACKEND=sheets` to turn this on. (`DATA_BACKEND=supabase` keeps the
Postgres setup from `SETUP.md`.)

> **What Sheets mode does and doesn't do**
> - ✅ Catalog (categories + products) read live from the sheet
> - ✅ Cart + Razorpay checkout as a **guest** (name + phone + address inline)
> - ✅ Each paid order appended as a row to the **Orders** tab
> - ❌ No customer accounts / login, no saved addresses, no admin dashboard
>   (those need Supabase). Stock is **not** auto-decremented in the sheet.

---

## 1. Create the spreadsheet

1. Go to https://sheets.google.com and create a new spreadsheet. Name it
   e.g. **Mehr Nutrition Store**.
2. Create **three tabs** (rename the default tab and add two more):
   `Categories`, `Products`, `Orders`.
3. The **id** of the spreadsheet is the long string in its URL:
   `https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`
   You'll paste it into `GOOGLE_SHEETS_SPREADSHEET_ID`.

### Tab: `Categories`

Row 1 must be the header (exact names, any order):

| id | slug | name | description | image_url | sort_order |
|----|------|------|-------------|-----------|------------|
| weight | weight-management | Weight Management | Shakes and herbal support for weight | /products/2.webp | 0 |
| daily | daily-wellness | Daily Wellness | Multivitamins, fibre, digestive & immune | /products/6.webp | 1 |
| target | targeted-health | Targeted Health | Heart, brain, bones, eyes, sleep | /products/18.webp | 2 |
| sports | sports-energy | Sports & Energy | H24 hydration and recovery | /products/23.webp | 3 |
| skin | skin-care | Skin Care & Beauty | Collagen and a daily facial routine | /products/25.webp | 4 |

### Tab: `Products`

Row 1 header (exact names, any order):

| id | category_slug | slug | name | description | price_inr | weight_grams | stock | image_url | gallery_image_urls | is_active |
|----|---------------|------|------|-------------|-----------|--------------|-------|-----------|--------------------|-----------|
| p1 | weight-management | formula-1-nutritional-shake | Formula 1 Nutritional Shake Mix | The healthy meal in a glass… | 2300 | 500 | 100 | /products/2.webp | /product-info/formula-1.jpeg | TRUE |
| p2 | weight-management | personalized-protein-powder | Personalized Protein Powder | A soy & whey protein blend… | 2000 | 200 | 100 | /products/3.webp | /product-info/protein.jpeg | TRUE |

Column notes:
- **id** — any unique value (used as the cart/line-item id). If blank, the
  `slug` is used.
- **category_slug** — must match a `slug` in the Categories tab.
- **price_inr** — price in **rupees** (e.g. `2300`), not paise.
- **weight_grams** — optional; leave blank if not applicable.
- **stock** — optional; defaults to 100. (Not decremented automatically.)
- **image_url** — the product photo. You can keep the bundled ones
  (`/products/1.webp` … `/products/33.webp`) or paste any public image URL.
- **gallery_image_urls** — optional extra images, separated by `|` or `,`
  (the bundled benefit cards live at `/product-info/<name>.jpeg`).
- **is_active** — `TRUE`/`FALSE` (blank = active). Set `FALSE` to hide a product.

> **Shortcut to fill the catalog:** the 5 categories and all 33 products (with
> prices, descriptions, image paths) already exist in
> [`lib/seed-data.ts`](lib/seed-data.ts). Copy those names/slugs/prices into the
> sheet rather than retyping. `image_url` values map to `/products/N.webp` and
> the gallery cards to `/product-info/*.jpeg`, which ship in this repo's
> `public/` folder.

### Tab: `Orders`

Add a header row once (the app only ever appends below it):

| ref | created_at | status | customer_name | email | phone | address | items | subtotal_inr | shipping_inr | total_inr | razorpay_order_id | razorpay_payment_id |
|-----|-----------|--------|---------------|-------|-------|---------|-------|--------------|--------------|-----------|-------------------|---------------------|

---

## 2. Create a Google service account

The app authenticates to Sheets as a **service account** (a robot Google user).

1. Go to https://console.cloud.google.com and create (or pick) a project.
2. **APIs & Services → Library** → search **Google Sheets API** → **Enable**.
3. **APIs & Services → Credentials → Create credentials → Service account**.
   - Name it e.g. `mehr-sheets-bot`, click **Create and continue**, then
     **Done** (no roles needed).
4. Open the new service account → **Keys** tab → **Add key → Create new key →
   JSON**. A `.json` file downloads. Keep it safe — it's a secret.
5. Open the JSON. You need two fields from it:
   - `client_email`  → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key`   → `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`

---

## 3. Share the sheet with the service account

Back in your spreadsheet: **Share** → paste the service account's
`client_email` (it looks like `mehr-sheets-bot@your-project.iam.gserviceaccount.com`)
→ give it **Editor** access → **Send**. Without this, the app can't read or
write the sheet.

---

## 4. Set environment variables

In `.env.local` (local) and in Vercel → Project → Settings → Environment
Variables (production):

```dotenv
DATA_BACKEND=sheets

GOOGLE_SHEETS_SPREADSHEET_ID=1AbC...the-id-from-the-url
GOOGLE_SERVICE_ACCOUNT_EMAIL=mehr-sheets-bot@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...lots...of...characters...\n-----END PRIVATE KEY-----\n"

# Razorpay (still needed to take payments)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your-razorpay-secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**About the private key:** copy the `private_key` value from the JSON exactly.
It contains `\n` sequences — keep them as the literal two characters
`\` + `n` and wrap the whole thing in double quotes (as above). The app turns
them back into real newlines.

- On **Vercel**, paste the key value with real line breaks OR with `\n` — both
  work; the code handles `\n`. Easiest: paste the single-line `\n` version from
  your `.env.local`.

---

## 5. Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000:
- The catalog should now reflect your **Products** tab. Edit a price or name in
  the sheet, refresh after ~a minute (pages revalidate), and it updates.
- Add to cart → **Checkout** shows the guest form (name, phone, address).
- Pay with the Razorpay test card `4111 1111 1111 1111` (any future expiry /
  CVV / OTP). On success you land on the confirmation page and a new row
  appears in the **Orders** tab.

If the catalog still shows the built-in demo products, the app couldn't reach
the sheet — re-check the three env vars and that the sheet is **shared** with
the service-account email. Check the dev-server logs for a `Sheets ... failed`
message.

---

## 6. Switching back to Supabase

Set `DATA_BACKEND=supabase` (or remove it) and follow `SETUP.md`. No code
changes — the same build serves either backend based on this one variable.
