# Suits Made Simple — setup guide

Everything the store needs from four providers, in the order you should do it.
Budgets: **Supabase ~5 min**, **Paystack ~5 min**, **Google ~5 min**, **Mailgun ~10 min**.

Copy `.env.example` to `.env.local`, fill each value in as you collect it, and restart the dev
server after each change. Every value is optional for *browsing* — the storefront falls back to the
bundled catalog — but each one unlocks something specific:

| Variable | Unlocks |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Catalog, cart and orders come from the database |
| `SUPABASE_SERVICE_ROLE_KEY` | Cart writes, order creation, order lookup |
| `PAYSTACK_SECRET_KEY` | Card / bank transfer / USSD payment at checkout |
| `MAILGUN_API_KEY` + `MAILGUN_DOMAIN` | Order confirmation email |
| Google OAuth client (Supabase-side) | "Continue with Google" sign-in |
| `NEXT_PUBLIC_SITE_URL` | Paystack callback, email links, OAuth redirect |

---

## 1. Supabase — the database

**You need:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`

1. Go to <https://supabase.com> → sign in → **New project**.
2. Name it `suits-made-simple`. Choose the region closest to your customers (`eu-west-2` or
   `us-east-1` are both fine from Nigeria). Set a database password and **save it somewhere** —
   you will not see it again.
3. Wait ~2 minutes for provisioning.
4. Left sidebar → **SQL Editor** → **New query**. Open `supabase/schema.sql` from this repo, paste
   the entire file, click **Run**. Expect "Success. No rows returned".
5. New query again → paste all of `supabase/seed.sql` → **Run**. This inserts the eight suits, their
   sizes, colours and galleries.
6. Verify: **Table Editor** → `products` should show 8 rows, `product_variants` 56 rows.
7. Left sidebar → **Project Settings** (gear) → **API**. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys → `anon` `public`** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Project API keys → `service_role`** → `SUPABASE_SERVICE_ROLE_KEY`

   The `service_role` key bypasses all security rules. It is server-only — never paste it into a
   `NEXT_PUBLIC_*` variable and never commit it.

**Both SQL files are safe to re-run.** `schema.sql` uses `create table if not exists` and
`alter table ... add column if not exists`, so re-running it after a git pull upgrades an existing
database in place.

---

## 2. Paystack — payment

**You need:** `PAYSTACK_SECRET_KEY` (and optionally `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`)

1. Go to <https://paystack.com> → create an account → complete your business profile
   (Paystack requires business details before it will issue live keys).
2. **Settings → API Keys & Webhooks**. You get two pairs:
   - **Test keys** — use these first. Test cards never move real money.
   - **Live keys** — switch once you have done a test payment.
3. Copy **Secret Key** (`sk_test_…` / `sk_live_…`) → `PAYSTACK_SECRET_KEY`.
4. On the same page, find **Webhook URL** and set it to:
   ```
   https://your-domain.com/api/paystack/webhook
   ```
   For local development, expose your machine with a tunnel and use that URL instead:
   ```bash
   npx localtunnel --port 3000            # or: ngrok http 3000
   ```
   The webhook is what guarantees a paid order is recorded even when the buyer closes the tab
   before being redirected back. Signature verification is already implemented, so the endpoint
   rejects anything not signed with your secret key.
5. Test cards live at <https://paystack.com/docs/payments/test-payments/>. The one you want for the
   success path:
   - Card `4084 0840 8408 4081`, CVV `408`, expiry any future date, PIN `0000`, OTP `123456`.

**How payment flows in this app:** checkout creates the order as `pending_payment` and returns a
Paystack authorization URL → the buyer pays on Paystack's page → Paystack calls
`/api/paystack/callback` (buyer redirect) **and** `/api/paystack/webhook` (server-to-server). Both
verify the transaction with Paystack before the order moves to `paid`, the receipt is emailed, and
the cart is emptied. Neither the callback query string nor the browser is ever trusted.

**Without `PAYSTACK_SECRET_KEY`** the store still works in demo mode: the order is confirmed
immediately and the receipt is emailed, with no payment step.

---

## 3. Google — sign-in

**You need:** nothing in `.env.local`. The Client ID and Secret are pasted into Supabase.

Do this **after** step 1 — the redirect URI contains your Supabase project reference.

1. Go to <https://console.cloud.google.com> → create a project (e.g. `suits-made-simple`).
2. **APIs & Services → OAuth consent screen**:
   - User type **External** → **Create**.
   - App name `Suits Made Simple`, your support email, developer contact email → Save.
   - **Scopes**: leave the defaults (`email`, `profile`, `openid`) → Save.
   - **Test users**: while the app is in *Testing*, only listed accounts can sign in. Add your own
     Gmail address (and any client's) → Save.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**.
   - Name: `SMS Web`.
   - **Authorized JavaScript origins**: `http://localhost:3000` and
     `https://your-domain.com`.
   - **Authorized redirect URIs** — this is the one people get wrong. It is your **Supabase**
     callback, not your app:
     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```
     Find `<your-project-ref>` in the Supabase Project URL.
   - **Create**, then copy the **Client ID** and **Client secret**.
4. Back in Supabase: **Authentication → Providers → Google** → toggle **Enable** → paste the Client
   ID and Client Secret → **Save**.
5. Supabase → **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: add `http://localhost:3000/**` and `https://your-domain.com/**`.
6. Publish the consent screen (**OAuth consent screen → Publish app**) before real customers use it,
   otherwise only test users can sign in.

