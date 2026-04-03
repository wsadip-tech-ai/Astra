# Sub-project 4B: Stripe Payments — Design Spec

## Overview

Integrate Stripe subscriptions so users can upgrade to Premium ($9.99/month or $79/year). Stripe Checkout handles payment UI. Webhooks update `profiles.subscription_tier` and track subscriptions. Customer Portal lets users manage/cancel. All Stripe keys are env vars — code works once keys are filled in.

---

## Owner Setup Required

Before this code works, the project owner must:

1. **Create a Stripe account** at stripe.com
2. **Create two products** in the Stripe Dashboard:
   - "Astra Premium Monthly" — $9.99/month recurring price
   - "Astra Premium Yearly" — $79/year recurring price
3. **Add env vars to `.env.local`:**
   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_MONTHLY_PRICE_ID=price_...
   STRIPE_YEARLY_PRICE_ID=price_...
   ```
4. **Set up webhook** in Stripe Dashboard → Developers → Webhooks:
   - Endpoint URL: `https://your-domain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.updated`
   - For local development: use `stripe listen --forward-to localhost:3000/api/stripe/webhook` (Stripe CLI)

---

## Migration: `006_subscriptions.sql`

```sql
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE NOT NULL,
  plan text NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due')),
  current_period_end timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);
```

Write access is service_role only (webhook writes via `SUPABASE_SERVICE_ROLE_KEY`). Users can only read their own subscription.

---

## Stripe Client (`lib/stripe.ts`)

Thin wrapper around the Stripe SDK:

- `getStripeClient()` — singleton Stripe instance from `STRIPE_SECRET_KEY`
- `createOrGetCustomer(userId, email, name, supabase)` — check `profiles.stripe_customer_id`, create Stripe customer if null, save ID back to profile
- `createCheckoutSession(customerId, priceId, userId)` — create Checkout Session with `mode: 'subscription'`, `success_url`, `cancel_url`, `metadata: { user_id }`
- `createPortalSession(customerId)` — create Customer Portal session

---

## API Routes

### `POST /api/stripe/checkout` (authenticated)

**Request:** `{ plan: 'monthly' | 'yearly' }`

**Flow:**
1. Auth check
2. Map plan to price ID: `monthly` → `STRIPE_MONTHLY_PRICE_ID`, `yearly` → `STRIPE_YEARLY_PRICE_ID`
3. Fetch user profile (email from auth, name from profile)
4. Create or get Stripe customer
5. Create Checkout Session with `success_url: /dashboard?upgraded=true` and `cancel_url: /pricing`
6. Return `{ url: session.url }`

Client redirects to the returned URL. Stripe handles payment.

### `POST /api/stripe/webhook` (no auth — Stripe signature only)

**No Supabase auth** — this is called by Stripe's servers. Verification via `stripe.webhooks.constructEvent()` using `STRIPE_WEBHOOK_SECRET`.

**Must use `SUPABASE_SERVICE_ROLE_KEY`** to write to DB (bypasses RLS).

**Events handled:**

**`checkout.session.completed`:**
1. Extract `customer`, `subscription`, `metadata.user_id` from event
2. Fetch subscription details from Stripe to get `current_period_end` and plan interval
3. Update `profiles`: set `subscription_tier = 'premium'`, `stripe_customer_id = customer`
4. Insert or update `subscriptions` row

**`customer.subscription.deleted`:**
1. Find subscription in `subscriptions` table by `stripe_subscription_id`
2. Update `subscriptions.status = 'cancelled'`
3. Update `profiles.subscription_tier = 'free'`

**`customer.subscription.updated`:**
1. Find subscription by `stripe_subscription_id`
2. Update `status` (active/past_due) and `current_period_end`
3. If `status === 'past_due'`: keep premium for now (Stripe retries payment)

**Error handling:** Invalid signature → 400. Unhandled event type → 200 (acknowledge, ignore). DB write failure → 500 (Stripe will retry).

### `POST /api/stripe/portal` (authenticated)

**Flow:**
1. Auth check
2. Fetch `profiles.stripe_customer_id` — if null, return 400 (no subscription)
3. Create Stripe Customer Portal session with `return_url: /dashboard`
4. Return `{ url: session.url }`

---

## Updated Pricing Page

Modify the existing `PricingSection` component to make buttons functional.

**Current state:** Static "Get Started" buttons that do nothing.

**New behavior:**
- Monthly "Get Started" → `POST /api/stripe/checkout` with `{plan: 'monthly'}` → redirect to `session.url`
- Yearly "Get Started" → same with `{plan: 'yearly'}`
- If user is already premium → show "Manage Subscription" button → `POST /api/stripe/portal` → redirect

The `PricingSection` needs to become a client component that receives `isPremium` and `isLoggedIn` props from the page. If not logged in, buttons link to `/signup` instead of triggering checkout.

---

## New Dependency

```bash
npm install stripe
```

---

## File Structure

| File | Change |
|------|--------|
| `supabase/migrations/006_subscriptions.sql` | New — subscriptions table + RLS |
| `lib/stripe.ts` | New — Stripe client, customer management, session creation |
| `app/api/stripe/checkout/route.ts` | New — create Checkout Session |
| `app/api/stripe/webhook/route.ts` | New — handle Stripe events |
| `app/api/stripe/portal/route.ts` | New — create Customer Portal session |
| `components/home/PricingSection.tsx` | Modify — functional checkout buttons |
| `app/pricing/page.tsx` | Modify — pass auth/premium state to PricingSection |
| `__tests__/lib/stripe.test.ts` | New — Stripe client tests |

---

## Environment Variables Summary

```
# Stripe (owner must fill in)
STRIPE_SECRET_KEY=sk_test_REPLACE_ME
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_REPLACE_ME
STRIPE_WEBHOOK_SECRET=whsec_REPLACE_ME
STRIPE_MONTHLY_PRICE_ID=price_REPLACE_ME
STRIPE_YEARLY_PRICE_ID=price_REPLACE_ME

# Supabase (needed for webhook — bypasses RLS)
SUPABASE_SERVICE_ROLE_KEY=eyJ...REPLACE_ME
```

---

## Testing

- `lib/stripe.ts` — test `createCheckoutSession` passes correct params (price ID, metadata, URLs)
- `POST /api/stripe/checkout` — test auth check, test correct price ID for monthly vs yearly
- `POST /api/stripe/webhook` — test invalid signature returns 400, test `checkout.session.completed` event structure parsing

Note: Full webhook integration testing requires Stripe CLI (`stripe listen`). Unit tests mock the Stripe SDK.

---

## What This Does NOT Include

- Payment failure recovery UI (Stripe handles retry emails natively)
- Proration for plan changes (handled by Stripe automatically)
- Invoice history page (users manage this via Customer Portal)
- Coupon/discount codes (can be added via Stripe Dashboard without code changes)
- Refund handling (done manually via Stripe Dashboard)
