export interface Profile {
  id: string
  name: string | null
  subscription_tier: 'free' | 'premium'
  stripe_customer_id: string | null
  daily_message_count: number
  daily_reset_at: string
  created_at: string
}

export interface BirthChart {
  id: string
  user_id: string
  label: string
  date_of_birth: string
  time_of_birth: string | null
  place_of_birth: string
  latitude: number
  longitude: number
  timezone: string
  western_chart_json: Record<string, unknown> | null
  vedic_chart_json: Record<string, unknown> | null
  created_at: string
}

export interface ZodiacSign {
  slug: string
  name: string
  symbol: string
  dates: string
  element: string
  rulingPlanet: string
  placeholderHoroscope: string
}
