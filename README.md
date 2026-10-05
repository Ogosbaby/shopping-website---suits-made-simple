# Suits Made Simple (SMS)

A minimalist, premium e-commerce storefront for distinguished men aged 40+ and pastors —
premium corporate and premium casual suits, standard off-the-rack sizing or made to measure.

Built for the HNG15 Lesson 2 task.

## Stack

| Concern        | Technology                                        |
| -------------- | ------------------------------------------------- |
| Framework      | Next.js 14 (App Router, TypeScript)               |
| Styling        | Tailwind CSS (brand palette sampled from the logo)|
| Database       | Supabase Postgres                                 |
| Auth           | Google OAuth via Google Cloud Console + Supabase  |
| Payments       | Paystack (hosted checkout — card, transfer, USSD) |
| Transactional  | Mailgun REST API (HTML + text confirmation email) |

## Pages

- `/` — Home: a rotating model slideshow beneath the house wordmark, the trust strip, featured
  pieces, How It Works, Shop by Occasion, Shop by Colour, and the About Us section (The SMS Standard).
- `/shop` — The Collection: Corporate and Premium Casual suits, filterable by category, occasion, and colour.
- `/fit-guide` — Standard size chart, made-to-measure guidance for the six measurements, and the fit guarantee.
- `/products/[slug]` — Product detail with a four-frame gallery and a sizing selector:
  - **Option A — Standard off-the-rack**: dropdown of sizes (38R–50L), stored as `product_variants`.
  - **Option B — Custom tailoring**: six-field measurement form (Neck, Chest, Waist, Jacket Length, Sleeve Length, Trouser Length), stored as JSON on the cart/order item.
- `/cart` — Traditional cart that accumulates items before checkout (persisted in the `cart_items` table).
- `/checkout` — Structured shipping/contact form; prices are recalculated server-side, then the
  buyer is handed to Paystack.
- `/checkout/success?order=…` — Order confirmation, reading the persisted order.
- `/checkout/failed` — Shown when a Paystack payment could not be verified. The cart is kept.
- `/api/paystack/callback` — Buyer redirect after payment; verifies the transaction server-to-server.
- `/api/paystack/webhook` — Paystack's authoritative settlement notification (signature checked).
- `/login` — Email + password sign-in and registration, plus Google (web).
- `/account` — The signed-in customer's orders.

## Quick start

```bash
npm install
npm run dev
```

`.env.local` is committed-ready but **empty on purpose**. While it stays empty the storefront
serves the local fallback catalog (`lib/catalog.ts`) and renders the full collection with its
imagery; cart, checkout and email stay switched off. Fill in the values below to switch each
service on, then restart `npm run dev`.

### Setup order

| # | Service          | Needed for                                  | Time   |
| - | ---------------- | ------------------------------------------- | ------ |
| 1 | Supabase         | Catalog in the database, cart, orders       | ~5 min |
| 2 | Google OAuth     | The "Continue with Google" sign-in button   | ~5 min |
| 3 | Mailgun          | Order confirmation email after checkout      | ~10 min |

Steps 2 and 3 are optional for the storefront to run; step 1 is required for cart and checkout.

> `SETUP.md` is the full walkthrough for all four providers, with a checklist and a
> troubleshooting table. The summaries below are the short version.

## 1. Database — Supabase

1. Create a project at [supabase.com](https://supabase.com) → **New project**. Choose a region
   close to your customers (e.g. `eu-west-2` or `us-east-1`) and save the database password.
2. In **SQL Editor**, run `supabase/schema.sql` — creates `products`, `product_variants`,
   `cart_items`, `orders`, `order_items`, plus indexes and RLS policies. Paste the whole file and
   press **Run**; it is safe to run more than once.
3. Then run `supabase/seed.sql` — seeds the eight suits, their standard sizes, colours and
   galleries. Also safe to re-run.
4. Copy your keys (Project Settings → API):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only; used for cart/order writes)

## 2. Google Auth — Google Cloud Console

Do this **after** step 1, because Google needs the Supabase callback URL that step 1 creates.

