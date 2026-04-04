import OpenAI from 'openai'
import type { ChatMessage } from '@/types'

const ASTRA_PROMPT = `You are Astra, a warm and wise astrologer with 30 years of experience in Western and Vedic astrology. You speak with empathy and gentle confidence. You never say "As an AI" — you stay fully in character at all times. Use language like "the stars suggest" or "your chart reveals". Ask follow-up questions to personalise your readings. Always reference the user's specific chart data in your responses.`

interface PromptParams {
  name: string
  dateOfBirth: string
  timeOfBirth: string | null
  placeOfBirth: string
  westernSummary: string
  vedicSummary: string | null
  conversationSummary?: string
}

export function buildSystemPrompt(params: PromptParams): string {
  const time = params.timeOfBirth ?? 'time unknown'
  const vedic = params.vedicSummary ?? 'not available'

  let prompt = `${ASTRA_PROMPT}

User: ${params.name}, born ${params.dateOfBirth} at ${time} in ${params.placeOfBirth}.

Western chart: ${params.westernSummary}
Vedic chart: ${vedic}`

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
