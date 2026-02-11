## BS Meter — Deployment Guide

Steps to deploy the web app to Vercel and publish the Chrome extension.

---

## 1. Supabase Setup

### 1.1 Create Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Wait for the project to be ready
3. Copy **Project URL** and **anon** + **service_role** keys from Settings → API

### 1.2 Run Schema SQL
1. In Supabase Dashboard → **SQL Editor** → **New query**
2. Copy the contents of `supabase/schema.sql` and paste into the editor
3. Click **Run**
4. Ensure no errors

### 1.3 Enable Auth
- Authentication → Providers → Enable **Email** (disable others if desired)

---

## 2. Stripe Setup

### 2.1 Products & Prices
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) → Products
2. **Lifetime ($15 AUD one-time):**
   - Add product → Name: "BS Meter Lifetime"
   - Price: $15 AUD, One-time
   - Copy the **Price ID** (`price_...`) → `STRIPE_LIFETIME_PRICE_ID`
3. **Autoscan ($20 AUD/month):**
   - Add product → Name: "BS Meter Autoscan"
   - Price: $20 AUD, Recurring (monthly)
   - Copy the **Price ID** (`price_...`) → `STRIPE_AUTOSCAN_PRICE_ID`

### 2.2 Webhook
1. Stripe → Developers → Webhooks → Add endpoint
2. Endpoint URL: `https://YOUR_VERCEL_APP.vercel.app/api/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the **Signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`

---

## 3. Deploy to Vercel

### 3.1 Connect Repository
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your repo
4. Set **Root Directory** to `web` (if the app is in the `web` folder)

### 3.2 Environment Variables
Add these in Vercel → Project → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key |
| `STRIPE_SECRET_KEY` | `sk_live_...` (production) or `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret from Stripe |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` or `pk_test_...` |
| `STRIPE_LIFETIME_PRICE_ID` | Lifetime product price ID |
| `STRIPE_AUTOSCAN_PRICE_ID` | Autoscan subscription price ID |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |

### 3.3 Deploy
1. Click **Deploy**
2. After deploy, copy your production URL (e.g. `https://bsmeter.vercel.app`)

### 3.4 Update Stripe Webhook
- Use your actual Vercel URL in the Stripe webhook endpoint

---

## 4. Chrome Extension — Local Testing

### 4.1 Update Extension URLs (if using custom domain)
If your app is **not** at `bsmeter.vercel.app`, update:

- `extension/manifest.json` → `content_scripts` second entry: add your domain to `matches`
- `extension/manifest.json` → `host_permissions`: add your domain
- `extension/popup.js` → `DASHBOARD_URL`
- `extension/content.js` → CTA link href

### 4.2 Load Unpacked
1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `extension` folder

---

## 5. Chrome Extension — Publish to Chrome Web Store

### 5.1 Prepare
1. Create a [Chrome Web Store Developer account](https://chrome.google.com/webstore/devconsole) ($5 one-time)
2. Zip the `extension` folder (exclude `.git`, `node_modules`, etc.):
   - Required: `manifest.json`, `content.js`, `content.css`, `content-sync.js`, `popup.html`, `popup.js`, `icons/`

### 5.2 Create Item
1. Chrome Web Store Developer Dashboard → New Item
2. Upload the zip
3. Fill in:
   - **Description:** "Detect fake reviews and dropshipping scams on Amazon, Shopify, and Alibaba."
   - **Category:** Shopping or Productivity
   - **Screenshots:** At least 1 (1280x800 or 640x400)
   - **Promotional images:** 440x280 (small), 920x680 (marquee) — optional
   - **Privacy policy:** URL to your privacy policy

### 5.3 Host Permissions
- The manifest requests `*://*.amazon.com/*`, `*://*.shopify.com/*`, `*://*.alibaba.com/*`, etc.
- Chrome will show these in the store listing; users must approve on install

### 5.4 Submit for Review
1. Set visibility (Public / Unlisted)
2. Submit for review (usually 1–3 business days)

---

## 6. Post-Deploy Checklist

- [ ] Supabase schema applied, no SQL errors
- [ ] Stripe products created (Lifetime + Autoscan)
- [ ] Stripe webhook configured with all 3 events
- [ ] Vercel env vars set, build succeeds
- [ ] Login/signup works via Supabase Auth
- [ ] Lifetime checkout completes and webhook sets `has_lifetime`
- [ ] Autoscan checkout completes and webhook sets `plan=autoscan`
- [ ] Extension syncs Pro status when visiting dashboard
- [ ] Autoscan users get auto-scan on Alibaba product pages

---

## 7. Local Development

```bash
cd web
cp .env.example .env.local   # fill in real values
npm install
npm run dev
```

For Stripe webhooks locally:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhook
```

Use the printed `whsec_...` as `STRIPE_WEBHOOK_SECRET` in `.env.local`.
