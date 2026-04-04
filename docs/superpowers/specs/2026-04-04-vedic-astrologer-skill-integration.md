# Vedic Astrologer Skill Integration — Design Spec

**Date:** 2026-04-04
**Status:** Approved
**Replaces:** Generic GPT-4o-mini astrology guessing with deterministic Vedic interpretation engine

## Problem

GPT-4o-mini generates fictional readings — wrong dates, random lucky numbers, invented planetary positions, inconsistent astrology. The FastAPI engine computes real chart math (pyswisseph), but the AI interpretation layer has zero actual astrology knowledge.

## Solution

Build a deterministic Vedic interpretation engine in FastAPI. The engine pre-computes all astrological facts (dashas, yogas, transits, house lords, interpretations, remedies). The AI's role becomes narrative writing on top of factual data — no room for making things up.

## Key Decisions

- **Vedic-first**: Sidereal zodiac (Lahiri ayanamsa) is the primary system. Western chart kept as supplementary reference view.
- **Dasha depth**: Mahadasha + Antardasha (2 levels). Precise enough for month-level timing.
- **Remedies**: Full (gemstones, mantras, charity) with disclaimers on every suggestion.
- **Horoscopes**: Hybrid — 12-sign cached (grounded in real transits) + personalized Cosmic Weather for logged-in users.
- **Compatibility**: Ashtakoota (36-point) as primary displayed score. Western synastry feeds AI narrative only, not shown as a separate score.

---

## 1. FastAPI Engine — New Services

### 1a. `engine/app/services/transits.py`

Calculates real-time sidereal planetary positions using pyswisseph + Lahiri ayanamsa.

**Functions:**
- `calculate_transits(date: str) -> dict` — positions of 9 Vedic grahas (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Rahu, Ketu) for any date. Returns: sign, degree, nakshatra, pada, retrograde status per planet.
- `calculate_personal_transits(natal_planets: list, moon_sign: str, date: str) -> dict` — transit-to-natal aspects with orbs, Vedha obstruction checks, Murthi Nirnaya quality rating (Gold/Silver/Copper/Iron).

**Vedha logic:** A favorable transit is canceled if another planet occupies the specific obstruction house from Moon. Example: Sun in 3rd is obstructed by a planet in the 9th (except Saturn, which is immune to Vedha from Sun).

**Murthi Nirnaya:** Determines transit quality based on Moon's nakshatra at the time a planet enters a new sign. Gold = best results, Iron = minimal results.

**Endpoints:**
- `GET /transits/today` — today's planetary positions
- `POST /transits/personal` — accepts natal chart, returns transit-to-natal analysis

### 1b. `engine/app/services/dasha.py`

Vimshottari Dasha calculator — the 120-year planetary timing system.

**Input:** Moon's sidereal longitude at birth + date of birth.

**Logic:**
1. Moon's nakshatra determines the starting Dasha lord
2. Elapsed portion of the nakshatra determines how much of the first Dasha has passed at birth
3. Vimshottari sequence: Ketu(7y), Venus(20y), Sun(6y), Moon(10y), Mars(7y), Rahu(18y), Jupiter(16y), Saturn(19y), Mercury(17y) = 120 years
4. Each Mahadasha subdivides into 9 Antardashas in the same sequence, proportional to the Mahadasha duration

**Output:**
- Full Mahadasha timeline (start/end dates for all 9 periods)
- Antardasha sub-periods within each Mahadasha
- Current Mahadasha + Antardasha highlighted based on today's date
- Next 3 upcoming Antardashas

**Endpoint:** `POST /dasha` (accepts birth date + Moon sidereal longitude)

### 1c. `engine/app/services/yogas.py`

Detects key planetary combinations (yogas) from a Vedic chart.

**Input:** Vedic chart data (planet positions with house numbers, lagna sign).

**Yogas detected:**

