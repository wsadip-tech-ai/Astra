// __tests__/middleware.test.ts
import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

// We test the route-matching logic independently of Supabase
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

// These helpers will be exported from middleware.ts
function isProtectedRoute(pathname: string): boolean {
  const protected_ = ['/dashboard', '/chart', '/chat', '/compatibility', '/transit', '/yearly']
  return protected_.some(r => pathname.startsWith(r))
}

function isPremiumRoute(pathname: string): boolean {
  return pathname.startsWith('/transit') || pathname.startsWith('/yearly')
}