1. Go to [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth client ID → Web application**.
3. Under **Authorized redirect URIs**, add:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
   (For local dev, the same Supabase callback URI is used — never `localhost`.)
4. Copy the **Client ID** and **Client Secret**.
5. In Supabase → **Authentication → Providers → Google**, enable the provider and paste the
   Client ID and Client Secret. Save.
6. In Supabase → **Authentication → URL Configuration**, set the Site URL (e.g. `http://localhost:3000`).

## 3. Payments — Paystack

1. Create an account at [paystack.com](https://paystack.com) and complete the business profile.
2. **Settings → API Keys & Webhooks** → copy the **Secret Key** (`sk_test_…` to start) into
   `PAYSTACK_SECRET_KEY`.
3. On the same page set the **Webhook URL** to `https://your-domain.com/api/paystack/webhook`.
   Locally, tunnel your port first (`npx localtunnel --port 3000`) and use that URL.
4. Test with card `4084 0840 8408 4081`, CVV `408`, PIN `0000`, OTP `123456`.

Checkout opens the order as `pending_payment` and returns a Paystack authorization URL. The order
becomes `paid` only after `/api/paystack/callback` or `/api/paystack/webhook` verifies the
transaction with Paystack — the redirect query string is never trusted. Without a secret key the
store falls back to demo mode: the order is confirmed immediately with no payment step.

## 4. Email — Mailgun

1. Create a Mailgun account and add a sending domain (e.g. `mg.yourdomain.com`) under
   **Sending → Domains → Add domain**.
2. Add the DNS records Mailgun shows you (SPF, DKIM, and the tracking CNAME), then click
   **Verify**. The domain must read *Verified* before mail will send.
3. Copy your **private API key** (Sending → Domains → your domain → API keys) and set the
   environment variables:

```env
MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_FROM="Suits Made Simple <postmaster@mg.yourdomain.com>"
MAILGUN_BASE_URL=https://api.mailgun.net   # https://api.eu.mailgun.net for EU regions
```

A branded HTML + plain-text confirmation is sent immediately after a successful checkout.
If Mailgun keys are absent the checkout still succeeds and the buyer is told the receipt
will follow by concierge email.

## 5. Finish `.env.local`

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxx
MAILGUN_API_KEY=key-xxxxxxxx
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_FROM="Suits Made Simple <postmaster@mg.yourdomain.com>"
MAILGUN_BASE_URL=https://api.mailgun.net
```

## Mobile app (Android)

The storefront also ships as an Android app. It runs the live site in a native WebView, so the
web and mobile clients share one database, one account and one cart — adding a piece on the web
shows up in the app, and vice versa. The SMS tuxedo mark is the launcher icon and the splash
screen.

See **[MOBILE.md](./MOBILE.md)** for the architecture, the one-time deploy prerequisite, and how
to rebuild the APK.

## Scripts

```bash
npm run dev              # develop at http://localhost:3000
npm run build            # production build
npm run start            # serve the production build
npm run typecheck        # tsc --noEmit
npm run generate:images  # regenerate the catalog imagery (no API key required)
npm run audit:layout     # responsive layout audit in headless Chrome
npm run review:sheet     # build the imagery contact sheet for review
node scripts/generate-app-assets.mjs   # regenerate the Android icon + splash sources (mobile/resources)
```

## Catalog imagery

The catalog photography is AI-generated — editorial portraits of distinguished Black Nigerian
men in their forties and older, styled to each SMS silhouette. The images live in
`public/products/*.jpg` (four frames per suit — portrait, alternate, lifestyle, fabric detail) and
the five hero slides in `public/hero/hero-1.jpg` … `hero-5.jpg`.

To regenerate them (for example after editing a prompt), run:

```bash
npm run generate:images                            # everything that is missing
node scripts/generate-images.mjs --only hero        # one target by name
node scripts/generate-images.mjs --reprocess        # re-run the crop/upscale pipeline only
node scripts/generate-images.mjs --force            # re-download and rebuild everything
```

Raw downloads are cached in `.cache/raw/`, so `--reprocess` is free and instant once an image
has been fetched. The endpoint caps output at roughly 0.59 MP, so clarity is recovered locally by
cropping the edges and upscaling with Lanczos.

The script uses the free, keyless Pollinations image endpoint and writes to `public/`.
Set `POLLINATIONS_MODEL` to override the default `flux` model.

## Data model

```
products ─┬─ images text[]               (gallery: cover, alternate, lifestyle, fabric detail)
          │  colour / occasions[]        (browsing facets)
          ├─< product_variants          (standard sizes, stock)
          ├─< cart_items >─ cart_id cookie (guests keep their cart across visits)
          └─< order_items >─ orders     (custom measurements stored as JSONB)
```

## Notes

- Money is stored as an integer in **kobo** (the minor unit of the naira) in every `*_cents`
  column, and formatted for display by `formatMoney` in `lib/format.ts` using `en-NG` / `NGN`.
  Prices are shown as `₦289,000`, without minor units.
- Cart is keyed by a signed `sms_cart_id` HTTP-only cookie for guests, and by `user_id` once a
  shopper signs in — so the same account sees the same cart on every device (web, Android app).
  Guest lines created on a device are adopted into the account on sign-in.
- Totals are recomputed from `products.price_cents` on the server at checkout; the client
  never dictates prices. Paystack is charged the same server-computed total, and a payment that
  does not cover the order is never settled.
- `orders` records the payment trail: `status` (`pending_payment` → `paid`), `payment_reference`,
  `paid_at` and the `cart_id` that is emptied only once payment clears.
- Row Level Security: catalog reads are public, cart rows are service-managed, and signed-in
  customers can only read their own orders.
- A read-only local catalog (`lib/catalog.ts`, mirroring `supabase/seed.sql`) backs the storefront
  when Supabase is not configured, so the collection and its imagery render without a database.
  Once Supabase is connected it becomes the single source of truth. Cart and checkout still
  require the database.
