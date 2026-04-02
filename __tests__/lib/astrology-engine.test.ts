import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('astrology-engine client', () => {
  beforeEach(() => {
    vi.resetModules()
    mockFetch.mockReset()
    process.env.FASTAPI_BASE_URL = 'http://localhost:8000'
    process.env.INTERNAL_SECRET = 'test-secret'
  })

  it('calculateWesternChart sends correct request and returns data', async () => {
    const mockChart = { summary: 'Sun Taurus', planets: [], houses: [], aspects: [] }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockChart,
    })

    const { calculateWesternChart } = await import('@/lib/astrology-engine')
    const result = await calculateWesternChart({
      date_of_birth: '1990-05-15',
      time_of_birth: '14:30',
      latitude: 27.72,
      longitude: 85.32,
      timezone: 'Asia/Kathmandu',
    })

    expect(result).toEqual(mockChart)
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/chart/western',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-Internal-Secret': 'test-secret',
        }),
      }),
    )
  })

  it('calculateWesternChart returns null on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'))

    const { calculateWesternChart } = await import('@/lib/astrology-engine')
    const result = await calculateWesternChart({
      date_of_birth: '1990-05-15',
      time_of_birth: '14:30',
      latitude: 27.72,
      longitude: 85.32,
      timezone: 'Asia/Kathmandu',
    })

    expect(result).toBeNull()
  })

  it('calculateVedicChart returns null on non-200 response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })

    const { calculateVedicChart } = await import('@/lib/astrology-engine')
    const result = await calculateVedicChart({
      date_of_birth: '1990-05-15',
      time_of_birth: '14:30',
      latitude: 27.72,
      longitude: 85.32,
      timezone: 'Asia/Kathmandu',
    })

    expect(result).toBeNull()
  })
})
