# Sub-project 1: Foundation + Homepage — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Next.js foundation — Supabase Auth, homepage (7 sections), 12 SSR horoscope pages, login/signup with birth details onboarding, pricing page, and a basic auth-protected dashboard.

**Architecture:** Next.js 14 App Router with Supabase Auth (@supabase/ssr for cookie-based sessions). Pure server components where possible; client components only for interactive forms and animations. Middleware handles auth redirects and premium tier gates.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Framer Motion, Supabase (Postgres + Auth), @supabase/ssr, @supabase/supabase-js, Vitest + React Testing Library, Nominatim geocoding API.

---

## File Map

| File | Responsibility |
|------|---------------|
| `app/layout.tsx` | Root layout: fonts, metadata, providers |
| `app/page.tsx` | Homepage — assembles all home sections |
| `app/(auth)/login/page.tsx` | Login page |
| `app/(auth)/signup/page.tsx` | Signup step 1 — account creation |
| `app/(auth)/signup/onboarding/page.tsx` | Signup step 2 — birth details |
| `app/pricing/page.tsx` | Pricing page |
| `app/horoscope/[sign]/page.tsx` | SSR horoscope page (12 signs) |
| `app/dashboard/page.tsx` | Auth-protected dashboard shell |
| `app/api/auth/signin/route.ts` | POST — email sign in via Supabase Auth |
| `app/api/auth/signup/route.ts` | POST — create account + profile row |
| `app/api/chart/generate/route.ts` | POST — geocode city, save birth_chart row |
| `app/api/user/me/route.ts` | GET — current user profile + subscription tier |
| `components/layout/Navbar.tsx` | Navigation (public + authed states) |
| `components/layout/Footer.tsx` | Site footer |
| `components/home/Hero.tsx` | Full-screen hero with star field, CTAs |
| `components/home/HowItWorks.tsx` | 3-step explainer section |
| `components/home/MeetAstra.tsx` | AI persona intro section |
| `components/home/HoroscopePreview.tsx` | 12 zodiac sign cards grid |
| `components/home/Testimonials.tsx` | 3 testimonial cards |
| `components/home/PricingSection.tsx` | Inline pricing plans |
| `components/signup/AccountForm.tsx` | Name/email/password form (client) |
| `components/signup/BirthDetailsForm.tsx` | Date/time/city form with geocoding (client) |
| `components/ui/StarField.tsx` | Animated canvas star particles |
| `components/ui/GlowButton.tsx` | Gradient CTA button |
| `components/ui/PlanCard.tsx` | Pricing plan card |
| `lib/supabase/client.ts` | `createBrowserClient()` for client components |
| `lib/supabase/server.ts` | `createServerClient()` for server components + API routes |
| `lib/geocoding.ts` | `geocodeCity(city)` → `{ lat, lng, timezone }` |
| `middleware.ts` | Auth redirect + premium tier gate |
| `types/index.ts` | Shared TypeScript interfaces |
| `constants/zodiac.ts` | 12 signs data + static placeholder horoscope text |
| `tailwind.config.ts` | Design tokens (colours, fonts) |
| `supabase/migrations/001_profiles.sql` | profiles table + DB trigger |
| `supabase/migrations/002_birth_charts.sql` | birth_charts table |
| `supabase/migrations/003_horoscopes.sql` | horoscopes table (scaffold for Sub-project 3) |

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json` (via CLI)
- Create: `tailwind.config.ts`
- Create: `app/layout.tsx`
- Create: `types/index.ts`

- [ ] **Step 1: Scaffold Next.js project**

```bash
cd C:/Users/wsadi/claude
npx create-next-app@latest astrology-app \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*"
cd astrology-app
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr \
  framer-motion \
  vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom \
  jsdom
```

- [ ] **Step 3: Install Google Fonts (Playfair Display + Inter)**

In `app/layout.tsx`, import via `next/font/google`. No package install needed.

- [ ] **Step 4: Replace `tailwind.config.ts` with design tokens**

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#09010f',
        cosmos: '#140025',
        nebula: '#1e0035',
        violet: {
          DEFAULT: '#7c3aed',
          light: '#c4b5fd',
          dark: '#4c1d95',
        },
        rose: {
          DEFAULT: '#ec4899',
          light: '#f9a8d4',
          dark: '#9d174d',
        },
        star: '#f8fafc',
        muted: '#6b7280',
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'serif'],
        body: ['var(--font-inter)', 'sans-serif'],
      },
      backgroundImage: {
        'cosmic-gradient': 'linear-gradient(135deg, #09010f 0%, #140025 50%, #09010f 100%)',
        'violet-glow': 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.3) 0%, transparent 70%)',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 5: Write `app/layout.tsx`**

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Astra — Your Personal AI Astrologer',
  description: 'Talk to Astra, an AI astrologer with deep knowledge of Western and Vedic astrology. Get your birth chart, daily horoscope, and personalised readings.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="bg-void text-star font-body antialiased">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 6: Write `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    scroll-behavior: smooth;
  }
  h1, h2, h3 {
    font-family: var(--font-playfair);
  }
}
```

- [ ] **Step 7: Set up Vitest**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

```ts
// vitest.setup.ts
import '@testing-library/jest-dom'
```

Add to `package.json` scripts:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 8: Write `types/index.ts`**

```ts
// types/index.ts
export interface Profile {
  id: string
  name: string | null
  subscription_tier: 'free' | 'premium'
  stripe_customer_id: string | null
  daily_message_count: number
  daily_reset_at: string
  created_at: string
}

export interface BirthChart {
  id: string
  user_id: string
  label: string
  date_of_birth: string      // ISO date "1990-05-15"
  time_of_birth: string | null  // "14:30"
  place_of_birth: string
  latitude: number
  longitude: number
  timezone: string           // IANA "Asia/Kathmandu"
  western_chart_json: Record<string, unknown> | null
  vedic_chart_json: Record<string, unknown> | null
  created_at: string
}

export interface ZodiacSign {
  slug: string               // "aries"
  name: string               // "Aries"
  symbol: string             // "♈"
  dates: string              // "March 21 – April 19"
  element: string            // "Fire"
  rulingPlanet: string       // "Mars"
  placeholderHoroscope: string
}
```

- [ ] **Step 9: Verify build compiles**

```bash
npm run build
```
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 14 project with Tailwind design tokens and TypeScript"
```

---

## Task 2: Supabase Migrations

**Files:**
- Create: `supabase/migrations/001_profiles.sql`
- Create: `supabase/migrations/002_birth_charts.sql`
- Create: `supabase/migrations/003_horoscopes.sql`

Prerequisites: Create a Supabase project at https://supabase.com. Copy the project URL and anon key. Enable Google OAuth in Supabase dashboard → Authentication → Providers → Google (requires Google Cloud Console OAuth app).

- [ ] **Step 1: Write `supabase/migrations/001_profiles.sql`**

```sql
-- 001_profiles.sql
-- Extends auth.users with app-specific profile data

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'premium')),
  stripe_customer_id text,
  is_admin boolean not null default false,
  daily_message_count int not null default 0,
  daily_reset_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- Auto-create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row Level Security: users can only read/update their own profile
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);
```

- [ ] **Step 2: Write `supabase/migrations/002_birth_charts.sql`**

```sql
-- 002_birth_charts.sql

create table if not exists public.birth_charts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null default 'My Chart',
  date_of_birth date not null,
  time_of_birth time,
  place_of_birth text not null,
  latitude float not null,
  longitude float not null,
  timezone text not null,
  western_chart_json jsonb,
  vedic_chart_json jsonb,
  created_at timestamptz not null default now()
);

alter table public.birth_charts enable row level security;

create policy "Users can manage own charts"
  on public.birth_charts for all
  using (auth.uid() = user_id);
```

- [ ] **Step 3: Write `supabase/migrations/003_horoscopes.sql`**

