import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('claude', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.CLAUDE_API_KEY = 'test-key'
    process.env.CLAUDE_MODEL = 'claude-sonnet-4-6'
  })

  it('buildSystemPrompt includes chart data and user info', async () => {
    const { buildSystemPrompt } = await import('@/lib/claude')
    const prompt = buildSystemPrompt({
      name: 'Sadip',
      dateOfBirth: '1990-05-15',
      timeOfBirth: '14:30',
      placeOfBirth: 'Kathmandu',
      westernSummary: 'Sun Taurus, Moon Scorpio, ASC Libra',
      vedicChart: {
        summary: 'Lagna Kanya, Moon Makara, Nakshatra Uttara Ashadha',
        lagna: { sign: 'Kanya', degree: 12.5 },
        houses: [
          { number: 1, sign: 'Kanya', lord: 'Mercury', lord_house: 10 },
        ],
        yogas: [
          { name: 'Gajakesari', present: true, strength: 'strong', interpretation: 'Prosperity and wisdom' },
        ],
        dasha: {
          current_mahadasha: { planet: 'Jupiter', start: '2020-01-01', end: '2036-01-01' },
          current_antardasha: { planet: 'Saturn', start: '2024-01-01', end: '2026-06-01' },
        },
        interpretations: {
          lagna_lord: 'Mercury in 10th house gives career success',
          moon_nakshatra: 'Uttara Ashadha — disciplined and goal-oriented',
          planet_highlights: [
            { planet: 'Jupiter', text: 'Exalted, bestowing great fortune' },
          ],
        },
      },
      transits: null,
    })

    expect(prompt).toContain('You are Astra')
    expect(prompt).toContain('Sadip')
    expect(prompt).toContain('1990-05-15')
    expect(prompt).toContain('14:30')
    expect(prompt).toContain('Kathmandu')
    expect(prompt).toContain('Sun Taurus, Moon Scorpio, ASC Libra')
    expect(prompt).toContain('Lagna Kanya')
  })

  it('buildSystemPrompt handles missing vedic data', async () => {
    const { buildSystemPrompt } = await import('@/lib/claude')
    const prompt = buildSystemPrompt({
      name: 'Sadip',
      dateOfBirth: '1990-05-15',
      timeOfBirth: null,
      placeOfBirth: 'Kathmandu',
      westernSummary: 'Sun Taurus, Moon Scorpio, ASC Libra',
      vedicChart: null,
      transits: null,
    })

    expect(prompt).toContain('Not available')
    expect(prompt).toContain('time unknown')
  })

  it('buildConversationHistory returns last 10 messages', async () => {
    const { buildConversationHistory } = await import('@/lib/claude')
    const messages = Array.from({ length: 15 }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `message ${i}`,
      timestamp: new Date().toISOString(),
    }))

    const history = buildConversationHistory(messages)
    expect(history).toHaveLength(10)
    expect(history[0].content).toBe('message 5')
    expect(history[9].content).toBe('message 14')
  })

  it('buildConversationHistory returns all messages when <= 10', async () => {
    const { buildConversationHistory } = await import('@/lib/claude')
    const messages = Array.from({ length: 4 }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `message ${i}`,
      timestamp: new Date().toISOString(),
    }))

    const history = buildConversationHistory(messages)
    expect(history).toHaveLength(4)
  })
})
