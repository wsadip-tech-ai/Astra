import type { WesternChartData, VedicChartData } from '@/types'

interface ChartParams {
  date_of_birth: string
  time_of_birth: string | null
  latitude: number
  longitude: number
  timezone: string
}

async function callEngine<T>(path: string, params: ChartParams): Promise<T | null> {
  const baseUrl = process.env.FASTAPI_BASE_URL || 'http://localhost:8000'
  const secret = process.env.INTERNAL_SECRET || ''

  console.log(`[astrology-engine] Calling ${baseUrl}${path} with secret=${secret ? 'set' : 'MISSING'}`)

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': secret,
      },
      body: JSON.stringify(params),
    })

    console.log(`[astrology-engine] Response: ${response.status}`)

    if (!response.ok) {
      const text = await response.text()
      console.error(`[astrology-engine] Error: ${text}`)
      return null
    }
    return await response.json() as T
  } catch (err) {
    console.error(`[astrology-engine] Network error:`, err)
    return null
  }
}

export async function calculateWesternChart(params: ChartParams): Promise<WesternChartData | null> {
  return callEngine<WesternChartData>('/chart/western', params)
}

export async function calculateVedicChart(params: ChartParams): Promise<VedicChartData | null> {
  return callEngine<VedicChartData>('/chart/vedic', params)
}
