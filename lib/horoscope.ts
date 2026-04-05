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

// Sidereal sign order for house calculation
const SIDEREAL_SIGNS = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
  'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena',
]

// Western name to sidereal sign mapping
const WESTERN_TO_SIDEREAL: Record<string, string> = {
  aries: 'Mesha', taurus: 'Vrishabha', gemini: 'Mithuna', cancer: 'Karka',
  leo: 'Simha', virgo: 'Kanya', libra: 'Tula', scorpio: 'Vrishchika',
  sagittarius: 'Dhanu', capricorn: 'Makara', aquarius: 'Kumbha', pisces: 'Meena',
}

function getTransitHouse(signIndex: number, transitSignName: string): number {
  const transitIndex = SIDEREAL_SIGNS.indexOf(transitSignName)
  if (transitIndex === -1) return 0
  return ((transitIndex - signIndex + 12) % 12) + 1
}

export function buildHoroscopePrompt(sign: ZodiacSign, transits?: TransitData): string {
  const today = new Date().toISOString().split('T')[0]
  const siderealSign = WESTERN_TO_SIDEREAL[sign.name.toLowerCase()] ?? 'Mesha'
  const signIndex = SIDEREAL_SIGNS.indexOf(siderealSign)

  let transitSection = ''
  if (transits && transits.planets.length > 0) {
    // Calculate which house each transit falls in FOR THIS SIGN
    const planetLines = transits.planets
      .map((p) => {
        const house = getTransitHouse(signIndex, p.sign)
        const retro = p.retrograde ? ' [RETROGRADE]' : ''
        return `  - ${p.name} in ${p.sign} (${house}th house from ${siderealSign}) at ${p.degree}°${retro}`
      })
      .join('\n')

    // Build life area summary from transits
    const houseAreas: Record<number, string> = {
      1: 'Self & Health', 2: 'Finance & Family', 3: 'Communication & Courage',
      4: 'Home & Emotions', 5: 'Creativity & Romance', 6: 'Health & Daily Work',
      7: 'Relationships & Marriage', 8: 'Transformation & Inheritance',
      9: 'Luck & Spirituality', 10: 'Career & Public Image',
      11: 'Gains & Friends', 12: 'Expenses & Spiritual Growth',
    }

    const lifeAreaMap: Record<string, string[]> = {}
    transits.planets.forEach(p => {
      const house = getTransitHouse(signIndex, p.sign)
      const area = houseAreas[house] || 'General'
      if (!lifeAreaMap[area]) lifeAreaMap[area] = []
      const retro = p.retrograde ? ' (Rx)' : ''
      lifeAreaMap[area].push(`${p.name}${retro}`)
    })

    const lifeAreaLines = Object.entries(lifeAreaMap)
      .map(([area, planets]) => `  ${area}: ${planets.join(', ')}`)
      .join('\n')

    transitSection = `

TRANSIT DATA FOR ${sign.name.toUpperCase()} (${siderealSign}) — ${today}:
${planetLines}

LIFE AREA BREAKDOWN (which planets affect which area today):
${lifeAreaLines}

CRITICAL INSTRUCTIONS:
- The house numbers above are CALCULATED from Swiss Ephemeris. Use these EXACT numbers.
- NEVER say a planet is "in your sign" unless it is in the 1st house above.
- Reference at least 5 planets by name with their CORRECT house position.
- Mention ALL retrograde planets and their inward-turning effect.`
  }

  return `Today's date is ${today}. Generate today's horoscope for ${sign.name} (${sign.dates}, ${sign.element} sign, ruled by ${sign.rulingPlanet}).${transitSection}

You MUST structure the reading to cover ALL 5 life areas below, using the transit data:

1. **Career & Finance** — Which planets hit the 2nd/6th/10th/11th houses? What should they do about money/work today? Give ONE specific actionable tip.
2. **Relationships & Family** — Which planets hit the 4th/5th/7th houses? Specific advice for partner, family. ONE actionable tip.
3. **Health & Wellbeing** — Which planets hit the 1st/6th/8th houses? Physical and mental health advice. ONE specific tip (e.g., "take an evening walk", "monitor digestion").
4. **Communication & Social** — Which planets hit the 3rd/11th houses? Social interactions, networking advice.
5. **Spiritual & Personal Growth** — Which planets hit the 9th/12th houses? Inner development, mindfulness.

End with a one-line "Today's Mantra" — a short motivational phrase tied to the dominant planetary energy.

Return ONLY valid JSON with no other text:
{
  "reading": "A ~300 word horoscope covering all 5 life areas above. Reference SPECIFIC planets and house positions. Give concrete, actionable advice like a real astrologer would. Write as Astra. Be warm, specific, and grounded in the transit data.",
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

function deriveLuckyValues(transits: TransitData | undefined, signElement: string): { lucky_number: number; lucky_color: string } {
  if (!transits) {
    // Fallback: use date-based hash
    const dateNum = new Date().getDate()
    return { lucky_number: (dateNum * 7 + 13) % 99 + 1, lucky_color: 'Gold' }
  }

  // Lucky number: sum of all transit degrees, mod 99, + 1
  const degreeSum = transits.planets.reduce((sum, p) => sum + p.degree, 0)
  const lucky_number = (degreeSum % 99) + 1

  // Lucky color: based on dominant element from sign
  const elementColors: Record<string, string> = {
    Fire: 'Red', Earth: 'Green', Air: 'Yellow', Water: 'Blue',
  }
  const lucky_color = elementColors[signElement] || 'Gold'

  return { lucky_number, lucky_color }
}

export async function generateHoroscope(sign: ZodiacSign, transits?: TransitData): Promise<HoroscopeFields | null> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const model = process.env.HOROSCOPE_MODEL || 'gpt-4o-mini'

  const response = await client.chat.completions.create({
    model,
    max_tokens: 800,
    messages: [{ role: 'user', content: buildHoroscopePrompt(sign, transits) }],
  })

  const text = response.choices[0]?.message?.content
  if (!text) return null

  const parsed = parseHoroscopeResponse(text)
  if (!parsed) return null

  // Override with deterministic values
  const { lucky_number, lucky_color } = deriveLuckyValues(transits, sign.element)
  return { ...parsed, lucky_number, lucky_color }
}