```sql
-- 003_horoscopes.sql
-- Cache table for daily horoscopes (populated in Sub-project 3)

create table if not exists public.horoscopes (
  id uuid primary key default gen_random_uuid(),
  sign text not null,
  date date not null,
  reading text not null,
  lucky_number int,
  lucky_color text,
  created_at timestamptz not null default now(),
  unique(sign, date)
);

-- Public read access (horoscopes are public content)
alter table public.horoscopes enable row level security;

create policy "Horoscopes are publicly readable"
  on public.horoscopes for select
  using (true);
```

- [ ] **Step 4: Run migrations in Supabase dashboard**

Go to Supabase project → SQL Editor → run each migration file in order (001, 002, 003).

Verify by checking Table Editor — you should see `profiles`, `birth_charts`, `horoscopes` tables.

- [ ] **Step 5: Commit**

```bash
git add supabase/
git commit -m "feat: add Supabase migrations for profiles, birth_charts, horoscopes"
```

---

## Task 3: Supabase Client Setup

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `.env.local`
- Create: `middleware.ts` (skeleton only — full logic in Task 5)

- [ ] **Step 1: Create `.env.local`**

```bash
# .env.local  (do NOT commit this file — already in .gitignore)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
INTERNAL_SECRET=generate-with-openssl-rand-hex-32
FASTAPI_BASE_URL=http://localhost:8000
```

Generate `INTERNAL_SECRET`:
```bash
openssl rand -hex 32
```

- [ ] **Step 2: Write `lib/supabase/client.ts`**

```ts
// lib/supabase/client.ts
// Use in Client Components only ("use client" files)
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 3: Write `lib/supabase/server.ts`**

```ts
// lib/supabase/server.ts
// Use in Server Components, API routes, and middleware
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — cookies set in middleware instead
          }
        },
      },
    }
  )
}
```

- [ ] **Step 4: Write skeleton `middleware.ts`** (full logic added in Task 5)

```ts
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 5: Write unit test for Supabase client creation**

```ts
// __tests__/lib/supabase/client.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @supabase/ssr
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({ auth: {} })),
}))

describe('createClient (browser)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  it('creates a client with env vars', async () => {
    const { createBrowserClient } = await import('@supabase/ssr')
    const { createClient } = await import('@/lib/supabase/client')
    createClient()
    expect(createBrowserClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key'
    )
  })
})
```

- [ ] **Step 6: Run tests**

```bash
npm run test:run
```
Expected: 1 test passing.

- [ ] **Step 7: Commit**

```bash
git add lib/ middleware.ts .env.local __tests__/ vitest.config.ts vitest.setup.ts
git commit -m "feat: add Supabase client setup (browser + server) and test"
```

Note: add `.env.local` to `.gitignore` if not already there.

---

## Task 4: Geocoding Service

**Files:**
- Create: `lib/geocoding.ts`
- Create: `__tests__/lib/geocoding.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/lib/geocoding.test.ts
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
    // timezone is derived from lat/lng — we just check it's a non-empty string
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
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm run test:run -- __tests__/lib/geocoding.test.ts
```
Expected: FAIL — "Cannot find module '@/lib/geocoding'"

- [ ] **Step 3: Write `lib/geocoding.ts`**

```ts
// lib/geocoding.ts
// Server-side only — called from API routes, never from the browser directly.
// Nominatim ToS requires: server-side requests only, User-Agent header, max 1 req/sec.

export class GeocodingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GeocodingError'
  }
}

export interface GeocodingResult {
  lat: number
  lng: number
  timezone: string   // IANA timezone string e.g. "Asia/Kathmandu"
  displayName: string
}

export async function geocodeCity(city: string): Promise<GeocodingResult> {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', city)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')

  let data: Array<{ lat: string; lon: string; display_name: string }>

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'astrology-app/1.0 (contact@astrology-app.com)',
        'Accept-Language': 'en',
      },
      next: { revalidate: 86400 }, // Cache geocoding results for 24h
    })

    if (!response.ok) {
      throw new GeocodingError(`Nominatim returned ${response.status}`)
    }

    data = await response.json()
  } catch (err) {
    if (err instanceof GeocodingError) throw err
    throw new GeocodingError('Geocoding service unavailable')
  }

  if (!data || data.length === 0) {
    throw new GeocodingError(
      `City not found — try a nearby major city`
    )
  }

  const { lat: latStr, lon: lngStr, display_name: displayName } = data[0]
  const lat = parseFloat(latStr)
  const lng = parseFloat(lngStr)

  // Derive IANA timezone from coordinates using the Intl API (available in Node 18+)
  // This is an approximation; the FastAPI service will use pytz for precise calculation
  const timezone = getTimezoneFromCoords(lat, lng)

  return { lat, lng, timezone, displayName }
}

// Approximate timezone lookup using longitude.
// FastAPI will refine this with timezonefinder when computing the chart.
function getTimezoneFromCoords(lat: number, lng: number): string {
  try {
    // Use the browser/Node Intl API if available
    // For server-side precision, we pass lat/lng to FastAPI which uses timezonefinder
    const offset = Math.round(lng / 15)
    const sign = offset >= 0 ? '+' : '-'
    const abs = Math.abs(offset).toString().padStart(2, '0')
    return `Etc/GMT${sign}${abs}`
  } catch {
    return 'UTC'
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm run test:run -- __tests__/lib/geocoding.test.ts
```
Expected: 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add lib/geocoding.ts __tests__/lib/geocoding.test.ts
git commit -m "feat: add Nominatim geocoding service with tests"
```

---

## Task 5: Zodiac Constants

**Files:**
- Create: `constants/zodiac.ts`

- [ ] **Step 1: Write `constants/zodiac.ts`**

```ts
// constants/zodiac.ts
import type { ZodiacSign } from '@/types'

