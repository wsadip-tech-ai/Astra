# Sub-project 4B: Stripe Payments — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Stripe subscriptions with checkout, webhooks, and customer portal so users can upgrade to Premium.

**Architecture:** Stripe Checkout handles payment UI (no custom payment forms). Webhooks from Stripe update `profiles.subscription_tier` and the `subscriptions` table via service role key. Customer Portal lets users manage/cancel. Pricing page buttons trigger checkout or portal based on auth/premium state.

**Tech Stack:** Next.js 14 (App Router), TypeScript, stripe (Node SDK), Supabase (service role for webhooks), Vitest.

---

## File Map

| File | Responsibility |
|------|---------------|
| `supabase/migrations/006_subscriptions.sql` | subscriptions table + RLS |
| `lib/stripe.ts` | Stripe client singleton, customer management, session creation |
| `app/api/stripe/checkout/route.ts` | POST — create Checkout Session |
| `app/api/stripe/webhook/route.ts` | POST — handle Stripe events (no auth, signature only) |
| `app/api/stripe/portal/route.ts` | POST — create Customer Portal session |
| `components/home/PricingSection.tsx` | Modify — functional checkout buttons with auth/premium awareness |
| `app/pricing/page.tsx` | Modify — pass auth/premium state to PricingSection |
| `__tests__/lib/stripe.test.ts` | Stripe client tests |

---

## Task 1: Install Stripe + Migration

**Files:**
- Modify: `package.json` (via npm)
- Create: `supabase/migrations/006_subscriptions.sql`

- [ ] **Step 1: Install Stripe SDK**

```bash
npm install stripe
```

- [ ] **Step 2: Create subscriptions migration**

Create `supabase/migrations/006_subscriptions.sql`:

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

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json supabase/migrations/006_subscriptions.sql
git commit -m "feat: add Stripe SDK and subscriptions migration"
```

---

## Task 2: Stripe Client Library

**Files:**
- Create: `lib/stripe.ts`
- Create: `__tests__/lib/stripe.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/stripe.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('stripe', () => {
  const mockStripe = {
    customers: {
      create: vi.fn().mockResolvedValue({ id: 'cus_test123' }),
    },
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test' }),
      },
    },
    billingPortal: {
      sessions: {
        create: vi.fn().mockResolvedValue({ url: 'https://billing.stripe.com/test' }),
      },
    },
  }
  return { default: vi.fn(() => mockStripe) }
})

describe('stripe', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
    process.env.STRIPE_MONTHLY_PRICE_ID = 'price_monthly'
    process.env.STRIPE_YEARLY_PRICE_ID = 'price_yearly'
  })

  it('getPriceId returns correct price for monthly', async () => {
    const { getPriceId } = await import('@/lib/stripe')
    expect(getPriceId('monthly')).toBe('price_monthly')
  })

  it('getPriceId returns correct price for yearly', async () => {
    const { getPriceId } = await import('@/lib/stripe')
    expect(getPriceId('yearly')).toBe('price_yearly')
  })

  it('createCheckoutSession calls stripe with correct params', async () => {
    const { createCheckoutSession, getStripeClient } = await import('@/lib/stripe')
    const stripe = getStripeClient()
    const url = await createCheckoutSession('cus_123', 'price_monthly', 'user_456')

    expect(url).toBe('https://checkout.stripe.com/test')
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_123',
        mode: 'subscription',
        metadata: { user_id: 'user_456' },
      }),
    )
  })

  it('createPortalSession calls stripe with correct params', async () => {
    const { createPortalSession, getStripeClient } = await import('@/lib/stripe')
    const stripe = getStripeClient()
    const url = await createPortalSession('cus_123')

    expect(url).toBe('https://billing.stripe.com/test')
    expect(stripe.billingPortal.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_123',
      }),
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/lib/stripe.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Create the Stripe client**

Create `lib/stripe.ts`:

```ts
import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export function getStripeClient(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-03-31.basil',
    })
  }
  return stripeInstance
}

export function getPriceId(plan: 'monthly' | 'yearly'): string {
  if (plan === 'monthly') return process.env.STRIPE_MONTHLY_PRICE_ID || ''
  return process.env.STRIPE_YEARLY_PRICE_ID || ''
}

export async function createOrGetCustomer(
  userId: string,
  email: string,
  name: string | null,
  existingCustomerId: string | null,
): Promise<string> {
  if (existingCustomerId) return existingCustomerId

  const stripe = getStripeClient()
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: { user_id: userId },
  })
  return customer.id
}

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  userId: string,
): Promise<string | null> {
  const stripe = getStripeClient()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard?upgraded=true`,
    cancel_url: `${baseUrl}/pricing`,
    metadata: { user_id: userId },
  })

  return session.url
}

