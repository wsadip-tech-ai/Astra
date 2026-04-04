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