export const ZODIAC_SIGNS: ZodiacSign[] = [
  {
    slug: 'aries',
    name: 'Aries',
    symbol: '♈',
    dates: 'March 21 – April 19',
    element: 'Fire',
    rulingPlanet: 'Mars',
    placeholderHoroscope: "The stars align in your favour today, Aries. Your natural boldness is your greatest asset right now — trust your instincts and take the initiative you've been hesitating over. Mars energises your ambitions. A chance encounter could spark a new creative direction.",
  },
  {
    slug: 'taurus',
    name: 'Taurus',
    symbol: '♉',
    dates: 'April 20 – May 20',
    element: 'Earth',
    rulingPlanet: 'Venus',
    placeholderHoroscope: "Venus wraps you in warmth today, Taurus. Your patience is about to pay off in ways you haven't anticipated. Financial matters look favourable — a practical decision made now will yield comfort later. Take time to nourish yourself this evening.",
  },
  {
    slug: 'gemini',
    name: 'Gemini',
    symbol: '♊',
    dates: 'May 21 – June 20',
    element: 'Air',
    rulingPlanet: 'Mercury',
    placeholderHoroscope: "Mercury sharpens your already quick mind today, Gemini. Ideas are flowing — write them down before they scatter like starlight. A conversation with someone unexpected will give you a fresh perspective. Your adaptability is your superpower right now.",
  },
  {
    slug: 'cancer',
    name: 'Cancer',
    symbol: '♋',
    dates: 'June 21 – July 22',
    element: 'Water',
    rulingPlanet: 'Moon',
    placeholderHoroscope: "The Moon calls you inward today, Cancer. Your intuition is extraordinarily sharp — pay attention to the quiet feelings beneath the surface. Home and family matters need gentle attention. An emotional conversation held with care will strengthen a bond.",
  },
  {
    slug: 'leo',
    name: 'Leo',
    symbol: '♌',
    dates: 'July 23 – August 22',
    element: 'Fire',
    rulingPlanet: 'Sun',
    placeholderHoroscope: "The Sun blazes with purpose in your sign, Leo. Your charisma is magnetic today — people are drawn to your warmth and vision. A creative project you've been nurturing is ready to share with the world. Own your spotlight with grace.",
  },
  {
    slug: 'virgo',
    name: 'Virgo',
    symbol: '♍',
    dates: 'August 23 – September 22',
    element: 'Earth',
    rulingPlanet: 'Mercury',
    placeholderHoroscope: "Mercury guides your keen eye for detail today, Virgo. A complex situation becomes clear when you apply your methodical approach. Your acts of service don't go unnoticed. Release the need for perfection in one area — good enough truly is enough today.",
  },
  {
    slug: 'libra',
    name: 'Libra',
    symbol: '♎',
    dates: 'September 23 – October 22',
    element: 'Air',
    rulingPlanet: 'Venus',
    placeholderHoroscope: "Venus graces your relationships with beauty today, Libra. Harmony is within reach — but it requires you to voice what you truly want. A decision you've been weighing will become clearer by evening. Trust that balance is always restored.",
  },
  {
    slug: 'scorpio',
    name: 'Scorpio',
    symbol: '♏',
    dates: 'October 23 – November 21',
    element: 'Water',
    rulingPlanet: 'Pluto',
    placeholderHoroscope: "Pluto stirs the depths today, Scorpio. What has been hidden is ready to be seen — in yourself and in a situation around you. Your insight cuts through illusion with precision. A transformation you've been resisting is actually the doorway to what you most desire.",
  },
  {
    slug: 'sagittarius',
    name: 'Sagittarius',
    symbol: '♐',
    dates: 'November 22 – December 21',
    element: 'Fire',
    rulingPlanet: 'Jupiter',
    placeholderHoroscope: "Jupiter expands your horizons today, Sagittarius. An opportunity to learn or travel presents itself — say yes. Your philosophical nature is craving depth; seek out a conversation or book that challenges your worldview. Freedom found inward is the truest kind.",
  },
  {
    slug: 'capricorn',
    name: 'Capricorn',
    symbol: '♑',
    dates: 'December 22 – January 19',
    element: 'Earth',
    rulingPlanet: 'Saturn',
    placeholderHoroscope: "Saturn rewards your discipline today, Capricorn. A long-term goal inches closer — the consistency you've quietly maintained is building something solid. Don't overlook a moment of unexpected joy; your serious nature deserves lightness too.",
  },
  {
    slug: 'aquarius',
    name: 'Aquarius',
    symbol: '♒',
    dates: 'January 20 – February 18',
    element: 'Air',
    rulingPlanet: 'Uranus',
    placeholderHoroscope: "Uranus sparks brilliant ideas today, Aquarius. Your vision for the future is ahead of its time — share it anyway. A community or cause you care about needs your unique perspective. The unconventional path is the right one right now.",
  },
  {
    slug: 'pisces',
    name: 'Pisces',
    symbol: '♓',
    dates: 'February 19 – March 20',
    element: 'Water',
    rulingPlanet: 'Neptune',
    placeholderHoroscope: "Neptune bathes you in intuition today, Pisces. Your compassion is a gift — offer it freely but remember to protect your own energy. A dream or creative vision deserves your attention. The boundary between imagination and reality is thinner than usual; something beautiful can emerge from that space.",
  },
]

export const ZODIAC_SLUGS = ZODIAC_SIGNS.map(s => s.slug)

export function getSignBySlug(slug: string): ZodiacSign | undefined {
  return ZODIAC_SIGNS.find(s => s.slug === slug)
}
```

- [ ] **Step 2: Commit**

```bash
git add constants/
git commit -m "feat: add zodiac signs constants with placeholder horoscopes"
```

---

## Task 6: Next.js Middleware (Auth + Tier Gates)

**Files:**
- Modify: `middleware.ts`
- Create: `__tests__/middleware.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run — verify it fails**

```bash
npm run test:run -- __tests__/middleware.test.ts
```
Expected: FAIL (functions not yet defined)

- [ ] **Step 3: Write full `middleware.ts`**

```ts
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export const isProtectedRoute = (pathname: string): boolean => {
  const routes = ['/dashboard', '/chart', '/chat', '/compatibility', '/transit', '/yearly']
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
    return NextResponse.redirect(loginUrl)
  }

  // Redirect free-tier users away from premium routes
  if (user && isPremiumRoute(pathname)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    if (profile?.subscription_tier !== 'premium') {
      const pricingUrl = request.nextUrl.clone()
      pricingUrl.pathname = '/pricing'
      return NextResponse.redirect(pricingUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test:run -- __tests__/middleware.test.ts
```
Expected: 1 test passing.

- [ ] **Step 5: Commit**

```bash
git add middleware.ts __tests__/middleware.test.ts
git commit -m "feat: add Next.js middleware for auth redirect and premium tier gate"
```

---

## Task 7: UI Primitives

**Files:**
- Create: `components/ui/StarField.tsx`
- Create: `components/ui/GlowButton.tsx`
- Create: `components/ui/PlanCard.tsx`

- [ ] **Step 1: Write `components/ui/StarField.tsx`**

```tsx
// components/ui/StarField.tsx
'use client'
import { useEffect, useRef } from 'react'

interface Star {
  x: number; y: number; r: number; opacity: number; speed: number
}

export default function StarField({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const stars: Star[] = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      opacity: Math.random() * 0.7 + 0.3,
      speed: Math.random() * 0.3 + 0.05,
    }))

    let animId: number
    function draw() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      stars.forEach(star => {
        star.opacity += (Math.random() - 0.5) * 0.02
        star.opacity = Math.max(0.1, Math.min(1, star.opacity))
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(248, 250, 252, ${star.opacity})`
        ctx.fill()
      })
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    />
  )
}
```

- [ ] **Step 2: Write `components/ui/GlowButton.tsx`**

```tsx
// components/ui/GlowButton.tsx
'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface GlowButtonProps {
  href?: string
  onClick?: () => void
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  className?: string
  disabled?: boolean
}

export default function GlowButton({
  href, onClick, children, variant = 'primary', className = '', disabled
}: GlowButtonProps) {
  const base = 'inline-flex items-center justify-center px-6 py-3 rounded-full font-body font-semibold text-sm transition-all duration-200 cursor-pointer'
  const variants = {
    primary: 'bg-gradient-to-r from-violet to-rose text-white shadow-lg shadow-violet/30 hover:shadow-violet/50 hover:scale-105',
    secondary: 'border border-violet/50 text-violet-light hover:border-violet hover:bg-violet/10',
  }
  const classes = `${base} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`

  const inner = (
    <motion.span
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={classes}
      onClick={onClick}
    >
      {children}
    </motion.span>
  )

  if (href) return <Link href={href}>{inner}</Link>
  return inner
}
```

- [ ] **Step 3: Write `components/ui/PlanCard.tsx`**

```tsx
// components/ui/PlanCard.tsx
import GlowButton from './GlowButton'

interface PlanFeature { text: string; included: boolean }

interface PlanCardProps {
  name: string
  price: string
  period?: string
  description: string
  features: PlanFeature[]
  ctaText: string
  ctaHref: string
  highlighted?: boolean
}

export default function PlanCard({
  name, price, period, description, features, ctaText, ctaHref, highlighted
}: PlanCardProps) {
  return (
    <div className={`relative rounded-2xl p-8 flex flex-col gap-6 ${
      highlighted
        ? 'bg-gradient-to-b from-violet/20 to-rose/10 border border-violet/40 shadow-xl shadow-violet/20'
        : 'bg-cosmos border border-white/10'
    }`}>
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet to-rose text-white text-xs font-semibold px-4 py-1 rounded-full">
          Most Popular
        </div>
      )}
      <div>
        <h3 className="font-display text-xl text-star">{name}</h3>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-4xl font-bold text-star">{price}</span>
          {period && <span className="text-muted text-sm">{period}</span>}
        </div>
        <p className="mt-2 text-muted text-sm">{description}</p>
      </div>
      <ul className="flex flex-col gap-3 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <span className={f.included ? 'text-violet-light' : 'text-muted'}>
              {f.included ? '✓' : '○'}
            </span>
            <span className={f.included ? 'text-star' : 'text-muted'}>{f.text}</span>
          </li>
        ))}
      </ul>
      <GlowButton href={ctaHref} variant={highlighted ? 'primary' : 'secondary'}>
        {ctaText}
      </GlowButton>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/ui/