| Yoga | Condition | Significance |
|------|-----------|-------------|
| Gaja Kesari | Jupiter in Kendra (1/4/7/10) from Moon | Wisdom, wealth, reputation |
| Lakshmi | Strong 9th lord + Venus in Kendra/Trikona | Fortune, luxury, prosperity |
| Vasumati | Benefics in 3/6/10/11 from Moon | Sustained wealth accumulation |
| Budhaditya | Sun-Mercury conjunction (same sign) | Intelligence, communication skill |
| Chandra-Mangal | Moon-Mars conjunction (same sign) | Courage, financial drive |
| Mangal Dosha | Mars in 1st/4th/7th/8th/12th house | Intensity in partnerships |

**Output per yoga:** name, present (bool), strength (strong/moderate/mild), brief interpretation.

**Endpoint:** `POST /yogas` (accepts Vedic chart planets + houses)

### 1d. `engine/app/services/ashtakoota.py`

36-point Vedic compatibility scoring system.

**Input:** Both partners' Moon sign, nakshatra, and pada.

**8 Kootas computed:**

| Koota | Max | Checks |
|-------|-----|--------|
| Varna | 1 | Spiritual compatibility (sign → caste mapping) |
| Vashya | 2 | Mutual attraction (sign → category: quadruped/human/insect/water/wild) |
| Tara | 3 | Birth star compatibility (nakshatra distance mod 9) |
| Yoni | 4 | Physical compatibility (nakshatra → animal symbol pairs) |
| Graha Maitri | 5 | Mental wavelength (Moon sign lord friendship) |
| Gana | 6 | Temperament (nakshatra → Deva/Manushya/Rakshasa) |
| Bhakoot | 7 | Emotional/financial (sign distance pattern: 6-8 or 2-12 = 0) |
| Nadi | 8 | Genetic/health (nakshatra → Vata/Pitta/Kapha, same = 0) |

**Dosha detection:**
- Nadi Dosha: same Nadi → 0/8, flagged critical
- Bhakoot Dosha: unfavorable sign distance → 0/7, flagged
- Mangal Dosha: Mars in 1/4/7/8/12 for each partner; mutual cancellation noted

**Rating scale:** <18 Poor, 18-24 Average, 25-32 Very Good, 33+ Excellent

**Endpoint:** `POST /compatibility/vedic`

### 1e. `engine/app/services/interpretations.py`

Deterministic lookup tables for astrological meanings. No AI involved.

**Tables:**
- **Planet-in-sign** (9 grahas x 12 signs = 108 entries): 1-2 sentence meaning each
- **Planet-in-house** (9 grahas x 12 houses = 108 entries): focused on Bhava themes from Vedic tradition (Tanu, Dhana, Matru, Shatru, Kalatra, Bhagya, Karma, Labha, Vyaya)
- **Nakshatra meanings** (27 entries): core traits, ruling deity, ruling planet, element
- **Remedies per planet** (9 entries): gemstone, Beej Mantra, charity day, associated deity
- **House lord placement** (12 lords x 12 houses = 144 entries): brief meaning of each lord-in-house combination

All entries are traditional Vedic interpretations codified as Python dictionaries.

---

## 2. Enhanced Vedic Chart Response

### Changes to `POST /chart/vedic`

Currently returns: summary, lagna, planets, nakshatras.

Enhanced response adds:

```json
{
  "summary": "Lagna Mesha, Moon Vrishabha, Nakshatra Rohini",
  "lagna": { "sign": "Mesha", "degree": 15, "nakshatra": "Ashwini", "pada": 2 },
  "planets": [
    { "name": "Sun", "sign": "Mesha", "degree": 15, "house": 1, "nakshatra": "Ashwini", "retrograde": false }
  ],
  "nakshatras": [ { "planet": "Sun", "nakshatra": "Ashwini", "pada": 2 } ],

  "houses": [
    { "number": 1, "sign": "Mesha", "lord": "Mars", "lord_house": 7 }
  ],
  "yogas": [
    { "name": "Gaja Kesari Yoga", "present": true, "strength": "strong", "interpretation": "Jupiter in Kendra from Moon..." }
  ],
  "dasha": {
    "current_mahadasha": { "planet": "Moon", "start": "2022-03-15", "end": "2032-03-15" },
    "current_antardasha": { "planet": "Saturn", "start": "2025-11-01", "end": "2027-06-15" },
    "upcoming_antardashas": []
  },
  "interpretations": {
    "lagna_lord": "Mars rules your ascendant and sits in the 7th house...",
    "moon_nakshatra": "Rohini nakshatra — ruled by Moon, deity Brahma...",
    "planet_highlights": [
      { "planet": "Jupiter", "text": "Jupiter in Simha in 5th house — strong creative intelligence..." }
    ]
  },
  "remedies": [
    {
      "planet": "Saturn",
      "reason": "Saturn Antardasha active",
      "gemstone": "Blue Sapphire",
      "mantra": "Om Sham Shanicharaya Namah",
      "charity": "Donate black items on Saturdays",
      "disclaimer": "Traditional Vedic remedy — not medical or financial advice"
    }
  ]
}
```

