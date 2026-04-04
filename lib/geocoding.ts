// lib/geocoding.ts
// Server-side only — called from API routes, never from the browser directly.
// Nominatim ToS requires: server-side requests only, User-Agent header, max 1 req/sec.

export class GeocodingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GeocodingError'
  }
}

export interface GeocodingResult {
  lat: number
  lng: number
  timezone: string   // IANA timezone string e.g. "Asia/Kathmandu"
  displayName: string
}

// Major city → IANA timezone mapping for accuracy
const CITY_TIMEZONES: Record<string, string> = {
  'kathmandu': 'Asia/Kathmandu',
  'mumbai': 'Asia/Kolkata',
  'delhi': 'Asia/Kolkata',
  'new delhi': 'Asia/Kolkata',
  'kolkata': 'Asia/Kolkata',
  'chennai': 'Asia/Kolkata',
  'bangalore': 'Asia/Kolkata',
  'hyderabad': 'Asia/Kolkata',
  'pokhara': 'Asia/Kathmandu',
  'london': 'Europe/London',
  'new york': 'America/New_York',
  'los angeles': 'America/Los_Angeles',
  'chicago': 'America/Chicago',
  'toronto': 'America/Toronto',
  'sydney': 'Australia/Sydney',
  'tokyo': 'Asia/Tokyo',
  'beijing': 'Asia/Shanghai',
  'shanghai': 'Asia/Shanghai',
  'dubai': 'Asia/Dubai',
  'singapore': 'Asia/Singapore',
  'bangkok': 'Asia/Bangkok',
  'jakarta': 'Asia/Jakarta',
  'paris': 'Europe/Paris',
  'berlin': 'Europe/Berlin',
  'moscow': 'Europe/Moscow',
  'sao paulo': 'America/Sao_Paulo',
  'cairo': 'Africa/Cairo',
  'johannesburg': 'Africa/Johannesburg',
  'nairobi': 'Africa/Nairobi',
  'lagos': 'Africa/Lagos',
  'dhaka': 'Asia/Dhaka',
  'karachi': 'Asia/Karachi',
  'islamabad': 'Asia/Karachi',
  'colombo': 'Asia/Colombo',
  'seoul': 'Asia/Seoul',
  'hong kong': 'Asia/Hong_Kong',
  'taipei': 'Asia/Taipei',
  'manila': 'Asia/Manila',
  'kuala lumpur': 'Asia/Kuala_Lumpur',
  'hanoi': 'Asia/Ho_Chi_Minh',
  'amsterdam': 'Europe/Amsterdam',
  'rome': 'Europe/Rome',
  'madrid': 'Europe/Madrid',
  'lisbon': 'Europe/Lisbon',
  'stockholm': 'Europe/Stockholm',
  'oslo': 'Europe/Oslo',
  'zurich': 'Europe/Zurich',
  'vienna': 'Europe/Vienna',
  'warsaw': 'Europe/Warsaw',
  'istanbul': 'Europe/Istanbul',
  'riyadh': 'Asia/Riyadh',
  'tehran': 'Asia/Tehran',
  'kabul': 'Asia/Kabul',
  'baku': 'Asia/Baku',
  'tbilisi': 'Asia/Tbilisi',
  'yerevan': 'Asia/Yerevan',
  'tashkent': 'Asia/Tashkent',
  'almaty': 'Asia/Almaty',
  'ulaanbaatar': 'Asia/Ulaanbaatar',
  'yangon': 'Asia/Yangon',
  'phnom penh': 'Asia/Phnom_Penh',
  'auckland': 'Pacific/Auckland',
  'fiji': 'Pacific/Fiji',
  'honolulu': 'Pacific/Honolulu',
  'anchorage': 'America/Anchorage',
  'denver': 'America/Denver',
  'phoenix': 'America/Phoenix',
  'vancouver': 'America/Vancouver',
  'mexico city': 'America/Mexico_City',
  'bogota': 'America/Bogota',
  'lima': 'America/Lima',
  'santiago': 'America/Santiago',
  'buenos aires': 'America/Argentina/Buenos_Aires',
}

function getTimezoneFromCoords(lat: number, lng: number, cityName: string): string {
  // Try city name match first
  const normalizedCity = cityName.toLowerCase().trim()
  for (const [key, tz] of Object.entries(CITY_TIMEZONES)) {
    if (normalizedCity.includes(key) || key.includes(normalizedCity)) {
      return tz
    }
  }

  // Fallback: approximate from longitude (using proper IANA names for major zones)
  const offset = Math.round(lng / 15)
  const offsetMap: Record<number, string> = {
    '-12': 'Pacific/Fiji',
    '-11': 'Pacific/Pago_Pago',
    '-10': 'Pacific/Honolulu',
    '-9': 'America/Anchorage',
    '-8': 'America/Los_Angeles',
    '-7': 'America/Denver',
    '-6': 'America/Chicago',
    '-5': 'America/New_York',
    '-4': 'America/Santiago',
    '-3': 'America/Sao_Paulo',
    '-2': 'Atlantic/South_Georgia',
    '-1': 'Atlantic/Azores',
    '0': 'Europe/London',
    '1': 'Europe/Paris',
    '2': 'Europe/Berlin',
    '3': 'Europe/Moscow',
    '4': 'Asia/Dubai',
    '5': 'Asia/Karachi',
    '6': 'Asia/Dhaka',
    '7': 'Asia/Bangkok',
    '8': 'Asia/Shanghai',
    '9': 'Asia/Tokyo',
    '10': 'Australia/Sydney',
    '11': 'Pacific/Noumea',
    '12': 'Pacific/Auckland',
  }

  return offsetMap[offset.toString() as keyof typeof offsetMap] || 'UTC'
}

export async function geocodeCity(city: string): Promise<GeocodingResult> {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', city)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')

  let data: Array<{ lat: string; lon: string; display_name: string }>

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'astrology-app/1.0 (contact@astrology-app.com)',
        'Accept-Language': 'en',
      },
      next: { revalidate: 86400 },
    })

    if (!response.ok) {
      throw new GeocodingError(`Nominatim returned ${response.status}`)
    }

    data = await response.json()
  } catch (err) {
    if (err instanceof GeocodingError) throw err
    throw new GeocodingError('Geocoding service unavailable')
  }

  if (!data || data.length === 0) {
    throw new GeocodingError(`City not found — try a nearby major city`)
  }

  const { lat: latStr, lon: lngStr, display_name: displayName } = data[0]
  const lat = parseFloat(latStr)
  const lng = parseFloat(lngStr)

  const timezone = getTimezoneFromCoords(lat, lng, city)

  return { lat, lng, timezone, displayName }
}
