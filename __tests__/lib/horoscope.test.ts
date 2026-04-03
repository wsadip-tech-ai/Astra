import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('horoscope', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.CLAUDE_API_KEY = 'test-key'
  })

  it('buildHoroscopePrompt includes sign name, dates, element, and ruling planet', async () => {
    const { buildHoroscopePrompt } = await import('@/lib/horoscope')
    const prompt = buildHoroscopePrompt({
      slug: 'aries',
      name: 'Aries',
      symbol: '♈',
      dates: 'March 21 – April 19',
      element: 'Fire',
      rulingPlanet: 'Mars',
      placeholderHoroscope: '',
    })

    expect(prompt).toContain('Aries')
    expect(prompt).toContain('March 21 – April 19')
    expect(prompt).toContain('Fire')
    expect(prompt).toContain('Mars')
    expect(prompt).toContain('"reading"')
    expect(prompt).toContain('"lucky_number"')
    expect(prompt).toContain('"lucky_color"')
    expect(prompt).toContain('"compatibility_sign"')
  })

  it('parseHoroscopeResponse extracts valid JSON from Claude response', async () => {
    const { parseHoroscopeResponse } = await import('@/lib/horoscope')
    const raw = JSON.stringify({
      reading: 'The stars align today.',
      lucky_number: 7,
      lucky_color: 'emerald green',
      compatibility_sign: 'leo',
    })

    const result = parseHoroscopeResponse(raw)
    expect(result).not.toBeNull()
    expect(result!.reading).toBe('The stars align today.')
    expect(result!.lucky_number).toBe(7)
    expect(result!.lucky_color).toBe('emerald green')
    expect(result!.compatibility_sign).toBe('leo')
  })

  it('parseHoroscopeResponse returns null for invalid JSON', async () => {
    const { parseHoroscopeResponse } = await import('@/lib/horoscope')
    const result = parseHoroscopeResponse('not json at all')
    expect(result).toBeNull()
  })

  it('parseHoroscopeResponse returns null for missing fields', async () => {
    const { parseHoroscopeResponse } = await import('@/lib/horoscope')
    const result = parseHoroscopeResponse(JSON.stringify({ reading: 'hello' }))
    expect(result).toBeNull()
  })
})
