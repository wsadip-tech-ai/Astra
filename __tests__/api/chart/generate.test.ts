import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/geocoding', () => ({
  geocodeCity: vi.fn(async (city: string) => {
    if (city === 'Kathmandu') {
      return { lat: 27.7172, lng: 85.324, timezone: 'Asia/Kathmandu', displayName: 'Kathmandu, Nepal' }
    }
    throw Object.assign(new Error('City not found'), { name: 'GeocodingError' })
  }),
  GeocodingError: class GeocodingError extends Error {},
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'user-uuid' } } })) },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({ data: { id: 'chart-uuid' }, error: null })),
        })),
      })),
    })),
  })),
}))

describe('POST /api/chart/generate', () => {
  it('returns 200 with chart id on valid input', async () => {
    const { POST } = await import('@/app/api/chart/generate/route')
    const req = new Request('http://localhost/api/chart/generate', {
      method: 'POST',
      body: JSON.stringify({
        date_of_birth: '1990-05-15',
        time_of_birth: '14:30',
        place_of_birth: 'Kathmandu',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.chart_id).toBe('chart-uuid')
  })

  it('returns 400 on unknown city', async () => {
    const { POST } = await import('@/app/api/chart/generate/route')
    const req = new Request('http://localhost/api/chart/generate', {
      method: 'POST',
      body: JSON.stringify({ date_of_birth: '1990-05-15', place_of_birth: 'xyznotacity' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
