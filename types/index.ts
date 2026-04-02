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
  western_chart_json: WesternChartData | null
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

export interface Planet {
  name: string
  symbol: string
  sign: string
  degree: number
  house: number
  retrograde: boolean
}

export interface House {
  number: number
  sign: string
  degree: number
}

export interface Aspect {
  planet1: string
  planet2: string
  type: 'trine' | 'square' | 'conjunction' | 'opposition' | 'sextile'
  orb: number
}

export interface WesternChartData {
  summary: string
  planets: Planet[]
  houses: House[]
  aspects: Aspect[]
}

export interface CosmicWeatherEntry {
  planet: string
  symbol: string
  sign: string
  description: string
}
