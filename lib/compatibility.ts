import OpenAI from 'openai'
import type { WesternChartData } from '@/types'

interface ReportParams {
  userName: string
  partnerName: string
  score: number
  topAspects: string
  userChartSummary: string
  partnerChartSummary: string
}

export function buildCompatibilityReportPrompt(params: ReportParams): string {
  return `You are Astra, a warm and wise astrologer. Generate a ~300 word compatibility reading for ${params.userName} and ${params.partnerName}.

Their synastry shows:
Score: ${params.score}/100
Key aspects: ${params.topAspects}

${params.userName}'s chart: ${params.userChartSummary}
${params.partnerName}'s chart: ${params.partnerChartSummary}

Write a warm, insightful reading about their connection. Reference specific aspects. Be encouraging but honest about challenges.`
}

export async function generateCompatibilityReport(params: ReportParams): Promise<string | null> {
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const response = await client.chat.completions.create({
      model: process.env.CHAT_MODEL || 'gpt-4o-mini',
      max_tokens: 512,
      messages: [{ role: 'user', content: buildCompatibilityReportPrompt(params) }],
    })

    return response.choices[0]?.message?.content ?? null
  } catch {
    return null
  }
}

export async function callCompatibilityEngine(
  chart1Planets: WesternChartData['planets'],
  chart2Planets: WesternChartData['planets'],
): Promise<{ score: number; aspects: { planet1: string; planet2: string; type: string; orb: number }[]; summary: string } | null> {
  const baseUrl = process.env.FASTAPI_BASE_URL || 'http://localhost:8000'
  const secret = process.env.INTERNAL_SECRET || ''

  try {
    const response = await fetch(`${baseUrl}/compatibility`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': secret,
      },
      body: JSON.stringify({
        chart1_planets: chart1Planets.map(p => ({ name: p.name, sign: p.sign, degree: p.degree })),
        chart2_planets: chart2Planets.map(p => ({ name: p.name, sign: p.sign, degree: p.degree })),
      }),
    })

    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}


export async function callVedicCompatibilityEngine(params: {
  user_moon_sign: string
  user_nakshatra: string
  user_pada: number
  partner_moon_sign: string
  partner_nakshatra: string
  partner_pada: number
  user_mars_house?: number | null
  partner_mars_house?: number | null
}): Promise<{
  score: number
  max_score: number
  rating: string
  kootas: { name: string; score: number; max_score: number; description: string }[]
  doshas: { type: string; person: string; severity: string; canceled: boolean; remedy: string }[]
  mangal_dosha_user: boolean
  mangal_dosha_partner: boolean
} | null> {
  const baseUrl = process.env.FASTAPI_BASE_URL || 'http://localhost:8000'
  const secret = process.env.INTERNAL_SECRET || ''

  try {
    const response = await fetch(`${baseUrl}/compatibility/vedic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': secret,
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}


interface VedicReportParams {
  userName: string
  partnerName: string
  score: number
  maxScore: number
  rating: string
  kootas: { name: string; score: number; max_score: number }[]
  doshas: { type: string; person: string; severity: string; canceled: boolean }[]
}

export async function generateVedicCompatibilityNarrative(params: VedicReportParams): Promise<string | null> {
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const kootaSummary = params.kootas
      .map(k => `${k.name}: ${k.score}/${k.max_score}`)
      .join(', ')

    const doshaSummary = params.doshas.length > 0
      ? params.doshas.map(d => `${d.type} (${d.person}, severity: ${d.severity}, canceled: ${d.canceled})`).join('; ')
      : 'No doshas detected'

    const prompt = `You are Astra, a warm and wise Vedic astrologer. Write a 3-4 paragraph compatibility reading for ${params.userName} and ${params.partnerName}.

Their Ashtakoota (Kundali Milan) score is ${params.score}/${params.maxScore} — rated "${params.rating}".

Koota breakdown: ${kootaSummary}

Dosha status: ${doshaSummary}

Write a warm, insightful reading that:
1. Opens with the overall compatibility assessment based on the score and rating
2. Highlights the strongest kootas (highest scores) as relationship strengths
3. Addresses any weak kootas (score 0) as areas for awareness, not alarm
4. If doshas are present, explain them compassionately with the remedy context
5. Closes with encouraging guidance

Be authentic to Vedic tradition but accessible to modern readers. Use "you" and "your partner" language.`

    const response = await client.chat.completions.create({
      model: process.env.CHAT_MODEL || 'gpt-4o-mini',
      max_tokens: 768,
      messages: [{ role: 'user', content: prompt }],
    })

    return response.choices[0]?.message?.content ?? null
  } catch {
    return null
  }
}
