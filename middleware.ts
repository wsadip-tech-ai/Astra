// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export const isProtectedRoute = (pathname: string): boolean => {
  const routes = ['/dashboard', '/chart', '/chat', '/compatibility', '/transit', '/yearly', '/settings']
  return routes.some(r => pathname.startsWith(r))
}

export const isPremiumRoute = (pathname: string): boolean => {
  return pathname.startsWith('/transit') || pathname.startsWith('/yearly')
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request })

  // Refresh session — required by @supabase/ssr to keep session alive
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users away from protected routes
  if (!user && isProtectedRoute(pathname)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    const redirectResponse = NextResponse.redirect(loginUrl)
    response.cookies.getAll().forEach(cookie =>
      redirectResponse.cookies.set(cookie.name, cookie.value)
    )
    return redirectResponse
  }

  // Redirect free-tier users away from premium routes
  if (user && isPremiumRoute(pathname)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const subscriptionTier = (profile as Record<string, unknown> | null)?.subscription_tier ?? 'free'
    if (subscriptionTier !== 'premium') {
      const pricingUrl = request.nextUrl.clone()
      pricingUrl.pathname = '/pricing'
      const redirectResponse = NextResponse.redirect(pricingUrl)
      response.cookies.getAll().forEach(cookie =>
        redirectResponse.cookies.set(cookie.name, cookie.value)
      )
      return redirectResponse
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
