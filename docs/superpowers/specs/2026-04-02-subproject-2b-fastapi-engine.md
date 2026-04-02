# Sub-project 2B: FastAPI Astrology Engine — Design Spec

## Overview

Build a FastAPI service that calculates Western and Vedic natal charts using pyswisseph (Swiss Ephemeris). The service lives inside `root_Astra/engine/`, runs locally during development, and integrates with the existing Next.js frontend via `POST /api/chart/generate`.

---

## Project Structure

```
engine/
  app/
    __init__.py
    main.py              # FastAPI app, CORS, middleware
    auth.py              # X-Internal-Secret validation
    routes/
      __init__.py
      western.py         # POST /chart/western
      vedic.py           # POST /chart/vedic
    services/
      __init__.py
      western_chart.py   # pyswisseph Western calculation
      vedic_chart.py     # pyswisseph Vedic calculation (lagna, nakshatras)
    models/
      __init__.py
      schemas.py         # Pydantic request/response models
  tests/
    __init__.py
    test_western.py
    test_vedic.py
    test_auth.py
  requirements.txt
  .env.example
```

**Dependencies:**
- `fastapi` + `uvicorn[standard]`
- `pyswisseph`
- `pydantic` (included with FastAPI)
- `pytest` + `httpx`
- `python-dotenv`

**Python version:** 3.11+

---

## Inter-Service Authentication

Every request must include `X-Internal-Secret` header matching the `INTERNAL_SECRET` environment variable. Implemented as FastAPI middleware.

- Missing header → `401 { "error": "unauthorized" }`
- Wrong value → `401 { "error": "unauthorized" }`
- Valid → request proceeds

**Environment variables (`engine/.env`):**
```
INTERNAL_SECRET=<shared-secret-matching-nextjs>
```

---

## API Endpoints

### `POST /chart/western`

Calculates a Western natal chart using tropical zodiac and Placidus house system.

**Request:**
```json
{
  "date_of_birth": "1990-05-15",
  "time_of_birth": "14:30",
  "latitude": 27.72,
  "longitude": 85.32,
  "timezone": "Asia/Kathmandu"
}
```

- `time_of_birth` is optional — if null, use 12:00 (noon)
- `latitude` and `longitude` are floats
- `timezone` is an IANA timezone string (e.g., "Asia/Kathmandu")

**Response 200:**
```json
{
  "summary": "Sun Taurus, Moon Scorpio, ASC Libra",
  "planets": [
    { "name": "Sun", "symbol": "☉", "sign": "Taurus", "degree": 24, "house": 10, "retrograde": false }
  ],
  "houses": [
    { "number": 1, "sign": "Libra", "degree": 15 }
  ],
  "aspects": [
    { "planet1": "Sun", "planet2": "Moon", "type": "opposition", "orb": 1.2 }
  ]
}
```

This response format matches the `WesternChartData` TypeScript interface in the frontend exactly.

**Calculation details:**

**Planets (10):** Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto.
- Use `swe_calc_ut()` with Julian Day in UT to get ecliptic longitude
- Convert longitude to sign + degree (0-29)
- Determine house placement by comparing longitude to house cusps
- Check speed from `swe_calc_ut` — negative speed = retrograde

**Planet symbols:**
```
Sun: ☉, Moon: ☽, Mercury: ☿, Venus: ♀, Mars: ♂,
Jupiter: ♃, Saturn: ♄, Uranus: ♅, Neptune: ♆, Pluto: ♇
```

**Houses (12):** Placidus house system via `swe_houses()`.
- Returns 12 house cusps as ecliptic longitudes
- Convert each cusp to sign + degree

**Aspects (5 types):** Check all 45 planet pairs (10 choose 2).
- Conjunction: 0°, orb 8°
- Opposition: 180°, orb 8°
- Trine: 120°, orb 7°
- Square: 90°, orb 7°
- Sextile: 60°, orb 5°
- Calculate angular separation, check if within orb of any aspect type
- Round orb to 1 decimal place

**Summary:** Auto-generated string: "Sun {sign}, Moon {sign}, ASC {house_1_sign}"

**Julian Day calculation:**
- Parse `date_of_birth` + `time_of_birth` → local datetime
- Convert to UTC using `timezone` (via Python `zoneinfo`)
- Convert UTC datetime to Julian Day via `swe_julday()`

**Error responses:**
- `400 { "error": "invalid_date" }` — unparseable date
- `400 { "error": "invalid_coordinates" }` — latitude not in -90..90 or longitude not in -180..180
- `500 { "error": "calculation_failed", "detail": "..." }` — pyswisseph failure

---

### `POST /chart/vedic`

Calculates a Vedic natal chart using sidereal zodiac (Lahiri ayanamsa) and Whole Sign house system.

**Request:** Same schema as Western.

**Response 200:**
```json
{
  "summary": "Lagna Kanya, Moon Vrishchika, Nakshatra Anuradha",
  "lagna": { "sign": "Kanya", "degree": 15 },
  "planets": [
    { "name": "Sun", "sign": "Mesha", "degree": 24, "nakshatra": "Bharani", "retrograde": false }
  ],
  "nakshatras": [
    { "planet": "Moon", "nakshatra": "Anuradha", "pada": 3 }
  ]
}
```

**Calculation details:**

**Sidereal zodiac:** Call `swe_set_sid_mode(SE_SIDM_LAHIRI)` before calculations. Get ayanamsa for the date via `swe_get_ayanamsa_ut()`. Subtract ayanamsa from tropical longitudes to get sidereal positions.

