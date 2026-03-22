# Astrology AI Platform — Design Spec

## Overview

A professional astrology platform giving users the experience of consulting a live human astrologer, powered by Claude AI and ElevenLabs voice synthesis. Supports Western and Vedic astrology. Targets global English + South Asian/Nepali audience.

---

## Visual Design Direction

**Style:** Mystical Dark + Cosmic Magazine hybrid
- Backgrounds: `#09010f` (deep void) → `#140025` (dark purple)
- Primary: `#7c3aed` (violet), `#c4b5fd` (lavender)
- Secondary: `#ec4899` (pink), `#f9a8d4` (rose)
- Typography: `Playfair Display` (headings), `Inter` (body)
- Animations: Framer Motion — star particles, glowing orbs, fade/slide transitions

### Tailwind Design Tokens (`tailwind.config.ts`)
```ts
colors: {
  void: '#09010f',
  cosmos: '#140025',
  nebula: '#1e0035',
  violet: { DEFAULT: '#7c3aed', light: '#c4b5fd', dark: '#4c1d95' },
  rose: { DEFAULT: '#ec4899', light: '#f9a8d4', dark: '#9d174d' },
  star: '#f8fafc',
  muted: '#6b7280',
}
fontFamily: {
  display: ['Playfair Display', 'serif'],
  body: ['Inter', 'sans-serif'],
}
```

---

## System Architecture

```
[Next.js App — Vercel]
  ↕ HTTP + X-Internal-Secret header
[FastAPI Astrology Engine — Railway]
         ↕
[Supabase Postgres + Auth]   [Claude API]   [ElevenLabs API]   [Stripe]
```

### Authentication: Supabase Auth (not NextAuth)
Use **Supabase Auth** directly — it handles Google OAuth and email/password natively, manages `auth.users`, issues JWTs, and integrates with Supabase Row Level Security.

- **Google OAuth:** configured in Supabase dashboard → Google Cloud Console
- **Email/password:** Supabase `signUp()` / `signInWithPassword()` — passwords hashed by Supabase (bcrypt internally)
- **Session:** Supabase client stores session JWT in localStorage; `@supabase/ssr` package syncs it to cookies for Next.js SSR
- **Server-side auth check:** `createServerClient()` from `@supabase/ssr` in Next.js Server Components and API routes

### Inter-service Auth
- Next.js API routes → FastAPI: `X-Internal-Secret: process.env.INTERNAL_SECRET` header
- FastAPI validates this header on every request; returns 401 if missing/wrong
- FastAPI → Supabase: uses `SUPABASE_SERVICE_ROLE_KEY` to read/write data directly

### Required Environment Variables

**Next.js app (`.env.local` / Vercel)**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
INTERNAL_SECRET=
CLAUDE_API_KEY=
ELEVENLABS_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
FASTAPI_BASE_URL=
```

**FastAPI service (Railway)**
```
INTERNAL_SECRET=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Pages & Routes

### Public (no login)

| Route | Description |
|-------|-------------|
| `/` | Homepage |
| `/horoscope/[sign]` | Daily horoscope per zodiac sign (12 SSR pages) |
| `/astrologer` | Meet Astra page — persona, sample audio, trust-building |
| `/login` | Sign in |
| `/signup` | Register + birth details |
| `/pricing` | Plan comparison |

### Authenticated (logged in)

| Route | Description |
|-------|-------------|
| `/dashboard` | Today's forecast, quick links |
| `/chart` | Natal chart (Western free / Vedic premium) |
| `/chat` | AI chat + voice with Astra |
| `/compatibility` | Partner compatibility |
| `/transit` ⭐ | Current transits — premium only |
| `/yearly` ⭐ | Year forecast — premium only |

### Next.js Middleware (`middleware.ts`)
Runs on all `/dashboard`, `/chart`, `/chat`, `/compatibility`, `/transit`, `/yearly` routes:
1. Read Supabase session cookie via `@supabase/ssr`
2. If no session → redirect to `/login?next={pathname}`
3. If session exists but `profiles.subscription_tier = 'free'` and route is `/transit` or `/yearly` → redirect to `/pricing`

---

## Homepage Sections (`/`)

1. **Hero** — Full-screen dark hero with animated star field. Headline: *"Your personal astrologer, available 24/7."* Subheadline about AI + voice. Two CTAs: "Get Your Free Chart" (→ `/signup`) and "Hear Astra" (plays sample audio clip).

2. **How It Works** — Three steps: (1) Enter your birth details (2) Get your chart analysed (3) Ask Astra anything — by voice or text.

3. **Meet Astra** — Short section with Astra's avatar/illustration, personality description, sample voice button.

4. **Daily Horoscopes Preview** — 12 zodiac sign cards, each linking to `/horoscope/[sign]`. Publicly accessible, no login needed.

