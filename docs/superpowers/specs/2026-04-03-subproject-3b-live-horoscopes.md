# Sub-project 3B: Live Horoscopes — Design Spec

## Overview

Replace the static placeholder horoscope text on the 12 `/horoscope/[sign]` pages with Claude-generated daily horoscopes. Horoscopes are generated on-demand (first request per sign per day triggers Claude), cached in the existing `horoscopes` table, and include a reading, lucky number, lucky color, and compatibility sign.

---

## Generation Strategy: On-Demand (Lazy)

First request for a sign after midnight UTC triggers Claude to generate that sign's horoscope. Subsequent requests serve from cache. Each sign is generated independently — only signs that are actually visited get generated.

**Flow:**
1. Request arrives for `/horoscope/aries`
2. Check `horoscopes` table: `SELECT * FROM horoscopes WHERE sign = 'aries' AND date = today`
3. If row exists → return cached data
4. If no row → call Claude → insert into `horoscopes` → return data
5. `unique(sign, date)` constraint prevents duplicate generation from concurrent requests

---

## API Route: `GET /api/horoscope/[sign]`

Public endpoint — no authentication required (horoscopes are public content).

**Response 200:**
```json
{
  "sign": "aries",
  "date": "2026-04-03",
  "reading": "The stars align in your favor today...",
  "lucky_number": 7,
  "lucky_color": "emerald green",
  "compatibility_sign": "leo"
}
```

**Response 404:** Invalid sign slug.

**Error handling:** If Claude API fails, return a 503 with `{ "error": "Horoscope generation temporarily unavailable" }`. The horoscope page falls back to the existing static `placeholderHoroscope` text.

---

## Claude Integration (`lib/horoscope.ts`)

**Model:** `claude-haiku-4-5` (cheapest, fast enough for structured horoscope text). Configurable via `HOROSCOPE_MODEL` env var.

**Prompt:**
```
Generate today's horoscope for {sign_name} ({dates}, {element} sign, ruled by {ruling_planet}). 

Return ONLY valid JSON with no other text:
{
  "reading": "A ~200 word horoscope paragraph. Be warm, specific, and reference current planetary energy. Write as Astra, a wise and experienced astrologer.",
  "lucky_number": <number between 1 and 99>,
  "lucky_color": "<a color name>",
  "compatibility_sign": "<lowercase zodiac sign slug most compatible today>"
}
```

**Functions:**
- `generateHoroscope(sign: ZodiacSign): Promise<HoroscopeData>` — calls Claude, parses JSON response
- `getOrGenerateHoroscope(sign: string, supabase: SupabaseClient): Promise<HoroscopeData | null>` — check cache → generate if missing → save → return. Returns null on any failure.

---

## New Type

Add to `types/index.ts`:

```ts
interface HoroscopeData {
  sign: string
  date: string
  reading: string
  lucky_number: number
  lucky_color: string
  compatibility_sign: string
}
```

---

## Migration: `005_horoscopes_compatibility.sql`

```sql
ALTER TABLE horoscopes ADD COLUMN compatibility_sign text;
```

The existing `horoscopes` table (003_horoscopes.sql) already has `sign`, `date`, `reading`, `lucky_number`, `lucky_color`. Only `compatibility_sign` is missing.

---

## Updated Horoscope Page

Modify `app/horoscope/[sign]/page.tsx`:

**Changes:**
- Fetch from `/api/horoscope/[sign]` (internal fetch in server component) instead of using `zodiacSign.placeholderHoroscope`
- Display lucky number, lucky color, and compatibility sign in styled cards below the reading
- **Fallback:** If fetch fails, show `zodiacSign.placeholderHoroscope` (existing static text) — no broken page

**New UI elements** (below the reading card):
- Three compact cards in a row: Lucky Number, Lucky Color, Compatibility Sign
- Same styling as dashboard cosmic profile cards (gradient nebula bg, violet border)

**Keep unchanged:** Page layout, sign header, other-signs navigation grid, CTA section, `revalidate: 86400`, `generateStaticParams()`, `generateMetadata()`.

---

## Component Structure

| File | Change |
|------|--------|
| `types/index.ts` | Add `HoroscopeData` interface |
| `lib/horoscope.ts` | New — Claude horoscope generation + cache logic |
| `supabase/migrations/005_horoscopes_compatibility.sql` | New — add column |
| `app/api/horoscope/[sign]/route.ts` | New — public GET endpoint |
| `app/horoscope/[sign]/page.tsx` | Modify — fetch live data, show extras, fallback |
| `__tests__/lib/horoscope.test.ts` | New — generation + cache tests |

---

## Environment Variables

Add to `.env.local` (optional):
```
HOROSCOPE_MODEL=claude-haiku-4-5
```

Falls back to `claude-haiku-4-5` if not set. Uses existing `CLAUDE_API_KEY`.

---

## Testing

- `lib/horoscope.ts` — test prompt includes sign name/dates/element, test JSON parsing of Claude response, test `getOrGenerateHoroscope` returns cached data without calling Claude when row exists
- `GET /api/horoscope/[sign]` — test returns horoscope data for valid sign, test returns 404 for invalid sign

---

## What This Does NOT Include

- Scheduled/cron generation (not needed — lazy generation is sufficient)
- Horoscope generation for all 12 signs at once
- Personalized horoscopes (those come from the chat with Astra)
- Horoscope history/archive browsing
