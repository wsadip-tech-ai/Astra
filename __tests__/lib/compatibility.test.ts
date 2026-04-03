import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('compatibility', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.CLAUDE_API_KEY = 'test-key'
  })

  it('buildCompatibilityReportPrompt includes names, score, and chart summaries', async () => {
    const { buildCompatibilityReportPrompt } = await import('@/lib/compatibility')
    const prompt = buildCompatibilityReportPrompt({
      userName: 'Sadip',
      partnerName: 'Sarah',
      score: 72,
      topAspects: 'Sun-Moon trine (1.3°), Venus-Mars conjunction (0.8°)',
      userChartSummary: 'Sun Taurus, Moon Scorpio, ASC Libra',
      partnerChartSummary: 'Sun Leo, Moon Taurus, ASC Aries',
    })

    expect(prompt).toContain('Sadip')
    expect(prompt).toContain('Sarah')
    expect(prompt).toContain('72')
    expect(prompt).toContain('Sun Taurus')
    expect(prompt).toContain('Sun Leo')
    expect(prompt).toContain('Sun-Moon trine')
  })
})
