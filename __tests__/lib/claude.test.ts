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
      vedicSummary: 'Lagna Kanya, Moon Makara, Nakshatra Uttara Ashadha',
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
      vedicSummary: null,
    })

    expect(prompt).toContain('not available')
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
