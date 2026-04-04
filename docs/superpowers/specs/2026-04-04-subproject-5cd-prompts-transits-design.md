# Sub-project 5C+5D: Enriched AI Prompts + Transit Page — Design Spec

## Goal

Wire the computed Vedic engine data (yogas, dasha, houses, transits, interpretations) into the AI chat and horoscope prompts so responses are grounded in real astronomical calculations. Build a premium `/transit` page showing current planetary positions. Power the dashboard's Cosmic Weather widget with real data.

## 5C: Enriched Chat System Prompt

### Current State
`buildSystemPrompt()` in `lib/claude.ts` receives:
- User name, birth date/time/place
- Western chart summary (one-line string like "Sun Taurus, Moon Libra...")
- Vedic chart summary (one-line string like "Lagna Tula, Moon Mesha, Nakshatra Ashwini")

The AI has to guess yogas, dasha periods, house placements, and transits.

### After
`buildSystemPrompt()` receives the full Vedic chart JSON and today's transits. The prompt includes:
- Current Mahadasha + Antardasha (planet names and date ranges)
- Active yogas (name, strength, interpretation — only those marked `present: true`)
- 12 house lords with placements (e.g., "1st lord Mars in 7th house")
- Key planet placements with interpretations (Sun, Moon, Jupiter, Saturn, Rahu)
- Today's transit summary (which planets are in which signs, any notable aspects)

### Data Flow
`app/api/chat/message/route.ts` already fetches the user's birth chart from Supabase. Change:
1. Also fetch `vedic_chart_json` (which now includes houses, yogas, dasha, interpretations, remedies — thanks to 5A)
2. Fetch today's transits from engine `GET /transits/today`
3. Pass the full Vedic data + transits to `buildSystemPrompt()`

### Prompt Structure
```
You are Astra, a warm and wise astrologer...

User: {name}, born {date} at {time} in {place}.

=== VEDIC CHART ===
Lagna: {sign} ({degree}°)
Moon: {sign}, Nakshatra: {nakshatra} (Pada {pada})

Houses:
1st: {sign} — Lord {planet} in {house}th house
2nd: {sign} — Lord {planet} in {house}th house
...

Active Yogas:
- Gaja Kesari Yoga (strong): {interpretation}
- Budhaditya Yoga (moderate): {interpretation}

Current Dasha:
Mahadasha: {planet} ({start} to {end})
Antardasha: {planet} ({start} to {end})

Key Placements:
- Sun in {sign} in {house}th house: {interpretation}
- Moon in {sign} in {house}th house: {interpretation}
...

=== TODAY'S TRANSITS ({date}) ===
Sun in {sign}, Moon in {sign}, Mars in {sign}...

Western chart: {summary}
```

## 5D Part 1: Transit-Grounded Horoscopes

### Current State
`generateHoroscope()` in `lib/horoscope.ts` sends: "Generate today's horoscope for Aries (Mar 21 - Apr 19, Fire sign, ruled by Mars)." Zero astronomical data.

### After
The horoscope prompt includes today's actual transit positions so the AI references real planetary movements:
```
Today is {date}. Current planetary transits:
Sun in {sign} ({degree}°), Moon in {sign}, Mercury in {sign}...
Jupiter is retrograde in {sign}. Saturn transits {sign}.

Generate today's horoscope for {sign}...
```

### Data Flow
`app/api/horoscope/[sign]/route.ts` calls `GET /transits/today` from the engine before generating. Passes transit data to the enhanced prompt.

## 5D Part 2: Transit Page (Premium)

### New page: `/transit`

A premium-only page showing:
1. **Today's Planetary Positions** — 9 Vedic grahas with sign, degree, nakshatra, retrograde status. Styled as cards in a grid.
2. **Personal Transit Aspects** (if user has chart) — Transit-to-natal aspects from `POST /transits/personal`. Shows conjunctions, oppositions, trines, squares with orb.
3. **Vedha Flags** — Any obstructed favorable transits.
4. **Murthi Nirnaya** — Today's quality rating (Gold/Silver/Copper/Iron).

### Data Flow
- New `app/api/transit/route.ts` — fetches from engine `GET /transits/today` + `POST /transits/personal` (with user's natal data)
- New `components/transit/TransitView.tsx` — displays all sections
- Page gated to premium users (existing middleware handles this)

## 5D Part 3: Dashboard Cosmic Weather

### Current State
`CosmicWeather.tsx` displays `CosmicWeatherEntry[]` but the data source is unclear (likely mock/static).

### After
Dashboard page fetches real transit data from `GET /transits/today` and maps it to `CosmicWeatherEntry[]` format for the widget.

## Files Changed

| File | Type | What Changes |
|------|------|-------------|
| `lib/claude.ts` | Modify | Add `buildEnrichedVedicContext()` helper, update `buildSystemPrompt()` to accept full Vedic data + transits |
| `app/api/chat/message/route.ts` | Modify | Fetch vedic_chart_json + transits, pass to prompt |
| `lib/horoscope.ts` | Modify | Add transit data to horoscope prompt |
| `app/api/horoscope/[sign]/route.ts` | Modify | Fetch transits before generating |
| `app/api/transit/route.ts` | Create | Fetch personal transits from engine |
| `app/transit/page.tsx` | Create | Premium transit page |
| `components/transit/TransitView.tsx` | Create | Transit display component |
| `components/transit/TransitCard.tsx` | Create | Individual planet transit card |
| `components/transit/PersonalAspects.tsx` | Create | Transit-to-natal aspects display |
| `app/dashboard/page.tsx` | Modify | Fetch transit data for CosmicWeather |
| `components/dashboard/CosmicWeather.tsx` | Modify | Accept real transit data |

## Scope Boundaries

**In scope:** Prompt enrichment, transit page, cosmic weather wiring
**Out of scope:** Switching to Claude API (user decision: keep OpenAI for now), chat persistence, voice/TTS, yearly predictions page
