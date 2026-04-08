import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL || 'http://localhost:3003'

test.describe('Public Pages', () => {
  test('homepage loads with hero section', async ({ page }) => {
    await page.goto(BASE)
    await expect(page).toHaveTitle(/Astra/i)
    await expect(page.locator('text=Astra').first()).toBeVisible()
  })

  test('login page loads', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await expect(page.locator('input[type="email"], input[type="text"]').first()).toBeVisible()
  })

  test('signup page loads', async ({ page }) => {
    await page.goto(`${BASE}/signup`)
    await expect(page.locator('input').first()).toBeVisible()
  })

  test('pricing page loads', async ({ page }) => {
    await page.goto(`${BASE}/pricing`)
    await expect(page.locator('text=/[Pp]remium|[Ff]ree/').first()).toBeVisible()
  })

  test('horoscope page loads for aries', async ({ page }) => {
    await page.goto(`${BASE}/horoscope/aries`)
    await expect(page.locator('text=/[Aa]ries/').first()).toBeVisible()
  })

  test('horoscope page loads for capricorn', async ({ page }) => {
    await page.goto(`${BASE}/horoscope/capricorn`)
    await expect(page.locator('text=/[Cc]apricorn/').first()).toBeVisible()
  })

  test('all 12 horoscope pages return 200', async ({ request }) => {
    const signs = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces']
    for (const sign of signs) {
      const resp = await request.get(`${BASE}/horoscope/${sign}`)
      expect(resp.status()).toBe(200)
    }
  })

  test('invalid horoscope sign returns 404', async ({ request }) => {
    const resp = await request.get(`${BASE}/horoscope/invalid`)
    expect(resp.status()).toBe(404)
  })
})

test.describe('Protected Pages (unauthenticated)', () => {
  const pages = ['/dashboard', '/chart', '/chat', '/compatibility', '/transit', '/yearly', '/vaastu', '/settings']

  for (const path of pages) {
    test(`${path} redirects to login`, async ({ page }) => {
      await page.goto(`${BASE}${path}`)
      await page.waitForURL(/\/login/)
      expect(page.url()).toContain('/login')
    })
  }
})

test.describe('API Routes (unauthenticated)', () => {
  const routes = [
    { path: '/api/personality', method: 'GET' },
    { path: '/api/transit', method: 'GET' },
    { path: '/api/cosmic-weather', method: 'GET' },
    { path: '/api/dashboard/glance', method: 'GET' },
    { path: '/api/dashboard/upcoming', method: 'GET' },
    { path: '/api/chat/sessions', method: 'GET' },
    { path: '/api/yearly', method: 'GET' },
  ]

  for (const route of routes) {
    test(`${route.method} ${route.path} returns 401`, async ({ request }) => {
      const resp = await request.get(`${BASE}${route.path}`)
      expect(resp.status()).toBe(401)
    })
  }
})

test.describe('Engine Health', () => {
  const ENGINE = process.env.ENGINE_URL || 'http://localhost:8001'
  const SECRET = process.env.INTERNAL_SECRET || '0866bbaba458935a9297a7060d76e841eee5004a4d04982f79738d3c52c079f0'

  test('engine health check', async ({ request }) => {
    const resp = await request.get(`${ENGINE}/health`, {
      headers: { 'X-Internal-Secret': SECRET },
    })
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body.status).toBe('ok')
  })

  test('transits today returns 9 planets', async ({ request }) => {
    const resp = await request.get(`${ENGINE}/transits/today`, {
      headers: { 'X-Internal-Secret': SECRET },
    })
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body.planets).toHaveLength(9)
    expect(body.date).toBeTruthy()
  })

  test('moon brief returns mood and remedy', async ({ request }) => {
    const resp = await request.get(`${ENGINE}/transits/moon-brief`, {
      headers: { 'X-Internal-Secret': SECRET },
    })
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body.mood).toBeTruthy()
    expect(body.daily_mantra).toBeTruthy()
    expect(body.daily_remedy).toBeTruthy()
  })

  test('dasha calculator works', async ({ request }) => {
    const resp = await request.post(`${ENGINE}/dasha`, {
      headers: { 'X-Internal-Secret': SECRET, 'Content-Type': 'application/json' },
      data: { moon_longitude: 40.0, date_of_birth: '1990-05-15' },
    })
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body.mahadashas).toHaveLength(9)
  })

  test('ashtakoota compatibility works', async ({ request }) => {
    const resp = await request.post(`${ENGINE}/compatibility/vedic`, {
      headers: { 'X-Internal-Secret': SECRET, 'Content-Type': 'application/json' },
      data: {
        user_moon_sign: 'Mesha', user_nakshatra: 'Ashwini', user_pada: 1,
        partner_moon_sign: 'Simha', partner_nakshatra: 'Magha', partner_pada: 1,
      },
    })
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body.kootas).toHaveLength(8)
    expect(body.max_score).toBe(36)
  })

  test('vaastu aayadi works', async ({ request }) => {
    const resp = await request.post(`${ENGINE}/vaastu/aayadi`, {
      headers: { 'X-Internal-Secret': SECRET, 'Content-Type': 'application/json' },
      data: { length: 30, breadth: 25, user_nakshatra: 'Ashwini' },
    })
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body.aaya).toBeDefined()
    expect(body.vyaya).toBeDefined()
  })

  test('yoga prediction works', async ({ request }) => {
    const resp = await request.post(`${ENGINE}/yogas/predict`, {
      headers: { 'X-Internal-Secret': SECRET, 'Content-Type': 'application/json' },
      data: { natal_moon_sign: 'Tula', years_ahead: 3 },
    })
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body.gaja_kesari).toBeDefined()
    expect(body.sade_sati).toBeDefined()
  })
})

test.describe('Navigation & Links', () => {
  test('navbar has key links', async ({ page }) => {
    await page.goto(BASE)
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
  })

  test('horoscope page has zodiac grid', async ({ page }) => {
    await page.goto(`${BASE}/horoscope/aries`)
    // Should have links to other signs
    await expect(page.locator('a[href*="/horoscope/"]').first()).toBeVisible()
  })

  test('pricing page has plan cards', async ({ page }) => {
    await page.goto(`${BASE}/pricing`)
    const cards = page.locator('text=/[Mm]onth|[Yy]ear|[Ff]ree|[Pp]remium/')
    await expect(cards.first()).toBeVisible()
  })
})
