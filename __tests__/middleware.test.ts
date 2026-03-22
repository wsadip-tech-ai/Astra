// __tests__/middleware.test.ts
import { describe, it, expect } from 'vitest'
import { isProtectedRoute, isPremiumRoute } from '@/middleware'

describe('middleware route matching', () => {
  it('allows public routes without auth check', () => {
    const publicRoutes = ['/', '/horoscope/aries', '/pricing', '/login', '/signup']
    const protectedRoutes = ['/dashboard', '/chart', '/chat', '/compatibility']
    const premiumRoutes = ['/transit', '/yearly']

    publicRoutes.forEach(route => {
      expect(isProtectedRoute(route)).toBe(false)
    })
    protectedRoutes.forEach(route => {
      expect(isProtectedRoute(route)).toBe(true)
    })
    premiumRoutes.forEach(route => {
      expect(isPremiumRoute(route)).toBe(true)
    })
  })
})