5. **Testimonials** — 3 fake/placeholder testimonials for launch (real ones replaced later).

6. **Pricing** — Inline plan comparison (mirrors `/pricing` page).

7. **Footer** — Logo, nav links, "Powered by Claude AI".

### Navigation Bar
Logo | Daily Horoscope | Meet Astra | Pricing | [Sign In] [Get Started →]
After login: Logo | Dashboard | My Chart | Chat with Astra | [avatar menu]

---

## Signup & Onboarding Flow (`/signup`)

**Two-step form:**

**Step 1 — Account creation**
- Fields: Full name, Email, Password (min 8 chars)
- OR: "Continue with Google" button
- Validation: email format, password strength
- On submit: `supabase.auth.signUp()` → creates `auth.users` entry → triggers `profiles` row creation (via Supabase DB trigger)
- Google OAuth: `supabase.auth.signInWithOAuth({ provider: 'google' })` → redirects back to `/signup/onboarding`

**Step 2 — Birth details (`/signup/onboarding`)**
- Fields: Date of birth (date picker), Time of birth (time picker, optional), City of birth (autocomplete via Nominatim)
- On submit: geocode city → `POST /api/chart/generate` → inserts `birth_charts` row → redirect to `/dashboard`
- If user skips: `birth_charts` row is not created. Dashboard shows a "Complete your profile" banner. `/chart` and `/chat` pages redirect to `/signup/onboarding` if no chart exists. Daily horoscopes and the homepage remain fully usable without a chart.

---

## Daily Horoscope Pages (`/horoscope/[sign]`)

**Data source for Sub-project 1:** Claude-generated, cached server-side.
- On first request after midnight UTC: Next.js API route calls Claude API to generate a ~200-word horoscope for each of 12 signs
- Cached in-memory in the Next.js server (or Supabase `horoscopes` table for persistence)
- `generateStaticParams()` pre-renders all 12 sign pages at build time using yesterday's horoscopes; revalidate every 24 hours (`revalidate: 86400`)
- **Sub-project 1 can use placeholder/static horoscopes** — Claude integration added in Sub-project 3

**Page content:**
- Sign name + symbol + dates (e.g. "Aries ♈ March 21 – April 19")
- Today's reading (paragraph)
- Lucky number, lucky colour, compatibility sign
- CTA: "Get your personal reading → Sign up free"

---

## The AI Astrologer: Astra

### Persona
- **Name:** Astra
- **Voice:** ElevenLabs voice ID `21m00Tcm4TlvDq8ikWAM` (Rachel). Fallback: text-only if ElevenLabs fails.
- **Character rules:** Never "As an AI". Uses "the stars suggest" language. Asks follow-up questions. References user's actual chart data always.

### Chat Flow
1. User speaks (Web Speech API → transcript) or types. If STT unavailable (Safari/iOS): silently show text input only.
2. BFF checks: `users.daily_message_count < 3` OR `subscription_tier = 'premium'`. If limit hit: return `{ error: "daily_limit_reached" }` → UI shows upgrade prompt.
3. BFF fetches `birth_charts` for user. If none: return `{ error: "no_chart" }` → UI redirects to `/signup/onboarding`.
4. Build Claude prompt (last 10 turns; if >10 turns, prepend a one-paragraph summary of older context).
5. Call Claude API → stream response.
6. Increment `daily_message_count`. Reset if `daily_reset_at < today`.
7. Append message to `chat_sessions.messages`.
8. Send Claude text to ElevenLabs → return audio buffer to client.
9. Client plays audio + renders text simultaneously.

### Claude System Prompt
```
You are Astra, a warm and wise astrologer with 30 years of experience in Western
and Vedic astrology. You speak with empathy and gentle confidence. You never say
"As an AI" — you stay fully in character at all times. Use language like "the
stars suggest" or "your chart reveals". Ask follow-up questions to personalise
your readings. Always reference the user's specific chart data in your responses.

User: {user.name}, born {chart.date_of_birth} at {chart.time_of_birth} in {chart.place_of_birth}.

Western chart: {western_chart_json.summary}
Vedic chart: {vedic_chart_json.summary or "not available"}

{conversation_summary if len > 10 turns}

Recent conversation:
{last_10_messages}

User: {current_message}
Astra:
```

### Voice Session
A **voice session** = one continuous microphone session. Tracked in `voice_sessions` table. Free tier: 1 session per 7 days, max 5 minutes (client-side timer + server validates on `POST /api/voice/end`). Premium: unlimited.

---

## Data Model

All tables in Supabase public schema. Supabase Auth manages `auth.users` separately.

