// lib/profile.ts
// Helper to fetch profile data, handling both old and new column schemas.
// The Supabase profiles table may have either:
//   Old: id, role, full_name, avatar_url, email, created_at
//   New: id, name, subscription_tier, stripe_customer_id, daily_message_count, daily_reset_at, created_at
// This helper queries with SELECT * and maps to a consistent shape.

export interface AppProfile {
  name: string | null
  subscription_tier: 'free' | 'premium'
  stripe_customer_id: string | null
  daily_message_count: number
  daily_reset_at: string
}

export function mapProfile(raw: Record<string, unknown>): AppProfile {
  return {
    name: (raw.name as string) ?? (raw.full_name as string) ?? null,
    subscription_tier: ((raw.subscription_tier as string) ?? 'free') as 'free' | 'premium',
    stripe_customer_id: (raw.stripe_customer_id as string) ?? null,
    daily_message_count: (raw.daily_message_count as number) ?? 0,
    daily_reset_at: (raw.daily_reset_at as string) ?? new Date().toISOString().split('T')[0],
  }
}