### Rahu & Ketu

Add Rahu (swe.MEAN_NODE) and Ketu (Rahu + 180°) to Vedic planet calculations. Remove Uranus, Neptune, Pluto from Vedic response (not used in traditional Jyotish). Western chart keeps all 10 planets.

### Whole Sign Houses

Vedic uses Whole Sign houses: Lagna sign = 1st house, next sign = 2nd, etc. Each house has a lord determined by its sign ruler:
- Mesha/Vrishchika → Mars
- Vrishabha/Tula → Venus
- Mithuna/Kanya → Mercury
- Karka → Moon
- Simha → Sun
- Dhanu/Meena → Jupiter
- Makara/Kumbha → Saturn

---

## 3. System Prompt Overhaul

### Current State

Thin prompt: "You are Astra, warm astrologer" + one-line summary like "Sun Aries, Moon Taurus, ASC Gemini." AI fills gaps by guessing.

### New 4-Layer Prompt Structure

**Layer 1 — Persona & Rules** (~300 tokens, static)

```
You are Astra, a Vedic Astrologer (Jyotishi) specializing in the Science of Light.
You speak with warmth, empathy, and gentle confidence. You stay fully in character.

RULES:
- Use Sidereal zodiac exclusively. Never reference tropical/Western sign placements.
- Use probabilistic language: "the stars indicate a higher probability" not absolute statements.
- Reference the user's specific chart data provided below — never invent placements.
- If data is not provided for a topic, say "I would need to examine that area of your chart further."
- For medical/legal concerns, direct to licensed professionals.
- Today's date: {today}. Never reference past dates as upcoming.
- All remedies include disclaimer: "This is a traditional Vedic remedy, not medical or financial advice."
- Emphasize free will — the chart is a mirror to recognize innate strengths, not a fixed fate.
```

**Layer 2 — Natal Chart Facts** (~400 tokens, from stored vedic_chart_json)

Includes: Lagna + lord placement, all 9 grahas with sign/house/nakshatra/interpretation, key house lords, detected yogas, active remedies.

**Layer 3 — Current Timing** (~200 tokens, from Dasha + transits API)

Includes: Current Mahadasha + Antardasha with date ranges and themes, today's transits from Janma Rasi perspective, Vedha obstructions, transit-to-natal aspects.

**Layer 4 — Conversation History** (existing, last 10 messages)

### Code Changes

- `lib/claude.ts` — `buildSystemPrompt()` accepts full enriched chart + transit data + dasha
- `app/api/chat/message/route.ts` — fetches `GET /transits/today` and `POST /transits/personal` before building prompt. Enriched chart data already in `vedic_chart_json`.

---

## 4. Horoscope System

### 4a. Public 12-Sign Horoscopes (Enhanced)

Same caching model (per sign per day in `astra_horoscopes`). New prompt includes real transit data.

**Flow:**
1. Cache miss → `GET /transits/today` for real positions
2. Prompt includes actual sidereal positions of all 9 grahas
3. Lucky number: derived from sum of transiting degrees mod 99 (deterministic)
4. Lucky color: mapped from dominant transiting element (Fire=red, Earth=green, Air=yellow, Water=blue)
5. Compatibility sign: sign where Venus/Jupiter transit is most favorable
6. AI writes narrative grounded in real transits, analyzed from the sign's perspective (which houses do transits fall in for this Janma Rasi?)

### 4b. Personalized Cosmic Weather (Dashboard)