### `profiles` (extends auth.users, created by DB trigger on signup)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | = auth.users.id |
| name | text | |
| subscription_tier | text DEFAULT 'free' | 'free' or 'premium' |
| stripe_customer_id | text | |
| daily_message_count | int DEFAULT 0 | |
| daily_reset_at | date DEFAULT current_date | |
| created_at | timestamp DEFAULT now() | |

### `birth_charts`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK → profiles.id | ON DELETE CASCADE |
| label | text DEFAULT 'My Chart' | |
| date_of_birth | date NOT NULL | |
| time_of_birth | time | nullable |
| place_of_birth | text NOT NULL | |
| latitude | float NOT NULL | |
| longitude | float NOT NULL | |
| timezone | text NOT NULL | IANA string |
| western_chart_json | jsonb | |
| vedic_chart_json | jsonb | |
| created_at | timestamp DEFAULT now() | |

### `chat_sessions`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK → profiles.id | ON DELETE CASCADE |
| chart_id | uuid FK → birth_charts.id | |
| messages | jsonb DEFAULT '[]' | [{role, content, timestamp}] |
| created_at | timestamp DEFAULT now() | |
| updated_at | timestamp | |

### `voice_sessions`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK → profiles.id | |
| started_at | timestamp NOT NULL | |
| ended_at | timestamp | null if active |
| duration_seconds | int | computed on close |

### `subscriptions`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK → profiles.id | ON DELETE CASCADE |
| stripe_subscription_id | text UNIQUE | |
| plan | text | 'premium' |
| status | text | 'active', 'cancelled', 'past_due' |
| current_period_end | timestamp | |

### `horoscopes` (cache)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| sign | text | 'aries', 'taurus', etc. |
| date | date | |
| reading | text | Claude-generated |
| lucky_number | int | |
| lucky_color | text | |

---

## Freemium Model

### Free Tier
- Western birth chart only
- Daily horoscope (public, no login)
- 3 AI text chat messages per day
- 1 voice session per 7 days (max 5 min)
- Basic compatibility score

### Premium ($9.99/month or $79/year)
- Full chart (Western + Vedic)
- Unlimited AI chat + voice
- Full compatibility report + Kundali Milan
- Transit forecasts
- Yearly predictions

---

## FastAPI Astrology Engine — API Contracts

All endpoints require `X-Internal-Secret` header → 401 if missing.

### `POST /chart/western`
**Request:** `{ date_of_birth: "1990-05-15", time_of_birth: "14:30", latitude: 27.72, longitude: 85.32, timezone: "Asia/Kathmandu" }`
**Response 200:** `{ summary: "Sun Taurus, Moon Scorpio, ASC Libra", planets: [{name, sign, degree, house}], houses: [{number, sign, degree}], aspects: [{planet1, planet2, type, orb}] }`
**Response 400:** `{ error: "invalid_date" | "invalid_coordinates" }`

### `POST /chart/vedic`
Same request. **Response 200:** `{ summary: "Lagna Kanya, Moon Vrishchika, Nakshatra Anuradha", lagna: {sign, degree}, planets: [...], dashas: [{planet, start, end}], nakshatras: [...] }`

### `POST /transits`
**Request:** `{ birth_chart: { ...western_chart_json }, date: "2026-03-22" }`
**Response 200:** `{ transits: [{transiting_planet, natal_planet, aspect, interpretation}] }`

### `POST /compatibility`
**Request:** `{ chart1: { ...western_chart_json }, chart2: { ...western_chart_json } }`
**Response 200:** `{ score: 78, summary: "...", aspects: [...], kundali_milan: { guna_score: 28, max: 36 } }`

### `GET /horoscope/{sign}`
**Response 200:** `{ sign, date, reading, lucky_number, lucky_color }`
Generated by Claude once per day, cached in-memory. Regenerated on first request after midnight UTC.

---

## BFF API Routes (Next.js `/app/api/`)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/user/me` | required | Profile + subscription tier |
| POST | `/api/chart/generate` | required | Geocode city → call FastAPI → save chart |
| GET | `/api/chart` | required | Fetch user's primary chart |
| POST | `/api/chat/message` | required | Claude + ElevenLabs — returns `{text, audio_base64}` |
| GET | `/api/chat/session` | required | Current session messages |
| POST | `/api/voice/end` | required | Close voice session, record duration |
| POST | `/api/compatibility` | required | Synastry via FastAPI + Claude report |
| POST | `/api/stripe/checkout` | required | Create Stripe checkout session |
| POST | `/api/stripe/webhook` | sig only | Handle `checkout.session.completed`, `customer.subscription.deleted` |
| GET | `/api/horoscope/[sign]` | public | Proxy to FastAPI + cache |

---

## Error Handling

