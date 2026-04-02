import type { WesternChartData, VedicChartData } from '@/types'

interface ChartParams {
  date_of_birth: string
  time_of_birth: string | null
  latitude: number
  longitude: number
  timezone: string
}

const BASE_URL = process.env.FASTAPI_BASE_URL || 'http://localhost:8000'
const SECRET = process.env.INTERNAL_SECRET || ''

async function callEngine<T>(path: string, params: ChartParams): Promise<T | null> {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': SECRET,
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) return null
    return await response.json() as T
  } catch {
    return null
  }
}

export async function calculateWesternChart(params: ChartParams): Promise<WesternChartData | null> {
  return callEngine<WesternChartData>('/chart/western', params)
}

export async function calculateVedicChart(params: ChartParams): Promise<VedicChartData | null> {
  return callEngine<VedicChartData>('/chart/vedic', params)
}
