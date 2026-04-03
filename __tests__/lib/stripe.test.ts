import { describe, it, expect, vi, beforeEach } from 'vitest'

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

vi.mock('stripe', () => {
  // Must use a regular function (not arrow) so `new Stripe(...)` works as a constructor
  const MockStripe = vi.fn(function () {
    return mockStripe
  })
  return { default: MockStripe }
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