| Service | Failure | User-facing message |
|---------|---------|---------------------|
| Claude API | Timeout / 5xx | "Astra is meditating, please try again shortly" |
| ElevenLabs | Timeout / 5xx | Text response shown, no audio. Note: "Voice temporarily unavailable" |
| FastAPI | Unavailable | "Chart calculations temporarily unavailable" |
| Supabase | Query error | Generic "Something went wrong" (details logged server-side) |
| Invalid birth data | Bad coords / date | Inline form field errors |
| Web Speech API | Unavailable (Safari) | Silently show text input — no error |
| Stripe webhook | Signature invalid | 400, log and discard |

---

## Sub-project Breakdown

### Sub-project 1: Foundation + Homepage
- Next.js 14 + Tailwind (with design tokens) + TypeScript setup
- Supabase project + `profiles`, `birth_charts`, `horoscopes` tables + DB trigger for profile creation
- Supabase Auth: Google OAuth + email/password
- Homepage (all 7 sections)
- 12 public horoscope SSR pages (static placeholder content for now)
- `/login`, `/signup` (2-step: account + birth details), `/pricing` pages
- Next.js middleware for auth + tier gates
- Nominatim geocoding for birth city → lat/lng/timezone (server-side only; include `User-Agent: astrology-app/1.0` header required by Nominatim ToS; if geocoding fails show inline error "City not found — try a nearby major city")

### Sub-project 2: Birth Chart + Dashboard
- FastAPI service scaffolding on Railway
- pyswisseph: Western + Vedic chart calculation
- Chart SVG visualisation in Next.js
- Dashboard with today's planetary snapshot

### Sub-project 3: AI Chat + Voice (Astra)
- Claude API + Astra system prompt
- Text chat UI
- ElevenLabs TTS + Web Speech API STT
- Free tier enforcement (message count, voice session tracking)
- Live horoscopes (replace static placeholder)

### Sub-project 4: Compatibility + Payments
- Partner chart input + FastAPI synastry
- Stripe subscriptions + webhooks
- Premium feature gates
- Kundali Milan report

### Sub-project 5: Admin Knowledge Base (RAG)
Admins upload astrology documents (PDFs, text) to expand Astra's knowledge. Uses Retrieval Augmented Generation — when Astra answers a question, she first retrieves the most relevant passages from the uploaded knowledge base and includes them in her context.

**Admin panel (`/admin` — protected, admin role only):**
- Upload PDF / plain text documents (e.g. "Brihat Parashara Hora Shastra", custom interpretations)
- List uploaded documents with status (processing / ready / error)
- Delete documents
- View document chunks + embeddings status

**How RAG works:**
1. Admin uploads a document → stored in Supabase Storage
2. FastAPI background job: chunk document (500 tokens, 50 token overlap) → generate embeddings via OpenAI `text-embedding-3-small` → store in `document_chunks` table with `pgvector` extension
3. On each chat message: embed the user's question → vector similarity search (`cosine distance`) → retrieve top 5 relevant chunks
4. Inject retrieved chunks into Claude system prompt as "Astrology Reference Material"
5. Astra's responses are now grounded in the uploaded knowledge

**Data additions:**

`admin_documents` table:
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| filename | text | original upload name |
| storage_path | text | Supabase Storage path |
| status | text | 'processing', 'ready', 'error' |
| chunk_count | int | number of chunks created |
| uploaded_by | uuid FK → profiles.id | |
| created_at | timestamp | |

`document_chunks` table (requires `pgvector` extension in Supabase):
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| document_id | uuid FK → admin_documents.id | ON DELETE CASCADE |
| chunk_index | int | order within document |
| content | text | raw chunk text |
| embedding | vector(1536) | OpenAI embedding |
| created_at | timestamp | |

**New env vars needed:**
```
OPENAI_API_KEY=        # for text-embedding-3-small
```

**New BFF routes:**
- `POST /api/admin/documents` — upload doc, trigger FastAPI processing
- `GET /api/admin/documents` — list all docs
- `DELETE /api/admin/documents/[id]` — delete doc + chunks
- Admin role check: `profiles.is_admin = true` (boolean column added to profiles)

**New FastAPI endpoint:**
- `POST /rag/process` — receives document text, chunks it, generates embeddings, stores in Supabase
- `POST /rag/search` — takes query embedding, returns top-K relevant chunks

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS + Framer Motion |
| Auth | Supabase Auth (Google OAuth + email/password) |
| Database | Supabase (Postgres) |
| Payments | Stripe |
| AI | Claude API (claude-sonnet-4-6) |
| Voice output | ElevenLabs API |
| Voice input | Web Speech API (browser) |
| Astrology engine | FastAPI + pyswisseph |
| Embeddings | OpenAI text-embedding-3-small |
| Vector store | Supabase pgvector |
| File storage | Supabase Storage |
| Geocoding | Nominatim (OpenStreetMap, free) |
| Frontend deploy | Vercel |
| Backend deploy | Railway |