For logged-in users with birth charts. Unique per user per day.

**Flow:**
1. `GET /api/cosmic-weather` → fetch stored chart + call `POST /transits/personal`
2. Prompt includes: transit-to-natal aspects, Vedha checks, Murthi Nirnaya quality, active Dasha period
3. AI generates ~150 word personalized reading with one actionable suggestion tied to Antardasha lord
4. Cached per user per day in new table `astra_cosmic_weather` (user_id, date, reading, transit_data jsonb)
5. Free users: shorter teaser. Premium: full detail.

### 4c. Unchanged

- `astra_horoscopes` table and caching logic
- Horoscope page routes (`/horoscope/[sign]`)
- Homepage zodiac grid

---

## 5. Compatibility System

### 5a. Ashtakoota as Primary Score

Replace the Western synastry 0-100 score display with Ashtakoota X/36 score and koota breakdown.

**Flow:**
1. User enters partner birth details → geocode → calculate Vedic chart for partner
2. `POST /compatibility/vedic` → Ashtakoota score + koota breakdown + dosha flags
3. `POST /compatibility` → Western synastry aspects (kept for AI narrative enrichment)
4. AI prompt includes both: Ashtakoota score/kootas/doshas (primary) + Western aspects (supplementary color)
5. AI generates ~300 word narrative. Leads with Vedic analysis, references specific kootas, mentions doshas with remedies + disclaimer.

### 5b. UI Changes

- Score display: "28/36 — Very Good" instead of "72/100"
- Koota breakdown card (8 rows showing each koota's score)
- Doshas section (if flagged) with remedies and disclaimer
- Narrative section unchanged — just better data

---

## 6. Data Flow Summary

### Chart Generation (one-time)
```
Birth details → geocode → POST /chart/western + POST /chart/vedic (enhanced)
→ Store both in astra_birth_charts
```

### Chat Message
```
User message → fetch profile + chart → GET /transits/today + POST /transits/personal
→ 4-layer system prompt → OpenAI stream → SSE
```

### 12-Sign Horoscope (daily cached)
```
/horoscope/[sign] → cache check → miss: GET /transits/today → grounded prompt
→ OpenAI → parse JSON → cache → return
```

### Personalized Cosmic Weather (daily per-user)
```
Dashboard → GET /api/cosmic-weather → fetch chart + POST /transits/personal
→ personalized prompt → OpenAI → cache per user per day → return
```

### Compatibility
```
Partner details → geocode → POST /chart/vedic (partner)
→ POST /compatibility/vedic + POST /compatibility
→ combined prompt → OpenAI narrative → display Vedic score + narrative
```

---

## 7. New FastAPI Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/transits/today` | GET | Today's sidereal planetary positions |
| `/transits/personal` | POST | Transit-to-natal aspects + Vedha + Murthi Nirnaya |
| `/dasha` | POST | Vimshottari Mahadasha + Antardasha timeline |
| `/yogas` | POST | Detect yogas from Vedic chart |
| `/compatibility/vedic` | POST | Ashtakoota 36-point scoring + dosha detection |
| `/chart/vedic` | POST | Enhanced with houses, lords, yogas, dasha, interpretations, remedies |

---

## 8. What Doesn't Change

- OpenAI as LLM provider (GPT-4o-mini) — just much better prompts
- Streaming SSE mechanism for chat
- Supabase auth, RLS, table structure (`vedic_chart_json` just gets richer)
- Western chart endpoint (kept for supplementary data)
- Stripe payments, free tier limits (3 msgs/day, premium gates)
- Frontend components (minimal UI tweaks for compatibility score display)
- TTS (OpenAI nova voice)

---

## 9. Ethical Safeguards

Per the astrologer skill document:
- **Non-maleficence**: No fatalistic predictions (death, ruin, etc.)
- **Probabilistic language**: "Higher probability," "tendency," never absolutes
- **Empowerment**: Chart as a mirror for self-awareness, not fixed destiny
- **Referral**: Direct to licensed professionals for medical/legal concerns
- **Remedy disclaimers**: Every remedy suggestion tagged with "Traditional Vedic remedy — not medical or financial advice"
