import OpenAI from 'openai'
import type { ZodiacSign } from '@/types'

interface HoroscopeFields {
  reading: string
  lucky_number: number
  lucky_color: string
  compatibility_sign: string
}

interface TransitData {
  planets: { name: string; sign: string; degree: number; nakshatra: string; retrograde: boolean }[]
}

export function buildHoroscopePrompt(sign: ZodiacSign, transits?: TransitData): string {
  const today = new Date().toISOString().split('T')[0]

  let transitSection = ''
  if (transits && transits.planets.length > 0) {
    const planetLines = transits.planets
      .map(
        (p) =>
          `  - ${p.name} in ${p.sign} at ${p.degree.toFixed(2)}° (nakshatra: ${p.nakshatra})${p.retrograde ? ' [retrograde]' : ''}`
      )
      .join('\n')
    transitSection = `\n\nCurrent planetary positions for ${today}:\n${planetLines}\n\nReference specific transits above when writing the horoscope. Mention at least two planets by name and explain how their positions influence ${sign.name} today.`
  }

  return `Today's date is ${today}. Generate today's horoscope for ${sign.name} (${sign.dates}, ${sign.element} sign, ruled by ${sign.rulingPlanet}).${transitSection}

Return ONLY valid JSON with no other text:
{
  "reading": "A ~200 word horoscope paragraph for ${today}. Be warm, specific, and reference current planetary energy. Write as Astra, a wise and experienced astrologer. Only reference dates in 2026 or later — never mention past years as upcoming.",
  "lucky_number": <number between 1 and 99>,
  "lucky_color": "<a color name>",
  "compatibility_sign": "<lowercase zodiac sign slug most compatible today>"
}`
}

export function parseHoroscopeResponse(raw: string): HoroscopeFields | null {
  try {
    // Handle cases where the model wraps JSON in markdown code blocks
    let cleaned = raw.trim()
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }
    const data = JSON.parse(cleaned)
    if (
      typeof data.reading !== 'string' ||
      typeof data.lucky_number !== 'number' ||
      typeof data.lucky_color !== 'string' ||
      typeof data.compatibility_sign !== 'string'
    ) {
      return null
    }
    return {
      reading: data.reading,
      lucky_number: data.lucky_number,
      lucky_color: data.lucky_color,
      compatibility_sign: data.compatibility_sign,
    }
  } catch {
    return null
  }
}

export async function generateHoroscope(sign: ZodiacSign, transits?: TransitData): Promise<HoroscopeFields | null> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const model = process.env.HOROSCOPE_MODEL || 'gpt-4o-mini'

  const response = await client.chat.completions.create({
    model,
    max_tokens: 512,
    messages: [{ role: 'user', content: buildHoroscopePrompt(sign, transits) }],
  })

  const text = response.choices[0]?.message?.content
  if (!text) return null

  return parseHoroscopeResponse(text)
}
