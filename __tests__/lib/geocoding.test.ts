import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('geocodeCity', () => {
  beforeEach(() => { mockFetch.mockReset() })

  it('returns lat/lng/timezone for a valid city', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([{
        lat: '27.7172',
        lon: '85.3240',
        display_name: 'Kathmandu, Bagmati Province, Nepal',
      }]),
    })

    const { geocodeCity } = await import('@/lib/geocoding')
    const result = await geocodeCity('Kathmandu')

    expect(result).toMatchObject({
      lat: 27.7172,
      lng: 85.324,
      displayName: 'Kathmandu, Bagmati Province, Nepal',
    })
    expect(typeof result.timezone).toBe('string')
    expect(result.timezone.length).toBeGreaterThan(0)
  })

  it('throws GeocodingError when city not found', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([]),
    })

    const { geocodeCity, GeocodingError } = await import('@/lib/geocoding')
    await expect(geocodeCity('xyznotacity123')).rejects.toThrow(GeocodingError)
  })

  it('throws GeocodingError on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { geocodeCity, GeocodingError } = await import('@/lib/geocoding')
    await expect(geocodeCity('Kathmandu')).rejects.toThrow(GeocodingError)
  })
})
