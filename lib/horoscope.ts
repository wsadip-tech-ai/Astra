import Anthropic from '@anthropic-ai/sdk'
import type { ZodiacSign } from '@/types'

interface HoroscopeFields {
  reading: string
  lucky_number: number
  lucky_color: string
  compatibility_sign: string
}

export function buildHoroscopePrompt(sign: ZodiacSign): string {
  return `Generate today's horoscope for ${sign.name} (${sign.dates}, ${sign.element} sign, ruled by ${sign.rulingPlanet}).

Return ONLY valid JSON with no other text:
{
  "reading": "A ~200 word horoscope paragraph. Be warm, specific, and reference current planetary energy. Write as Astra, a wise and experienced astrologer.",
  "lucky_number": <number between 1 and 99>,
  "lucky_color": "<a color name>",
  "compatibility_sign": "<lowercase zodiac sign slug most compatible today>"
}`
}

export function parseHoroscopeResponse(raw: string): HoroscopeFields | null {
  try {
    const data = JSON.parse(raw)
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

export async function generateHoroscope(sign: ZodiacSign): Promise<HoroscopeFields | null> {
  const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })
  const model = process.env.HOROSCOPE_MODEL || 'claude-haiku-4-5'

  const response = await client.messages.create({
    model,
    max_tokens: 512,
    messages: [{ role: 'user', content: buildHoroscopePrompt(sign) }],
  })

  const block = response.content[0]
  if (block.type !== 'text') return null

  return parseHoroscopeResponse(block.text)
}