export async function createPortalSession(customerId: string): Promise<string | null> {
  const stripe = getStripeClient()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/dashboard`,
  })

  return session.url
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/lib/stripe.test.ts`
Expected: PASS — all 4 tests

- [ ] **Step 5: Commit**

```bash
git add lib/stripe.ts __tests__/lib/stripe.test.ts
git commit -m "feat: add Stripe client with checkout, portal, and customer management"
```

---

## Task 3: Checkout API Route

**Files:**
- Create: `app/api/stripe/checkout/route.ts`

- [ ] **Step 1: Create the checkout route**

Create `app/api/stripe/checkout/route.ts`:

```ts
import { createClient } from '@/lib/supabase/server'
import { createOrGetCustomer, createCheckoutSession, getPriceId } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { plan } = await request.json()
  if (plan !== 'monthly' && plan !== 'yearly') {
    return NextResponse.json({ error: 'plan must be "monthly" or "yearly"' }, { status: 400 })
  }

  const priceId = getPriceId(plan)
  if (!priceId) {
    return NextResponse.json({ error: 'Stripe price not configured' }, { status: 500 })
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, stripe_customer_id')
    .eq('id', user.id)
    .single()

  // Create or get Stripe customer
  const customerId = await createOrGetCustomer(
    user.id,
    user.email || '',
    profile?.name || null,
    profile?.stripe_customer_id || null,
  )

  // Save customer ID if new
  if (!profile?.stripe_customer_id) {
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  // Create checkout session
  const url = await createCheckoutSession(customerId, priceId, user.id)
  if (!url) {
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }

  return NextResponse.json({ url })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/stripe/checkout/route.ts
git commit -m "feat: add Stripe checkout API route"
```

---

## Task 4: Webhook API Route

**Files:**
- Create: `app/api/stripe/webhook/route.ts`

- [ ] **Step 1: Create the webhook route**

Create `app/api/stripe/webhook/route.ts`:

```ts
import { getStripeClient } from '@/lib/stripe'
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'

// Use service role to bypass RLS
function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  )
}

export async function POST(request: Request) {
  const stripe = getStripeClient()
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || '',
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.user_id
    const customerId = session.customer as string
    const subscriptionId = session.subscription as string

    if (!userId || !subscriptionId) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    // Fetch subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const periodEnd = new Date(subscription.current_period_end * 1000).toISOString()
    const interval = subscription.items.data[0]?.plan?.interval
    const plan = interval === 'year' ? 'yearly' : 'monthly'

    // Update profile
    await supabase
      .from('profiles')
      .update({ subscription_tier: 'premium', stripe_customer_id: customerId })
      .eq('id', userId)

    // Upsert subscription record
    await supabase
      .from('subscriptions')
      .upsert(
        {
          user_id: userId,
          stripe_subscription_id: subscriptionId,
          plan,
          status: 'active',
          current_period_end: periodEnd,
        },
        { onConflict: 'stripe_subscription_id' },
      )
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const subId = subscription.id

    // Find the user
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subId)
      .maybeSingle()

    if (sub) {
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('stripe_subscription_id', subId)

      await supabase
        .from('profiles')
        .update({ subscription_tier: 'free' })
        .eq('id', sub.user_id)
    }
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription
    const subId = subscription.id
    const status = subscription.status === 'past_due' ? 'past_due' : 'active'
    const periodEnd = new Date(subscription.current_period_end * 1000).toISOString()

    await supabase
      .from('subscriptions')
      .update({ status, current_period_end: periodEnd })
      .eq('stripe_subscription_id', subId)
  }

  return NextResponse.json({ received: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/stripe/webhook/route.ts
git commit -m "feat: add Stripe webhook handler for subscription lifecycle events"
```

---

## Task 5: Portal API Route

**Files:**
- Create: `app/api/stripe/portal/route.ts`

- [ ] **Step 1: Create the portal route**

Create `app/api/stripe/portal/route.ts`:

```ts
import { createClient } from '@/lib/supabase/server'
import { createPortalSession } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 400 })
  }

  const url = await createPortalSession(profile.stripe_customer_id)
  if (!url) {
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
  }

  return NextResponse.json({ url })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/stripe/portal/route.ts
git commit -m "feat: add Stripe customer portal API route"
```

---

## Task 6: Update PricingSection + Pricing Page

**Files:**
- Modify: `components/home/PricingSection.tsx`
- Modify: `app/pricing/page.tsx`

- [ ] **Step 1: Update PricingSection to accept props and handle checkout**

Replace `components/home/PricingSection.tsx` with:

```tsx
'use client'

import { useState } from 'react'
import PlanCard from '@/components/ui/PlanCard'

const FREE_FEATURES = [
  { text: 'Western birth chart', included: true },
  { text: '3 AI chat messages per day', included: true },
  { text: 'Daily horoscopes (all signs)', included: true },
  { text: '1 voice session per week', included: true },
  { text: 'Basic compatibility score', included: true },
  { text: 'Vedic / Jyotish chart', included: false },
  { text: 'Unlimited AI chat', included: false },
  { text: 'Transit & yearly forecasts', included: false },
]

const PREMIUM_FEATURES = [
  { text: 'Everything in Free', included: true },
  { text: 'Vedic / Jyotish chart + Kundali', included: true },
  { text: 'Unlimited AI chat with Astra', included: true },
  { text: 'Unlimited voice sessions', included: true },
  { text: 'Full compatibility + Kundali Milan', included: true },
  { text: 'Transit forecasts', included: true },
  { text: 'Yearly predictions', included: true },
  { text: 'Priority response speed', included: true },
]

interface PricingSectionProps {
  isLoggedIn?: boolean
  isPremium?: boolean
}

export default function PricingSection({ isLoggedIn = false, isPremium = false }: PricingSectionProps) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleCheckout(plan: 'monthly' | 'yearly') {
    setLoading(plan)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setLoading(null)
    }
  }

  async function handlePortal() {
    setLoading('portal')
    try {
      const response = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setLoading(null)
    }
  }

  return (
    <section className="py-24 px-6 bg-cosmos" id="pricing">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-3">Pricing</p>
          <h2 className="font-display text-4xl md:text-5xl text-star mb-4">
            Start free, upgrade when ready
          </h2>
          <p className="text-muted">No credit card required for the free plan.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <PlanCard
            name="Free"
            price="$0"
            description="Everything you need to explore your cosmic blueprint."
            features={FREE_FEATURES}
            ctaText="Get started free"
            ctaHref="/signup"
          />
          {isPremium ? (
            <PlanCard
              name="Premium"
              price="$9.99"
              period="/month"
              description="The complete Astra experience — unlimited and deeply personal."
              features={PREMIUM_FEATURES}
              ctaText={loading === 'portal' ? 'Loading...' : 'Manage Subscription'}
              ctaHref="#"
              ctaOnClick={handlePortal}
              highlighted
            />
          ) : (
            <PlanCard
              name="Premium"
              price="$9.99"
              period="/month"
              description="The complete Astra experience — unlimited and deeply personal."
              features={PREMIUM_FEATURES}
              ctaText={loading ? 'Loading...' : 'Start Premium'}
              ctaHref={isLoggedIn ? '#' : '/signup?plan=premium'}
              ctaOnClick={isLoggedIn ? () => handleCheckout('monthly') : undefined}
              highlighted
            />
          )}
        </div>
        {isLoggedIn && !isPremium && (
          <div className="text-center mt-6">
            <button
              onClick={() => handleCheckout('yearly')}
              disabled={loading === 'yearly'}
              className="text-violet-light text-sm hover:text-violet transition-colors"
            >
              {loading === 'yearly' ? 'Loading...' : 'Or save with yearly plan — $79/year'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Update PlanCard to support onClick**

Read `components/ui/PlanCard.tsx` and modify the `GlowButton` at the bottom to support an optional `onClick`:

Add `ctaOnClick?: () => void` to `PlanCardProps` interface.

Change the GlowButton render:

```tsx
<GlowButton
  href={ctaOnClick ? undefined : ctaHref}
  onClick={ctaOnClick}
  variant={highlighted ? 'primary' : 'secondary'}
>
  {ctaText}
</GlowButton>
```

- [ ] **Step 3: Update pricing page to pass auth state**

Replace `app/pricing/page.tsx` with:

```tsx
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import PricingSection from '@/components/home/PricingSection'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — Astra',
  description: 'Start free. Upgrade for unlimited readings with Astra.',
}

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isPremium = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()
    isPremium = profile?.subscription_tier === 'premium'
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void pt-16">
        <div className="pt-16">
          <PricingSection isLoggedIn={!!user} isPremium={isPremium} />
        </div>
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add components/home/PricingSection.tsx components/ui/PlanCard.tsx app/pricing/page.tsx
git commit -m "feat: make pricing buttons functional with Stripe checkout and portal"
```

---

## Task 7: Final Verification

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No new type errors
