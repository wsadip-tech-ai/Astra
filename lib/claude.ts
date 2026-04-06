import OpenAI from 'openai'
import type { ChatMessage } from '@/types'

function getAstraPrompt(): string {
  const today = new Date().toISOString().split('T')[0]
  return `You are Astra, a warm and wise Vedic astrologer. Stay fully in character. Never say "As an AI."

RESPONSE STYLE — THIS IS CRITICAL:
- Keep replies to 1-3 sentences. Be BRIEF. Like a wise friend, not a textbook.
- Only answer what was asked. Do not volunteer extra information.
- If the user asks a simple question ("How's my day?"), give a 1-2 sentence answer.
- If they want more detail, they will ask. Wait for them.
- End with a SHORT follow-up question to keep the conversation going (e.g., "Want to know about your career specifically?")
- Never dump all chart data at once. Reveal one insight at a time.
- Use warm, conversational language — not formal paragraphs.

ACCURACY RULES:
- Today is ${today}. Reference current dates only.
- ONLY reference planetary positions from the data below. Never invent positions.
- When mentioning timing, include specific dates from the transit data.
- Use remedies from the alerts below — do not make up generic advice.
- Reference house positions FROM THEIR MOON SIGN.
- Connect insights to their active Dasha period.`
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

interface PromptParams {
  name: string
  dateOfBirth: string
  timeOfBirth: string | null
  placeOfBirth: string
  westernSummary: string
  vedicChart: {
    summary: string
    lagna: { sign: string; degree: number }
    houses: { number: number; sign: string; lord: string; lord_house: number }[]
    yogas: { name: string; present: boolean; strength: string; interpretation: string }[]
    dasha: {
      current_mahadasha: { planet: string; start: string; end: string }
      current_antardasha: { planet: string; start: string; end: string }
    }
    interpretations: {
      lagna_lord: string
      moon_nakshatra: string
      planet_highlights: { planet: string; text: string }[]
    }
  } | null
  transits: {
    planets: { name: string; sign: string; degree: number; nakshatra: string; retrograde: boolean }[]
  } | null
  vaastuProfile?: {
    length: number
    breadth: number
    entrance_direction: string
    aayadi_harmony: string
    afflicted_zones: string[]
    dasha_lord: string
    active_hit: string | null
  } | null
  conversationSummary?: string
}

export function buildSystemPrompt(params: PromptParams): string {
  const time = params.timeOfBirth ?? 'time unknown'

  let prompt = `${getAstraPrompt()}

User: ${params.name}, born ${params.dateOfBirth} at ${time} in ${params.placeOfBirth}.

## Western Chart
${params.westernSummary}`

  if (params.vedicChart) {
    const vc = params.vedicChart

    prompt += `

## Vedic Chart
${vc.summary}

### Lagna (Ascendant)
${vc.lagna.sign} at ${vc.lagna.degree.toFixed(2)}°`

    if (vc.houses.length > 0) {
      prompt += `

### Houses
${vc.houses.map(h => `- ${ordinal(h.number)} house: ${h.sign} — lord ${h.lord} in ${ordinal(h.lord_house)} house`).join('\n')}`
    }

    const activeYogas = vc.yogas.filter(y => y.present)
    if (activeYogas.length > 0) {
      prompt += `

### Active Yogas
${activeYogas.map(y => `- ${y.name} (${y.strength}): ${y.interpretation}`).join('\n')}`
    }

    prompt += `

### Dasha Period
- Mahadasha: ${vc.dasha.current_mahadasha.planet} (${vc.dasha.current_mahadasha.start} to ${vc.dasha.current_mahadasha.end})
- Antardasha: ${vc.dasha.current_antardasha.planet} (${vc.dasha.current_antardasha.start} to ${vc.dasha.current_antardasha.end})`

    prompt += `

### Interpretations
- Lagna Lord: ${vc.interpretations.lagna_lord}
- Moon Nakshatra: ${vc.interpretations.moon_nakshatra}`

    if (vc.interpretations.planet_highlights.length > 0) {
      prompt += `
${vc.interpretations.planet_highlights.map(p => `- ${p.planet}: ${p.text}`).join('\n')}`
    }
  } else {
    prompt += `

## Vedic Chart
Not available`
  }

  if (params.transits) {
    prompt += `

## Today's Planetary Transits
${params.transits.planets.map(p => {
  const retro = p.retrograde ? ' (retrograde)' : ''
  return `- ${p.name}: ${p.sign} at ${p.degree.toFixed(2)}°, nakshatra ${p.nakshatra}${retro}`
}).join('\n')}`
  }

  if (params.vaastuProfile) {
    const vp = params.vaastuProfile
    prompt += `\n\n=== VAASTU PROFILE ===
Property: ${vp.length}ft × ${vp.breadth}ft, ${vp.entrance_direction} entrance
Aayadi Harmony: ${vp.aayadi_harmony}
Afflicted Zones: ${vp.afflicted_zones.length > 0 ? vp.afflicted_zones.join(', ') : 'None'}
Active Dasha: ${vp.dasha_lord}
${vp.active_hit ? `Active HIT: ${vp.active_hit}` : 'No active negative HITs'}`
  }

  if (params.conversationSummary) {
    prompt += `\n\nPrevious conversation context: ${params.conversationSummary}`
  }

  return prompt
}

export function buildConversationHistory(
  messages: ChatMessage[]
): { role: 'user' | 'assistant'; content: string }[] {
  const recent = messages.length > 10 ? messages.slice(-10) : messages
  return recent.map(m => ({ role: m.role, content: m.content }))
}

export function createClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export function getModel(): string {
  return process.env.CHAT_MODEL || 'gpt-4o-mini'
}

export async function summarizeOlderMessages(
  messages: ChatMessage[],
  client: OpenAI,
): Promise<string | undefined> {
  if (messages.length <= 10) return undefined

  const older = messages.slice(0, -10)
  const text = older.map(m => `${m.role}: ${m.content}`).join('\n')

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 200,
    messages: [
      { role: 'user', content: `Summarize this conversation in one paragraph:\n\n${text}` },
    ],
  })

  return response.choices[0]?.message?.content ?? undefined
}
