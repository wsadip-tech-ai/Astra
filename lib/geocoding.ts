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

  const timezone = getTimezoneFromCoords(lat, lng)

  return { lat, lng, timezone, displayName }
}

// Approximate timezone lookup using longitude.
// FastAPI will refine this with timezonefinder when computing the chart.
function getTimezoneFromCoords(lat: number, lng: number): string {
  try {
    const offset = Math.round(lng / 15)
    const sign = offset >= 0 ? '+' : '-'
    const abs = Math.abs(offset).toString().padStart(2, '0')
    return `Etc/GMT${sign}${abs}`
  } catch {
    return 'UTC'
  }
}