**Sanskrit sign names (mapping from Western):**
```
Aries→Mesha, Taurus→Vrishabha, Gemini→Mithuna, Cancer→Karka,
Leo→Simha, Virgo→Kanya, Libra→Tula, Scorpio→Vrishchika,
Sagittarius→Dhanu, Capricorn→Makara, Aquarius→Kumbha, Pisces→Meena
```

**Whole Sign houses:** Lagna (ascendant) sign = 1st house. Each subsequent sign = next house. No Placidus calculation needed — just the ascendant.

**Lagna:** Sidereal ascendant — use sidereal longitude of the 1st house cusp. Convert to Sanskrit sign name + degree.

**27 Nakshatras:** Each spans 13°20' (13.333°) of the sidereal zodiac.
- Nakshatra index = floor(sidereal_longitude / 13.333)
- Pada (quarter) = floor((sidereal_longitude % 13.333) / 3.333) + 1
- Calculate for all planets, return in `nakshatras` array

**Nakshatra names (in order):**
```
Ashwini, Bharani, Krittika, Rohini, Mrigashira, Ardra, Punarvasu,
Pushya, Ashlesha, Magha, Purva Phalguni, Uttara Phalguni, Hasta,
Chitra, Swati, Vishakha, Anuradha, Jyeshtha, Mula, Purva Ashadha,
Uttara Ashadha, Shravana, Dhanishta, Shatabhisha, Purva Bhadrapada,
Uttara Bhadrapada, Revati
```

**Summary:** Auto-generated: "Lagna {lagna_sign}, Moon {moon_sign}, Nakshatra {moon_nakshatra}"

**No dasha calculations** — deferred to when premium Vedic tab is fully built.

**Error responses:** Same as Western endpoint.

---

## Next.js Integration

### Updated `POST /api/chart/generate` flow

Current flow: geocode → save birth_chart with null chart JSONs.

New flow:
1. Geocode city (existing)
2. Call `POST {FASTAPI_BASE_URL}/chart/western` with birth data + coordinates
3. Call `POST {FASTAPI_BASE_URL}/chart/vedic` with same data
4. Save birth_chart row with `western_chart_json` and `vedic_chart_json` populated
5. Return chart_id

**Graceful degradation:** If FastAPI is unreachable or returns an error, save the birth_chart row with null chart JSONs. The frontend already falls back to mock data when these are null. Log the error server-side.

### New file: `lib/astrology-engine.ts`

A thin client that calls FastAPI:

```ts
async function calculateWesternChart(params): Promise<WesternChartData | null>
async function calculateVedicChart(params): Promise<VedicChartData | null>
```

- Sends `X-Internal-Secret: process.env.INTERNAL_SECRET` header
- Base URL from `process.env.FASTAPI_BASE_URL` (defaults to `http://localhost:8000`)
- Returns null on any error (timeout, 4xx, 5xx, network error)

### New env var

Add to `.env.local`:
```
FASTAPI_BASE_URL=http://localhost:8000
```

### New type: `VedicChartData`

Add to `types/index.ts`:
```ts
interface VedicChartData {
  summary: string
  lagna: { sign: string; degree: number }
  planets: { name: string; sign: string; degree: number; nakshatra: string; retrograde: boolean }[]
  nakshatras: { planet: string; nakshatra: string; pada: number }[]
}
```

Update `BirthChart.vedic_chart_json` from `Record<string, unknown> | null` to `VedicChartData | null`.

---

## Error Handling

| Service | Failure | Behavior |
|---------|---------|----------|
| FastAPI — invalid input | 400 | Next.js returns error to client |
| FastAPI — calculation error | 500 | Next.js saves chart with null JSONs, logs error |
| FastAPI — unreachable | Network error | Next.js saves chart with null JSONs, logs error |
| pyswisseph — bad ephemeris | Exception | FastAPI returns 500 with detail |

---

## Testing

### FastAPI tests (pytest + httpx)

**`test_auth.py`:**
- Request without header → 401
- Request with wrong header → 401
- Request with valid header → passes through

**`test_western.py`:**
- Known birth data (May 15, 1990, 14:30, Kathmandu 27.72/85.32) → Sun in Taurus
- Response has 10 planets, 12 houses, aspects are valid types
- Aspects have valid orbs (positive numbers)
- Missing time_of_birth → uses noon, still returns valid chart
- Invalid date → 400
- Invalid coordinates → 400

**`test_vedic.py`:**
- Same known birth data → sidereal positions differ from tropical
- Lagna is present with Sanskrit sign name
- All planets have nakshatra assignments
- Nakshatras have valid pada (1-4)
- Response has valid Sanskrit sign names

### Next.js tests

- Update `__tests__/api/chart/generate.test.ts` to mock `lib/astrology-engine.ts` calls
- Test: FastAPI returns data → chart saved with JSONs populated
- Test: FastAPI unavailable → chart saved with null JSONs (graceful degradation)

---

## What This Does NOT Include

- Railway deployment (deferred — local only for now)
- Transit calculations (`POST /transits` — Sub-project 4)
- Compatibility/synastry (`POST /compatibility` — Sub-project 4)
- Daily horoscope generation (`GET /horoscope/{sign}` — Sub-project 3)
- Dasha period calculations (deferred to premium Vedic build-out)
- Dockerfile (added when deploying to Railway)
