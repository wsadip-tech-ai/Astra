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
  vedic_chart_json: VedicChartData | null
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

export interface VedicPlanet {
  name: string
  sign: string
  degree: number
  nakshatra: string
  retrograde: boolean
}

export interface VedicNakshatra {
  planet: string
  nakshatra: string
  pada: number
}

export interface VedicChartData {
  summary: string
  lagna: { sign: string; degree: number }
  planets: VedicPlanet[]
  nakshatras: VedicNakshatra[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  audioUrl?: string
}

export interface ChatSession {
  id: string
  user_id: string
  chart_id: string
  messages: ChatMessage[]
  created_at: string
  updated_at: string
}

export interface HoroscopeData {
  sign: string
  date: string
  reading: string
  lucky_number: number
  lucky_color: string
  compatibility_sign: string
}
