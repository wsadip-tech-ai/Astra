import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export function getStripeClient(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY || '')
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