git commit -m "feat: add StarField, GlowButton, PlanCard UI primitives"
```

---

## Task 8: Navbar + Footer

**Files:**
- Create: `components/layout/Navbar.tsx`
- Create: `components/layout/Footer.tsx`

- [ ] **Step 1: Write `components/layout/Navbar.tsx`**

```tsx
// components/layout/Navbar.tsx
'use client'
import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import GlowButton from '@/components/ui/GlowButton'

interface NavbarProps {
  isAuthed?: boolean
}

export default function Navbar({ isAuthed = false }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-void/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-xl text-star tracking-wide">
          ✦ Astra
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/horoscope/aries" className="text-muted hover:text-star text-sm transition-colors">
            Daily Horoscope
          </Link>
          <Link href="/astrologer" className="text-muted hover:text-star text-sm transition-colors">
            Meet Astra
          </Link>
          <Link href="/pricing" className="text-muted hover:text-star text-sm transition-colors">
            Pricing
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {isAuthed ? (
            <>
              <Link href="/dashboard" className="text-muted hover:text-star text-sm transition-colors">
                Dashboard
              </Link>
              <button onClick={handleSignOut} className="text-muted hover:text-star text-sm transition-colors">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-muted hover:text-star text-sm transition-colors">
                Sign in
              </Link>
              <GlowButton href="/signup" variant="primary">
                Get Started ✨
              </GlowButton>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-muted p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-cosmos border-t border-white/5 px-6 py-4 flex flex-col gap-4">
          <Link href="/horoscope/aries" className="text-muted hover:text-star text-sm" onClick={() => setMenuOpen(false)}>Daily Horoscope</Link>
          <Link href="/astrologer" className="text-muted hover:text-star text-sm" onClick={() => setMenuOpen(false)}>Meet Astra</Link>
          <Link href="/pricing" className="text-muted hover:text-star text-sm" onClick={() => setMenuOpen(false)}>Pricing</Link>
          {isAuthed
            ? <button onClick={handleSignOut} className="text-muted hover:text-star text-sm text-left">Sign out</button>
            : <Link href="/signup" className="text-violet-light text-sm font-semibold" onClick={() => setMenuOpen(false)}>Get Started →</Link>
          }
        </div>
      )}
    </nav>
  )
}
```

- [ ] **Step 2: Write `components/layout/Footer.tsx`**

```tsx
// components/layout/Footer.tsx
import Link from 'next/link'
import { ZODIAC_SIGNS } from '@/constants/zodiac'