---

## 4. Mailgun — the confirmation email

**You need:** `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM`

1. Go to <https://mailgun.com> → create an account. The free tier is limited but enough to test.
2. **Sending → Domains → Add domain**. Use a subdomain you own, e.g. `mg.suitsmadesimple.com`.
3. Mailgun shows you DNS records — add all of them at your registrar/DNS host:
   - `TXT` SPF record
   - `TXT`/`CNAME` DKIM record
   - `CNAME` tracking record (optional but recommended)
   Then click **Verify DNS settings** until the domain reads **Verified**. Mail will not send from
   an unverified domain.
4. **Sending → Domains → your domain → API keys** → copy the **Private API key** (starts `key-`)
   → `MAILGUN_API_KEY`.
5. Set the remaining values:
   ```env
   MAILGUN_DOMAIN=mg.suitsmadesimple.com
   MAILGUN_FROM="Suits Made Simple <postmaster@mg.suitsmadesimple.com>"
   MAILGUN_BASE_URL=https://api.mailgun.net      # https://api.eu.mailgun.net if your domain is in the EU region
   ```
6. **Sandbox domains only deliver to authorised recipients.** If you are testing on a sandbox, go to
   **Sending → Domains → your sandbox → Authorized recipients** and add your own address, otherwise
   the email silently disappears.

**Without Mailgun keys** checkout still completes; the buyer is told the receipt will follow from
the concierge.

---

## 5. Put it together

```bash
# .env.local — every value from the four steps above
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxx
MAILGUN_API_KEY=key-xxxxxxxx
MAILGUN_DOMAIN=mg.suitsmadesimple.com
MAILGUN_FROM="Suits Made Simple <postmaster@mg.suitsmadesimple.com>"
MAILGUN_BASE_URL=https://api.mailgun.net
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Restart the server (`npm run dev`) — Next.js only reads env files at boot.

### End-to-end checklist

- [ ] `/shop` shows all 8 suits and the **Table Editor → products** shows 8 rows
- [ ] Adding to cart works and the header count increments (needs the service-role key)
- [ ] `/checkout` → **Continue to payment** lands on the Paystack page
- [ ] Paying with the test card returns you to `/checkout/success` showing **Payment received**
- [ ] The order row in Supabase reads `status = paid` with a `paid_at` timestamp
- [ ] The confirmation email arrives (check the Mailgun **Logs** page if it does not)
- [ ] **Paystack → Webhooks → Recent deliveries** shows a `200` for `charge.success`
- [ ] `/login` → **Continue with Google** completes and lands on `/account`

### Common problems

| Symptom | Cause |
| --- | --- |
| Cart says "not connected to its database" | Supabase URL/anon key missing, or server not restarted |
| `redirect_uri_mismatch` from Google | Redirect URI is not exactly `https://<ref>.supabase.co/auth/v1/callback` |
| Paystack says `Invalid key` | Live key used with a test transaction, or a stray space when pasting |
| Webhook shows `401` | `PAYSTACK_SECRET_KEY` changed since the delivery, or a different key was used to sign |
| No email, checkout still succeeded | Domain not verified, or recipient not in Authorized recipients |
| Prices look wrong | Money is stored in kobo — `₦289,000` is stored as `28900000` |
