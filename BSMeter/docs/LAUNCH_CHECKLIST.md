## 🚀 Launch Checklist — BS Meter

Use this checklist to prepare your environment and launch the extension + website.

---

## 1. Environment variables (`.env` and `.env.local`)

**Website (`web/.env.local`):**

```env
# Supabase (Free Tier)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe
STRIPE_SECRET_KEY=sk_test_...   # or sk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_... # from Stripe CLI or Dashboard → Webhooks
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # or pk_live_...
STRIPE_LIFETIME_PRICE_ID=price_...   # One-time $15 AUD product
STRIPE_AUTOSCAN_PRICE_ID=price_...   # Monthly $20 AUD subscription (Alibaba + auto-scan)
```

**Extension:** No `.env`; the extension uses `chrome.storage.local` for `isPro` and `hasAutoscan` (synced when visiting the dashboard while logged in).

---

## 2. Supabase setup

**2.1 Create project:** [supabase.com](https://supabase.com) → New Project.

**2.2 Run the schema SQL:** Copy the entire contents of `supabase/schema.sql` into Supabase SQL Editor and run it. This creates `users` with support for Lifetime and Autoscan plans, RLS, and triggers.

**2.3 Auth:** In Supabase Dashboard → Authentication → Providers, enable **Email** (and optionally disable others). Copy **Project URL** and **anon** + **service_role** keys into `.env.local`.

---

## 3. Stripe setup

1. **Stripe account:** [dashboard.stripe.com](https://dashboard.stripe.com).
2. **Products:**
   - **Lifetime:** Add product → "BS Meter Lifetime" → $15 AUD, One-time → copy Price ID → `STRIPE_LIFETIME_PRICE_ID`
   - **Autoscan:** Add product → "BS Meter Autoscan" → $20 AUD, Recurring (monthly) → copy Price ID → `STRIPE_AUTOSCAN_PRICE_ID`
3. **Webhook (local):** Install [Stripe CLI](https://stripe.com/docs/stripe-cli), then:
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/webhook
   ```
   Copy the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`.
4. **Webhook (production):** Stripe → Developers → Webhooks → Add endpoint `https://YOUR_VERCEL_URL/api/webhook`. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Copy signing secret to `STRIPE_WEBHOOK_SECRET` in Vercel.

---

## 4. Commands to run

**Website:**

```bash
cd web
npm install
```

Before running `npm run build`, create `web/.env.local` with at least placeholder values (see Section 1). Build will fail if Supabase/Stripe env vars are missing.

```bash
npm run build
npm run dev
```

**Extension:** No install step (vanilla JS). Load unpacked in Chrome (see below).

---

## 5. Load the extension in Chrome (testing)

1. Ensure the `extension/` folder contains: `manifest.json`, `content.js`, `content.css`, `content-sync.js`, `popup.html`, `popup.js`.
2. Open Chrome → `chrome://extensions/`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked**.
5. Select the **`extension`** folder (e.g. `c:\Users\Felix\OneDrive\Desktop\BSMeter\extension`).
6. Pin the extension; visit `amazon.com` or a Shopify store to test the floating button and popup.

---

## 6. Deployment (Vercel)

1. Push repo to GitHub (or connect Vercel to your repo).
2. Vercel → New Project → Import `web` (or root with root directory set to `web`).
3. Add all env vars from **Section 1**, including `STRIPE_AUTOSCAN_PRICE_ID`. Use the Stripe Dashboard webhook secret for production (not the CLI one).
4. Deploy. Set your production URL in Stripe webhook. If you use a custom domain, update `extension/manifest.json` (host_permissions + content_scripts matches), `extension/popup.js` (DASHBOARD_URL), and `extension/content.js` (CTA href) so Pro sync and links work.

---

## 7. Post-launch checks

- [ ] Landing page loads; "Add to Chrome" links to Chrome Web Store (or your download/install page).
- [ ] Sign up / Login with Supabase works.
- [ ] "Get Lifetime Access" ($15) starts Stripe Checkout; webhook sets `has_lifetime` and `is_pro`.
- [ ] "Autoscan" ($20/mo) starts Stripe Checkout; webhook sets `plan=autoscan`, `autoscan_expires_at`, `is_pro`.
- [ ] Extension: free users see 3 checks/day. After purchase, visit the **dashboard** with the extension installed — Pro status syncs automatically.
- [ ] Autoscan users: on Alibaba product pages, the Sus Score auto-scans without clicking.

---

*Generated for BS Meter. Update Supabase/Stripe IDs and URLs before first run.*