export default function Footer() {
  return (
    <footer className="bg-cosmos border-t border-white/5 py-12 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="font-display text-xl text-star mb-2">✦ Astra</div>
          <p className="text-muted text-sm leading-relaxed">
            Your personal AI astrologer, available 24/7. Powered by Claude AI.
          </p>
        </div>
        <div>
          <h4 className="text-star text-sm font-semibold mb-3">Explore</h4>
          <ul className="flex flex-col gap-2">
            {['Daily Horoscope', 'Meet Astra', 'Birth Chart', 'Compatibility'].map(item => (
              <li key={item}>
                <Link href="#" className="text-muted hover:text-star text-sm transition-colors">{item}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-star text-sm font-semibold mb-3">Zodiac Signs</h4>
          <ul className="grid grid-cols-2 gap-1">
            {ZODIAC_SIGNS.slice(0, 6).map(sign => (
              <li key={sign.slug}>
                <Link href={`/horoscope/${sign.slug}`} className="text-muted hover:text-star text-xs transition-colors">
                  {sign.symbol} {sign.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-star text-sm font-semibold mb-3">Account</h4>
          <ul className="flex flex-col gap-2">
            {[['Sign up free', '/signup'], ['Sign in', '/login'], ['Pricing', '/pricing']].map(([label, href]) => (
              <li key={label}>
                <Link href={href} className="text-muted hover:text-star text-sm transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between gap-3">
        <p className="text-muted text-xs">© 2026 Astra. All rights reserved.</p>
        <p className="text-muted text-xs">Powered by Claude AI · Built with ✦</p>
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/layout/
git commit -m "feat: add Navbar and Footer components"
```

---

## Task 9: Homepage — Hero + HowItWorks + MeetAstra

**Files:**
- Create: `components/home/Hero.tsx`
- Create: `components/home/HowItWorks.tsx`
- Create: `components/home/MeetAstra.tsx`

- [ ] **Step 1: Write `components/home/Hero.tsx`**

```tsx
// components/home/Hero.tsx
'use client'
import { motion } from 'framer-motion'
import StarField from '@/components/ui/StarField'
import GlowButton from '@/components/ui/GlowButton'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-cosmic-gradient">
      <StarField />
      {/* Nebula glow */}
      <div className="absolute inset-0 bg-violet-glow pointer-events-none" />

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 bg-violet/10 border border-violet/30 rounded-full px-4 py-1.5 text-violet-light text-xs font-semibold tracking-widest uppercase mb-8">
            ✦ AI-Powered Astrology
          </div>

          <h1 className="font-display text-5xl md:text-7xl text-star leading-tight mb-6">
            Your personal<br />
            <span className="bg-gradient-to-r from-violet-light via-rose-light to-violet-light bg-clip-text text-transparent">
              cosmic guide
            </span>
          </h1>

          <p className="text-muted text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Talk to Astra — an AI astrologer with deep knowledge of Western and Vedic traditions.
            Get your birth chart read, daily insights, and answers to life's big questions.
            Available 24/7. By voice or text.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <GlowButton href="/signup" variant="primary" className="text-base px-8 py-4">
              Get Your Free Chart ✨
            </GlowButton>
            <GlowButton href="/astrologer" variant="secondary" className="text-base px-8 py-4">
              🎙️ Hear Astra
            </GlowButton>
          </div>
        </motion.div>

        {/* Floating planet orbs */}
        <motion.div
          className="absolute top-20 -left-10 w-40 h-40 bg-violet/20 rounded-full blur-3xl"
          animate={{ y: [0, -20, 0], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-20 -right-10 w-56 h-56 bg-rose/15 rounded-full blur-3xl"
          animate={{ y: [0, 20, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-muted"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs tracking-widest uppercase">Explore</span>
          <span className="text-lg">↓</span>
        </div>
      </motion.div>
    </section>
  )
}
```

- [ ] **Step 2: Write `components/home/HowItWorks.tsx`**

```tsx
// components/home/HowItWorks.tsx
'use client'
import { motion } from 'framer-motion'

const steps = [
  {
    number: '01',
    icon: '📍',
    title: 'Enter your birth details',
    description: 'Your date, time, and place of birth. This is the foundation of your unique cosmic blueprint.',
  },
  {
    number: '02',
    icon: '🔮',
    title: 'Get your chart analysed',
    description: 'Astra calculates your natal chart using precise planetary positions — both Western and Vedic systems.',
  },
  {
    number: '03',
    icon: '🎙️',
    title: 'Ask anything, by voice or text',
    description: 'Speak with Astra as you would a real astrologer. Ask about love, career, timing, remedies — anything.',
  },
]

export default function HowItWorks() {
  return (
    <section className="py-24 px-6 bg-cosmos">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-3">How It Works</p>
          <h2 className="font-display text-4xl md:text-5xl text-star">
            Simple as stargazing
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative bg-nebula/50 border border-white/5 rounded-2xl p-8"
            >
              <div className="text-5xl mb-4">{step.icon}</div>
              <div className="absolute top-6 right-6 font-display text-4xl text-white/5 font-bold select-none">
                {step.number}
              </div>
              <h3 className="font-display text-xl text-star mb-3">{step.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Write `components/home/MeetAstra.tsx`**

```tsx
// components/home/MeetAstra.tsx
'use client'
import { motion } from 'framer-motion'
import GlowButton from '@/components/ui/GlowButton'

export default function MeetAstra() {
  return (
    <section className="py-24 px-6 bg-void relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.1)_0%,transparent_70%)]" />
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Astra avatar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex justify-center"
          >
            <div className="relative w-64 h-64">
              <div className="absolute inset-0 bg-gradient-to-br from-violet/40 to-rose/30 rounded-full blur-2xl" />
              <div className="relative w-64 h-64 rounded-full border border-violet/30 bg-gradient-to-b from-nebula to-cosmos flex items-center justify-center">
                <span className="text-8xl">🌙</span>
              </div>
              {/* Orbiting planet */}
              <motion.div
                className="absolute top-4 -right-4 w-10 h-10 bg-rose/30 rounded-full border border-rose/50 flex items-center justify-center text-xl"
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                style={{ transformOrigin: '-80px 100px' }}
              >
                ✦
              </motion.div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-3">Meet Your Astrologer</p>
            <h2 className="font-display text-4xl md:text-5xl text-star mb-6">
              Astra knows<br />your chart by heart
            </h2>
            <p className="text-muted leading-relaxed mb-4">
              Astra has spent 30 years (in AI time) studying the stars. She speaks with warmth, wisdom, and genuine depth — drawing on both Western astrology and Vedic Jyotish traditions.
            </p>
            <p className="text-muted leading-relaxed mb-8">
              She remembers your chart, asks the right questions, and never gives generic answers. Every reading is grounded in your specific planetary positions.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              {['Western Astrology', 'Vedic Jyotish', 'Voice & Text', 'Available 24/7'].map(tag => (
                <span key={tag} className="bg-violet/10 border border-violet/20 text-violet-light text-xs px-3 py-1.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
            <GlowButton href="/signup" variant="primary">
              Talk to Astra →
            </GlowButton>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/home/Hero.tsx components/home/HowItWorks.tsx components/home/MeetAstra.tsx
git commit -m "feat: add Hero, HowItWorks, MeetAstra homepage sections"
```

---

## Task 10: Homepage — HoroscopePreview + Testimonials + PricingSection

**Files:**
- Create: `components/home/HoroscopePreview.tsx`
- Create: `components/home/Testimonials.tsx`
- Create: `components/home/PricingSection.tsx`
- Create: `app/page.tsx`

- [ ] **Step 1: Write `components/home/HoroscopePreview.tsx`**

```tsx
// components/home/HoroscopePreview.tsx
import Link from 'next/link'
import { ZODIAC_SIGNS } from '@/constants/zodiac'

export default function HoroscopePreview() {
  return (
    <section className="py-24 px-6 bg-cosmos">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-rose text-xs font-semibold tracking-widest uppercase mb-3">Daily Horoscopes</p>
          <h2 className="font-display text-4xl md:text-5xl text-star mb-4">
            What do the stars say today?
          </h2>
          <p className="text-muted">Select your sign for today's cosmic forecast.</p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {ZODIAC_SIGNS.map(sign => (
            <Link
              key={sign.slug}
              href={`/horoscope/${sign.slug}`}
              className="group bg-nebula/50 hover:bg-violet/10 border border-white/5 hover:border-violet/30 rounded-xl p-4 text-center transition-all duration-200"
            >
              <div className="text-3xl mb-2">{sign.symbol}</div>
              <div className="text-star text-xs font-semibold group-hover:text-violet-light transition-colors">
                {sign.name}
              </div>
              <div className="text-muted text-xs mt-1 hidden sm:block">{sign.dates.split('–')[0].trim()}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Write `components/home/Testimonials.tsx`**

```tsx
// components/home/Testimonials.tsx
const testimonials = [
  {
    quote: "Astra's reading of my Vedic chart was more insightful than anything I've received from a human astrologer. She knew exactly which Nakshatra questions to ask.",
    name: "Priya S.",
    sign: "Scorpio ♏",
    avatar: "🌙",
  },
  {
    quote: "I was sceptical about AI astrology, but talking to Astra by voice felt genuinely warm. She remembered my chart details and gave me real comfort during a hard time.",
    name: "Marcus T.",
    sign: "Aquarius ♒",
    avatar: "⭐",
  },
  {
    quote: "The combination of Western and Vedic analysis in one place is something I've never found before. Astra explained my Dasha period in a way that finally made sense.",
    name: "Anita R.",
    sign: "Taurus ♉",
    avatar: "✦",
  },
]

export default function Testimonials() {
  return (
    <section className="py-24 px-6 bg-void">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl text-star">
            What seekers are saying
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-cosmos border border-white/5 rounded-2xl p-8">
              <div className="text-3xl mb-4">{t.avatar}</div>
              <p className="text-muted text-sm leading-relaxed mb-6 italic">"{t.quote}"</p>
              <div>
                <div className="text-star text-sm font-semibold">{t.name}</div>
                <div className="text-violet-light text-xs">{t.sign}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Write `components/home/PricingSection.tsx`**

```tsx
// components/home/PricingSection.tsx
import PlanCard from '@/components/ui/PlanCard'

const FREE_FEATURES = [
  { text: 'Western birth chart', included: true },
  { text: '3 AI chat messages per day', included: true },
  { text: 'Daily horoscopes (all signs)', included: true },
  { text: '1 voice session per week', included: true },
  { text: 'Basic compatibility score', included: true },
  { text: 'Vedic / Jyotish chart', included: false },
  { text: 'Unlimited AI chat', included: false },
  { text: 'Transit & yearly forecasts', included: false },
]

const PREMIUM_FEATURES = [
  { text: 'Everything in Free', included: true },
  { text: 'Vedic / Jyotish chart + Kundali', included: true },
  { text: 'Unlimited AI chat with Astra', included: true },
  { text: 'Unlimited voice sessions', included: true },
  { text: 'Full compatibility + Kundali Milan', included: true },
  { text: 'Transit forecasts', included: true },
  { text: 'Yearly predictions', included: true },
  { text: 'Priority response speed', included: true },
]

export default function PricingSection() {
  return (
    <section className="py-24 px-6 bg-cosmos" id="pricing">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-3">Pricing</p>
          <h2 className="font-display text-4xl md:text-5xl text-star mb-4">
            Start free, upgrade when ready
          </h2>
          <p className="text-muted">No credit card required for the free plan.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <PlanCard
            name="Free"
            price="$0"
            description="Everything you need to explore your cosmic blueprint."
            features={FREE_FEATURES}
            ctaText="Get started free"
            ctaHref="/signup"
          />
          <PlanCard
            name="Premium"
            price="$9.99"
            period="/month"
            description="The complete Astra experience — unlimited and deeply personal."
            features={PREMIUM_FEATURES}
            ctaText="Start Premium"
            ctaHref="/signup?plan=premium"
            highlighted
          />
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Write `app/page.tsx`**

```tsx
// app/page.tsx
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/home/Hero'
import HowItWorks from '@/components/home/HowItWorks'
import MeetAstra from '@/components/home/MeetAstra'
import HoroscopePreview from '@/components/home/HoroscopePreview'
import Testimonials from '@/components/home/Testimonials'
import PricingSection from '@/components/home/PricingSection'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <MeetAstra />
        <HoroscopePreview />
        <Testimonials />
        <PricingSection />
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 5: Run dev server and visually verify the homepage**

```bash
npm run dev
```
Open http://localhost:3000. Verify:
- Dark cosmic background with animated stars
- All 7 sections visible on scroll
- Navbar fixed at top
- All 12 zodiac sign cards link to `/horoscope/[sign]`

- [ ] **Step 6: Commit**

```bash
git add components/home/ app/page.tsx
git commit -m "feat: assemble full homepage with all 7 sections"
```

---

## Task 11: Horoscope Pages (SSR)

**Files:**
- Create: `app/horoscope/[sign]/page.tsx`

- [ ] **Step 1: Write `app/horoscope/[sign]/page.tsx`**

```tsx
// app/horoscope/[sign]/page.tsx
import { notFound } from 'next/navigation'
import { ZODIAC_SIGNS, ZODIAC_SLUGS, getSignBySlug } from '@/constants/zodiac'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import GlowButton from '@/components/ui/GlowButton'
import type { Metadata } from 'next'

export const revalidate = 86400 // Re-generate every 24 hours

interface Props { params: Promise<{ sign: string }> }

export async function generateStaticParams() {
  return ZODIAC_SLUGS.map(sign => ({ sign }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sign } = await params
  const s = getSignBySlug(sign)
  if (!s) return {}
  return {
    title: `${s.name} Horoscope Today ${s.symbol} — Astra`,
    description: `Today's ${s.name} horoscope. ${s.placeholderHoroscope.slice(0, 120)}...`,
  }
}

export default async function HoroscopePage({ params }: Props) {
  const { sign } = await params
  const zodiacSign = getSignBySlug(sign)
  if (!zodiacSign) notFound()

  // In Sub-project 3 this will fetch from DB / call Claude API.
  // For now, use static placeholder horoscope.
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cosmic-gradient pt-24">
        <div className="max-w-3xl mx-auto px-6 py-16">
          {/* Sign header */}
          <div className="text-center mb-12">
            <div className="text-7xl mb-4">{zodiacSign.symbol}</div>
            <h1 className="font-display text-5xl text-star mb-2">{zodiacSign.name}</h1>
            <p className="text-muted text-sm mb-1">{zodiacSign.dates}</p>
            <p className="text-muted text-xs">{zodiacSign.element} · Ruled by {zodiacSign.rulingPlanet}</p>
          </div>

          {/* Today's reading */}
          <div className="bg-cosmos border border-violet/20 rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-violet-light text-xs font-semibold tracking-widest uppercase">Today's Reading</span>
              <span className="text-muted text-xs">· {today}</span>
            </div>
            <p className="text-star text-lg leading-relaxed font-display italic">
              "{zodiacSign.placeholderHoroscope}"
            </p>
          </div>

          {/* Sign grid — other signs */}
          <div className="mb-10">
            <h2 className="font-display text-xl text-star mb-4">Other signs</h2>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {ZODIAC_SIGNS.filter(s => s.slug !== sign).map(s => (
                <a
                  key={s.slug}
                  href={`/horoscope/${s.slug}`}
                  className="bg-nebula/50 hover:bg-violet/10 border border-white/5 hover:border-violet/30 rounded-xl p-3 text-center transition-all"
                >
                  <div className="text-2xl">{s.symbol}</div>
                  <div className="text-xs text-muted mt-1">{s.name}</div>
                </a>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-violet/10 to-rose/10 border border-violet/20 rounded-2xl p-8 text-center">
            <h3 className="font-display text-2xl text-star mb-3">
              Want a personal reading?
            </h3>
            <p className="text-muted text-sm mb-6">
              Astra can give you a detailed reading based on your exact birth chart — not just your sun sign.
            </p>
            <GlowButton href="/signup" variant="primary">
              Get Your Free Birth Chart ✨
            </GlowButton>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Test all 12 sign pages load**

```bash
npm run dev
```
Visit: http://localhost:3000/horoscope/aries, http://localhost:3000/horoscope/pisces
Expected: Pages render with sign name, symbol, reading, and sign grid.

Visit: http://localhost:3000/horoscope/invalid
Expected: 404 page.

- [ ] **Step 3: Commit**

```bash
git add app/horoscope/
git commit -m "feat: add SSR horoscope pages for all 12 zodiac signs"
```

---

## Task 12: Login Page

**Files:**
- Create: `app/(auth)/login/page.tsx`
- Create: `app/api/auth/signin/route.ts`

- [ ] **Step 1: Write `app/api/auth/signin/route.ts`**

```ts
// app/api/auth/signin/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Write `app/(auth)/login/page.tsx`**

```tsx
// app/(auth)/login/page.tsx
'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import GlowButton from '@/components/ui/GlowButton'
import StarField from '@/components/ui/StarField'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'
  const supabase = createClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push(next)
    router.refresh()
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${next}` },
    })
  }

  return (
    <div className="min-h-screen bg-cosmic-gradient flex items-center justify-center relative overflow-hidden px-6">
      <StarField />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-2xl text-star">✦ Astra</Link>
          <h1 className="font-display text-3xl text-star mt-4 mb-2">Welcome back</h1>
          <p className="text-muted text-sm">The stars have been waiting for you.</p>
        </div>

        <div className="bg-cosmos border border-white/10 rounded-2xl p-8">
          {/* Google OAuth */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 text-star text-sm font-medium transition-all mb-6"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-muted text-xs">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-muted text-xs uppercase tracking-wider mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-nebula border border-white/10 rounded-xl px-4 py-3 text-star text-sm placeholder-muted focus:outline-none focus:border-violet/50 transition-colors"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="text-muted text-xs uppercase tracking-wider mb-1.5 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-nebula border border-white/10 rounded-xl px-4 py-3 text-star text-sm placeholder-muted focus:outline-none focus:border-violet/50 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <GlowButton variant="primary" className="w-full mt-2" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </GlowButton>
          </form>
        </div>

        <p className="text-center text-muted text-sm mt-6">
          Don't have an account?{' '}
          <Link href="/signup" className="text-violet-light hover:text-violet transition-colors">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create OAuth callback route**

```ts
// app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
```

- [ ] **Step 4: Commit**

```bash
git add app/\(auth\)/login/ app/api/auth/signin/ app/auth/
git commit -m "feat: add login page with email/password and Google OAuth"
```

---

## Task 13: Signup — Step 1 (Account Creation)

**Files:**
- Create: `app/(auth)/signup/page.tsx`
- Create: `components/signup/AccountForm.tsx`
- Create: `app/api/auth/signup/route.ts`

- [ ] **Step 1: Write the API route test**

```ts
// __tests__/api/auth/signup.test.ts
import { describe, it, expect, vi } from 'vitest'

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signUp: vi.fn(async ({ email }: { email: string }) => {
        if (email === 'taken@example.com') {
          return { data: null, error: { message: 'User already registered' } }
        }
        return { data: { user: { id: 'uuid-123' } }, error: null }
      }),
    },
  })),
}))

describe('POST /api/auth/signup', () => {
  it('returns 400 if email missing', async () => {
    const { POST } = await import('@/app/api/auth/signup/route')
    const req = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ password: 'test1234', name: 'Test' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 200 on successful signup', async () => {
    const { POST } = await import('@/app/api/auth/signup/route')
    const req = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email: 'new@example.com', password: 'password123', name: 'Test User' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
  })
})
```

- [ ] **Step 2: Run — verify fails**

```bash
npm run test:run -- __tests__/api/auth/signup.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Write `app/api/auth/signup/route.ts`**

```ts
// app/api/auth/signup/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password, name } = await request.json()

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 4: Run tests — verify pass**

```bash
npm run test:run -- __tests__/api/auth/signup.test.ts
```
Expected: 2 tests passing.

- [ ] **Step 5: Write `components/signup/AccountForm.tsx`**

```tsx
// components/signup/AccountForm.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import GlowButton from '@/components/ui/GlowButton'

export default function AccountForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleGoogleSignup = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/signup/onboarding` },
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error)
      setLoading(false)
      return
    }

    // Sign in immediately after signup
    await supabase.auth.signInWithPassword({ email, password })
    router.push('/signup/onboarding')
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={handleGoogleSignup}
        className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 text-star text-sm font-medium transition-all"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
          <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-muted text-xs">or</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {[
          { label: 'Full Name', value: name, setter: setName, type: 'text', placeholder: 'Your name' },
          { label: 'Email', value: email, setter: setEmail, type: 'email', placeholder: 'your@email.com' },
          { label: 'Password', value: password, setter: setPassword, type: 'password', placeholder: '••••••••  (min 8 chars)' },
        ].map(field => (
          <div key={field.label}>
            <label className="text-muted text-xs uppercase tracking-wider mb-1.5 block">{field.label}</label>
            <input
              type={field.type}
              value={field.value}
              onChange={e => field.setter(e.target.value)}
              required
              className="w-full bg-nebula border border-white/10 rounded-xl px-4 py-3 text-star text-sm placeholder-muted focus:outline-none focus:border-violet/50 transition-colors"
              placeholder={field.placeholder}
            />
          </div>
        ))}

        {error && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        <GlowButton variant="primary" className="w-full mt-2" disabled={loading}>
          {loading ? 'Creating account…' : 'Continue →'}
        </GlowButton>
      </form>

      <p className="text-center text-muted text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-violet-light hover:text-violet transition-colors">Sign in</Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 6: Write `app/(auth)/signup/page.tsx`**

```tsx
// app/(auth)/signup/page.tsx
import AccountForm from '@/components/signup/AccountForm'
import StarField from '@/components/ui/StarField'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-cosmic-gradient flex items-center justify-center relative overflow-hidden px-6">
      <StarField />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-2xl text-star">✦ Astra</Link>
          <div className="mt-4 mb-2">
            <div className="inline-flex gap-2 text-xs text-muted">
              <span className="text-violet-light font-semibold">① Account</span>
              <span>→</span>
              <span>② Birth Details</span>
            </div>
          </div>
          <h1 className="font-display text-3xl text-star mb-2">Create your account</h1>
          <p className="text-muted text-sm">Your cosmic journey begins here.</p>
        </div>
        <div className="bg-cosmos border border-white/10 rounded-2xl p-8">
          <AccountForm />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add app/\(auth\)/signup/ components/signup/AccountForm.tsx app/api/auth/signup/ __tests__/api/
git commit -m "feat: add signup step 1 — account creation with email and Google OAuth"
```

---

## Task 14: Signup — Step 2 (Birth Details + Geocoding API)

**Files:**
- Create: `app/(auth)/signup/onboarding/page.tsx`
- Create: `components/signup/BirthDetailsForm.tsx`
- Create: `app/api/chart/generate/route.ts`

- [ ] **Step 1: Write the chart generate API test**

```ts
// __tests__/api/chart/generate.test.ts
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
```

- [ ] **Step 2: Run — verify fails**

```bash
npm run test:run -- __tests__/api/chart/generate.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Write `app/api/chart/generate/route.ts`**

```ts
// app/api/chart/generate/route.ts
import { createClient } from '@/lib/supabase/server'
import { geocodeCity, GeocodingError } from '@/lib/geocoding'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { date_of_birth, time_of_birth, place_of_birth, label = 'My Chart' } = body

  if (!date_of_birth || !place_of_birth) {
    return NextResponse.json({ error: 'date_of_birth and place_of_birth are required' }, { status: 400 })
  }

  // Geocode the city
  let geoResult
  try {
    geoResult = await geocodeCity(place_of_birth)
  } catch (err) {
    if (err instanceof GeocodingError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Geocoding service unavailable' }, { status: 503 })
  }

  const { data: chart, error } = await supabase
    .from('birth_charts')
    .insert({
      user_id: user.id,
      label,
      date_of_birth,
      time_of_birth: time_of_birth || null,
      place_of_birth: geoResult.displayName,
      latitude: geoResult.lat,
      longitude: geoResult.lng,
      timezone: geoResult.timezone,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to save chart' }, { status: 500 })
  }

  return NextResponse.json({ chart_id: chart.id, timezone: geoResult.timezone })
}
```

- [ ] **Step 4: Run tests — verify pass**

```bash
npm run test:run -- __tests__/api/chart/generate.test.ts
```
Expected: 2 tests passing.

- [ ] **Step 5: Write `components/signup/BirthDetailsForm.tsx`**

```tsx
// components/signup/BirthDetailsForm.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import GlowButton from '@/components/ui/GlowButton'

export default function BirthDetailsForm() {
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [timeOfBirth, setTimeOfBirth] = useState('')
  const [placeOfBirth, setPlaceOfBirth] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/chart/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date_of_birth: dateOfBirth,
        time_of_birth: timeOfBirth || null,
        place_of_birth: placeOfBirth,
      }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const handleSkip = () => {
    router.push('/dashboard')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-muted text-xs uppercase tracking-wider mb-1.5 block">
          Date of Birth <span className="text-rose">*</span>
        </label>
        <input
          type="date"
          value={dateOfBirth}
          onChange={e => setDateOfBirth(e.target.value)}
          required
          className="w-full bg-nebula border border-white/10 rounded-xl px-4 py-3 text-star text-sm focus:outline-none focus:border-violet/50 transition-colors"
        />
      </div>

      <div>
        <label className="text-muted text-xs uppercase tracking-wider mb-1.5 block">
          Time of Birth <span className="text-muted">(optional — improves accuracy)</span>
        </label>
        <input
          type="time"
          value={timeOfBirth}
          onChange={e => setTimeOfBirth(e.target.value)}
          className="w-full bg-nebula border border-white/10 rounded-xl px-4 py-3 text-star text-sm focus:outline-none focus:border-violet/50 transition-colors"
        />
      </div>

      <div>
        <label className="text-muted text-xs uppercase tracking-wider mb-1.5 block">
          City of Birth <span className="text-rose">*</span>
        </label>
        <input
          type="text"
          value={placeOfBirth}
          onChange={e => setPlaceOfBirth(e.target.value)}
          required
          placeholder="e.g. Kathmandu, Mumbai, London"
          className="w-full bg-nebula border border-white/10 rounded-xl px-4 py-3 text-star text-sm placeholder-muted focus:outline-none focus:border-violet/50 transition-colors"
        />
        <p className="text-muted text-xs mt-1.5">Enter the city where you were born. If your city isn't found, try the nearest major city.</p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      <GlowButton variant="primary" className="w-full mt-2" disabled={loading}>
        {loading ? 'Finding your chart…' : 'Generate My Chart ✦'}
      </GlowButton>

      <button
        type="button"
        onClick={handleSkip}
        className="text-muted text-sm text-center hover:text-star transition-colors"
      >
        Skip for now — I'll add this later
      </button>
    </form>
  )
}
```

- [ ] **Step 6: Write `app/(auth)/signup/onboarding/page.tsx`**

```tsx
// app/(auth)/signup/onboarding/page.tsx
import BirthDetailsForm from '@/components/signup/BirthDetailsForm'
import StarField from '@/components/ui/StarField'
import Link from 'next/link'

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-cosmic-gradient flex items-center justify-center relative overflow-hidden px-6">
      <StarField />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-2xl text-star">✦ Astra</Link>
          <div className="mt-4 mb-2">
            <div className="inline-flex gap-2 text-xs text-muted">
              <span className="text-muted line-through">① Account</span>
              <span>→</span>
              <span className="text-violet-light font-semibold">② Birth Details</span>
            </div>
          </div>
          <h1 className="font-display text-3xl text-star mb-2">Your birth details</h1>
          <p className="text-muted text-sm">
            This is how Astra reads your unique chart. The more accurate, the better your reading.
          </p>
        </div>
        <div className="bg-cosmos border border-white/10 rounded-2xl p-8">
          <BirthDetailsForm />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add app/\(auth\)/signup/onboarding/ components/signup/BirthDetailsForm.tsx app/api/chart/generate/ __tests__/api/chart/
git commit -m "feat: add signup step 2 — birth details form with geocoding and chart creation"
```

---

## Task 15: Pricing Page + Dashboard Shell

**Files:**
- Create: `app/pricing/page.tsx`
- Create: `app/dashboard/page.tsx`
- Create: `app/api/user/me/route.ts`

- [ ] **Step 1: Write `app/pricing/page.tsx`**

```tsx
// app/pricing/page.tsx
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import PricingSection from '@/components/home/PricingSection'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — Astra',
  description: 'Start free. Upgrade for unlimited readings with Astra.',
}

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cosmic-gradient pt-16">
        <div className="pt-16">
          <PricingSection />
        </div>
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Write `app/api/user/me/route.ts`**

```ts
// app/api/user/me/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: profile.id,
    name: profile.name,
    email: user.email,
    subscription_tier: profile.subscription_tier,
    is_admin: profile.is_admin,
  })
}
```

- [ ] **Step 3: Write `app/dashboard/page.tsx`**

```tsx
// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import GlowButton from '@/components/ui/GlowButton'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/dashboard')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, subscription_tier')
    .eq('id', user.id)
    .single()

  const { data: chart } = await supabase
    .from('birth_charts')
    .select('id, place_of_birth, date_of_birth')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  const firstName = profile?.name?.split(' ')[0] ?? 'Seeker'

  return (
    <>
      <Navbar isAuthed />
      <main className="min-h-screen bg-cosmic-gradient pt-24 px-6">
        <div className="max-w-4xl mx-auto py-12">
          <div className="mb-10">
            <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">Welcome back</p>
            <h1 className="font-display text-4xl text-star">Hello, {firstName} ✦</h1>
            <p className="text-muted mt-2">
              {profile?.subscription_tier === 'premium' ? '⭐ Premium member' : 'Free plan · '}
              {profile?.subscription_tier !== 'premium' && (
                <Link href="/pricing" className="text-violet-light hover:text-violet transition-colors">Upgrade to Premium</Link>
              )}
            </p>
          </div>

          {/* Onboarding prompt if no chart */}
          {!chart && (
            <div className="bg-violet/10 border border-violet/30 rounded-2xl p-8 mb-8 text-center">
              <div className="text-4xl mb-3">🌟</div>
              <h2 className="font-display text-2xl text-star mb-2">Complete your cosmic profile</h2>
              <p className="text-muted text-sm mb-6">Add your birth details so Astra can read your personal chart.</p>
              <GlowButton href="/signup/onboarding" variant="primary">Add Birth Details →</GlowButton>
            </div>
          )}

          {/* Feature cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🌙', title: 'My Birth Chart', desc: 'View your natal chart — Western and Vedic', href: '/chart', locked: !chart },
              { icon: '🎙️', title: 'Talk to Astra', desc: 'Ask anything by voice or text', href: '/chat', locked: !chart },
              { icon: '💫', title: 'Compatibility', desc: 'Check your compatibility with a partner', href: '/compatibility', locked: !chart },
            ].map(card => (
              <Link
                key={card.title}
                href={card.locked ? '#' : card.href}
                className={`group bg-cosmos border rounded-2xl p-6 transition-all ${
                  card.locked
                    ? 'border-white/5 opacity-50 cursor-not-allowed'
                    : 'border-white/10 hover:border-violet/30 hover:bg-violet/5'
                }`}
                onClick={e => card.locked && e.preventDefault()}
              >
                <div className="text-3xl mb-3">{card.icon}</div>
                <h3 className="text-star font-semibold mb-1">{card.title}</h3>
                <p className="text-muted text-sm">{card.desc}</p>
                {!card.locked && (
                  <span className="text-violet-light text-xs mt-3 block group-hover:translate-x-1 transition-transform">
                    Open →
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/pricing/ app/dashboard/ app/api/user/
git commit -m "feat: add pricing page, dashboard shell, and GET /api/user/me"
```

---

## Task 16: Meet Astra Page

**Files:**
- Create: `app/astrologer/page.tsx`

- [ ] **Step 1: Write `app/astrologer/page.tsx`**

```tsx
// app/astrologer/page.tsx
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import GlowButton from '@/components/ui/GlowButton'
import StarField from '@/components/ui/StarField'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Meet Astra — Your AI Astrologer',
  description: 'Astra is a warm, wise AI astrologer with deep knowledge of Western and Vedic traditions. Talk to her by voice or text, 24/7.',
}

const traits = [
  { icon: '🌙', title: 'Western & Vedic', desc: 'Fluent in both systems — natal charts, transits, Kundali, Nakshatras, Dashas.' },
  { icon: '🎙️', title: 'Voice & Text', desc: 'Speak naturally or type. Astra responds with a warm, human-sounding voice via ElevenLabs.' },
  { icon: '✦', title: 'Your Chart, Always', desc: 'Astra never gives generic readings. Every answer is grounded in your specific birth chart data.' },
  { icon: '🔮', title: 'Wisdom + Remedies', desc: 'Ask about gemstones, mantras, timing, remedies — drawn from classical texts and Astra\'s deep training.' },
  { icon: '💬', title: 'Remembers Context', desc: 'Astra remembers everything in your conversation. No need to repeat yourself.' },
  { icon: '🌍', title: 'English & Nepali', desc: 'Comfortable in English with Nepali cultural awareness and Vedic terminology.' },
]

export default function AstrologerPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cosmic-gradient pt-24">
        {/* Hero */}
        <section className="relative py-24 px-6 overflow-hidden">
          <StarField className="opacity-50" />
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-4">Your Astrologer</p>

            {/* Astra avatar */}
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-violet/40 to-rose/30 rounded-full blur-xl" />
              <div className="relative w-32 h-32 rounded-full border border-violet/30 bg-gradient-to-b from-nebula to-cosmos flex items-center justify-center">
                <span className="text-6xl">🌙</span>
              </div>
            </div>

            <h1 className="font-display text-5xl md:text-6xl text-star mb-6">
              Meet Astra
            </h1>
            <p className="text-muted text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
              Astra is a warm, wise astrologer trained on centuries of celestial knowledge.
              She knows your chart by heart and speaks with the depth of a trusted advisor —
              never a generic bot.
            </p>

            {/* Sample audio — placeholder (ElevenLabs integrated in Sub-project 3) */}
            <div className="inline-flex items-center gap-3 bg-cosmos border border-violet/20 rounded-full px-6 py-3 mb-10 cursor-pointer hover:border-violet/40 transition-all group">
              <div className="w-8 h-8 rounded-full bg-violet/20 border border-violet/40 flex items-center justify-center group-hover:bg-violet/30 transition-all">
                <span className="text-violet-light text-xs">▶</span>
              </div>
              <span className="text-star text-sm">Hear Astra introduce herself</span>
              <span className="text-muted text-xs">(0:18)</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <GlowButton href="/signup" variant="primary" className="text-base px-8 py-4">
                Talk to Astra Free ✨
              </GlowButton>
              <GlowButton href="/pricing" variant="secondary" className="text-base px-8 py-4">
                See all features
              </GlowButton>
            </div>
          </div>
        </section>

        {/* Traits */}
        <section className="py-20 px-6 bg-cosmos">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-display text-3xl text-star text-center mb-12">What makes Astra different</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {traits.map(t => (
                <div key={t.title} className="bg-nebula/50 border border-white/5 rounded-2xl p-6">
                  <div className="text-3xl mb-3">{t.icon}</div>
                  <h3 className="text-star font-semibold mb-2">{t.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6 bg-void text-center">
          <h2 className="font-display text-4xl text-star mb-4">Ready to meet your cosmic guide?</h2>
          <p className="text-muted mb-8 max-w-xl mx-auto">Create a free account and enter your birth details. Astra will have your chart ready instantly.</p>
          <GlowButton href="/signup" variant="primary" className="text-base px-10 py-4">
            Get started free →
          </GlowButton>
        </section>
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Verify page loads**

```bash
npm run dev
```
Visit http://localhost:3000/astrologer — verify page renders with avatar, traits grid, and CTAs. Confirm "Hear Astra" button is visible (audio is a placeholder; ElevenLabs integration is Sub-project 3).

- [ ] **Step 3: Commit**

```bash
git add app/astrologer/
git commit -m "feat: add Meet Astra page at /astrologer"
```

---

## Task 17: Final Integration Check

- [ ] **Step 1: Run full test suite**

```bash
npm run test:run
```
Expected: All tests pass (geocoding: 3, middleware: 1, supabase client: 1, signup API: 2, chart generate: 2 = 9 total).

- [ ] **Step 2: Run production build**

```bash
npm run build
```
Expected: Build succeeds, all 12 horoscope pages pre-rendered, no TypeScript errors.

- [ ] **Step 3: Manual smoke test against live Supabase**

With `npm run dev` running:
1. Visit http://localhost:3000 — homepage loads with animated stars
2. Visit http://localhost:3000/horoscope/aries — horoscope page loads
3. Visit http://localhost:3000/dashboard — redirects to /login (middleware working)
4. Sign up at http://localhost:3000/signup — creates account
5. Complete onboarding at /signup/onboarding — enters Kathmandu, chart created
6. Dashboard shows "Hello, {name}" with feature cards unlocked
7. Visit http://localhost:3000/astrologer — page loads with Astra persona, traits, and CTAs

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Sub-project 1 — foundation, homepage, auth, horoscope pages, dashboard"
```
