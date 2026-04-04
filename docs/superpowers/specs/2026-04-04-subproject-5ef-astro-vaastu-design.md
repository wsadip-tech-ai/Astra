# Sub-project 5E+5F: Astro-Vaastu Decision-Support System — Design Spec

## Goal

Build a personalized Astro-Vaastu diagnostic system that maps the user's birth chart onto their physical living space using HIT Theory, the 16-zone Vaastu grid, Aayadi dimensional audit, and spatial placement rules. Provide actionable remedies. Integrate with chat so Astra can answer Vaastu questions.

## Scope

**Phase 1 (5E — Engine):** Five Vaastu calculation services, three API endpoints, full test coverage.
**Phase 2 (5F — Frontend):** `/vaastu` premium page with progressive input, 16-zone compass visualization, diagnostic report, chat integration.

---

## Phase 1: Engine Services

### Service Architecture

All services live under `engine/app/services/vaastu/` as a Python sub-package with an `__init__.py`.

### 1. HIT Calculator (`hit_calculator.py`)

Computes angular relationships between planets and house cusps using compound degrees.

**Core function:**
```
calculate_hits(
    planets: list[dict],   # name, sign, degree (from Vedic chart)
    active_dasha_lord: str, # planet name
) -> dict
```

**Logic:**
1. Convert each planet's sign+degree to compound degrees (0-360°). Formula: `(sign_index * 30) + degree`.
2. For each planet pair, compute angular difference: `min(abs(a - b), 360 - abs(a - b))`.
3. Classify HITs:
   - 180° ± 8° → "killer" (major life disruption)
   - 90° ± 5° → "dangerous" (conflicts, serious problems)
   - 45° ± 3° → "obstacle" (delays, minor problems)
   - 120° ± 5° → "best_support" (trikon, best positive)
   - 60° ± 3° → "friend" (positive support)
   - 30° ± 3° → "positive" (mild positive)
4. Separate into primary HITs (involving the active Dasha lord) and secondary HITs (all others).
5. For each negative HIT, identify the "attacker" planet and map it to a Vaastu direction.

**Returns:**
```json
{
  "primary_hits": [
    {"attacker": "Saturn", "victim": "Moon", "angle": 91.2, "type": "dangerous", "direction": "W", "description": "..."}
  ],
  "secondary_hits": [...],
  "positive_hits": [...],
  "dasha_lord": "Moon",
  "dasha_lord_compound_degree": 45.5
}
```

### 2. Vaastu Grid (`vaastu_grid.py`)

Maps the 16-zone system and 45 Devtas.

**Constants:**
- `ZONES`: 16 zones with degree ranges, ruling planet, ruling element, and Devta(s)
- `PLANET_DIRECTIONS`: Planet → primary zone mapping (Sun→E, Moon→NW, Mars→S, Mercury→N, Jupiter→NE, Venus→SE, Saturn→W, Rahu→SW, Ketu→NW)
- `DEVTAS_45`: 45 Devtas with their zone assignments and domains

**Functions:**
- `get_zone_for_planet(planet: str) -> dict` — returns zone info for a planet
- `get_zone_for_direction(direction: str) -> dict` — returns zone info by direction name
- `get_devta_for_zone(zone: str) -> list[dict]` — returns Devtas ruling a zone
- `map_afflictions(hits: list[dict]) -> list[dict]` — maps HIT results to physical zones with Devta context

### 3. Aayadi Calculator (`aayadi.py`)

Dimensional harmony audit based on building dimensions and user's birth nakshatra.

**Core function:**
```
calculate_aayadi(
    length_ft: float,
    breadth_ft: float,
    user_nakshatra: str,
) -> dict
```

**Formulas:**
- Aaya (Income): `(length * 8) % 12` — the remainder is the gain indicator
- Vyaya (Loss): `(breadth * 9) % 10` — the remainder is the expenditure indicator
- Yoni (Energy flow): `(perimeter * 3) % 8` — determines Prana direction
- Rule: Aaya must be > Vyaya for financial growth

**Yoni types** (remainder 1-8): Dhwaja (flag), Dhooma (smoke), Simha (lion), Shwana (dog), Vrishabha (bull), Khara (donkey), Gaja (elephant), Kaaka (crow). Each has favorable/unfavorable interpretation.

**Footprint effects:** Check specific measurements against traditional rules:
- 30ft → "Lakshmi's Blessing" (auspicious)
- 34ft → "Loss of Home" (inauspicious)
- Other specific lengths with traditional meanings

**Returns:**
```json
{
  "aaya": 4,
  "vyaya": 3,
  "aaya_greater": true,
  "yoni": {"type": "Gaja", "value": 7, "interpretation": "Elephant — wealth and stability"},
  "footprint_effects": [{"dimension": "length", "value": 30, "effect": "Lakshmi's Blessing"}],
  "overall_harmony": "favorable",
  "description": "Building dimensions are harmonious. Aaya (4) exceeds Vyaya (3)..."
}
```

### 4. Spatial Rules (`spatial_rules.py`)

Validates room placements and environmental features against Vaastu principles.

**Core function:**
```
check_spatial_rules(
    entrance_direction: str,       # one of 16 directions
    kitchen_zone: str | None,      # optional
    toilet_zones: list[str] | None, # optional
    brahmasthan_status: str | None, # "open" / "pillared" / "walled" / None
    slope_direction: str | None,    # optional
    floor_level: str,              # "ground" / "upper"
    user_name_initial: str | None,  # for name-sound entrance mapping
) -> dict
```

**Rules checked:**
1. **Entrance validation:** Name-sound mapping (A/I/O/U → North or West entrance favorable). Entrance in user's favorable direction.
2. **Kitchen placement:** Ideal in SE (Agneya). Acceptable in NW. Unfavorable in NE or SW.
3. **Toilet placement:** Must not be in NE or Brahmasthan. SW is acceptable.
4. **Brahmasthan:** Central zone must be free of pillars, walls, toilets, heavy objects.
5. **Slope:** Ideal slope toward NE for prosperity. SW slope is unfavorable.
6. **Floor level:** Ground floor has stronger Vaastu effects than upper floors.

**Returns:**
```json
{
  "findings": [
    {"rule": "Kitchen Placement", "status": "favorable", "zone": "SE", "description": "..."},
    {"rule": "Brahmasthan", "status": "warning", "detail": "Pillar in central zone restricts energy flow", "remedy": "..."}
  ],
  "plant_recommendations": [
    {"plant": "Snake Plant", "zone": "N/NE", "purpose": "Enhances clarity for professionals", "condition": "IT/analytical work"}
  ],
  "overall_status": "mostly_favorable"
}
```

### 5. Master Diagnostic (`vaastu_diagnostic.py`)

Combines all services into one comprehensive analysis.

**Core function:**
```
run_vaastu_diagnostic(
    vedic_chart: dict,             # full Vedic chart data (planets, houses, dasha, etc.)
    property: dict,                # length, breadth, entrance_direction, floor_level
    room_details: dict | None,     # optional: kitchen, toilets, brahmasthan, slope
    user_nakshatra: str,
    user_name_initial: str | None,
) -> dict
```

**Flow:**
1. Extract active Dasha lord from `vedic_chart.dasha.current_mahadasha.planet`
2. Run HIT calculator with chart planets + Dasha lord
3. Map HITs to 16-zone grid
4. Run Aayadi calculator with property dimensions + nakshatra
5. If room details provided, run spatial rules checker
6. Combine all findings into a unified diagnostic
7. Generate remedies for each affliction

**Returns:**
```json
{
  "summary": "3 zones need attention, dimensions are harmonious",
  "aayadi": { ... },
  "hits": { ... },
  "zone_map": [
    {"zone": "N", "status": "clear", "planet": "Mercury", "devtas": [...]},
    {"zone": "W", "status": "afflicted", "planet": "Saturn", "hit_type": "dangerous", "remedy": "..."},
    ...
  ],
  "spatial_findings": [ ... ],
  "remedies": [
    {"zone": "W", "type": "non_demolition", "remedy": "Place Copper Pyramid in West zone", "reason": "Saturn receiving 90° hit..."},
    {"zone": "SE", "type": "dasha_activation", "remedy": "Place gold accents in East during Sun Dasha", "reason": "..."}
  ],
  "plant_recommendations": [ ... ],
  "disclaimer": "This is traditional Vedic Vaastu guidance — not a substitute for structural engineering or professional consultation."
}
```

### API Endpoints

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `/vaastu/analyze` | POST | Vedic chart ref + property details + optional room details | Full diagnostic |
| `/vaastu/aayadi` | POST | length, breadth, nakshatra | Aayadi result only |
| `/vaastu/hits` | POST | Vedic chart planets + dasha lord | HIT analysis only |

### Pydantic Schemas

New request/response models in `engine/app/models/schemas.py`:
- `VaastuPropertyInput` — length, breadth, entrance_direction, floor_level
- `VaastuRoomDetails` — kitchen_zone, toilet_zones, brahmasthan_status, slope_direction
- `VaastuAnalyzeRequest` — property + optional room details + user_nakshatra + user_name_initial
- `VaastuHitResult`, `VaastuZoneStatus`, `VaastuRemedy`, `AayadiResult`
- `VaastuDiagnosticResponse` — full diagnostic result

### Tests

- `engine/tests/test_vaastu_hits.py` — HIT angle classification, compound degree conversion, primary vs secondary
- `engine/tests/test_vaastu_grid.py` — Zone mapping, planet-to-direction, Devta assignments
- `engine/tests/test_aayadi.py` — Aaya/Vyaya/Yoni formulas, footprint effects, harmony check
- `engine/tests/test_spatial_rules.py` — Entrance validation, kitchen/toilet/Brahmasthan rules
- `engine/tests/test_vaastu_diagnostic.py` — Integration test combining all services

---

## Phase 2: Frontend

### `/vaastu` Page (Premium)

**Progressive input form:**

Step 1 (required): Property dimensions + entrance direction
- Length (ft) — number input
- Breadth (ft) — number input
- Main entrance direction — 16-direction dropdown
- Floor level — ground/upper toggle

Step 2 (expandable "Add Room Details"):
- Kitchen zone — 16-direction dropdown
- Toilet zones — multi-select
- Brahmasthan status — open/pillared/walled
- Plot slope direction — 16-direction dropdown
- Your name initial — single character (for entrance mapping)

Submit calls `POST /vaastu/analyze` with the user's stored Vedic chart data + property inputs.

**Result display:**

1. **16-Zone Compass Grid** (hero) — Interactive SVG/CSS compass with 16 wedges. Each zone color-coded:
   - Green = clear
   - Yellow = minor concern (obstacle HIT or spatial warning)
   - Red = afflicted (killer/dangerous HIT)
   - Blue = positive support zone
   Click a zone to see details in a side panel.

2. **Aayadi Score Card** — Aaya vs Vyaya with visual comparison bar. Yoni type with icon. Footprint effects if any.

3. **HIT Report** — Primary HITs (from active Dasha lord) shown prominently. Secondary HITs collapsed. Each HIT shows: attacker → victim, angle, type, affected zone.

4. **Spatial Findings** (if room details provided) — List of rule checks with pass/warning/fail indicators.

5. **Remedies** — Grouped by zone. Each remedy shows: what to do, why, and the standard disclaimer.

6. **Plant Recommendations** — Suggestions based on user's profession/goals if derivable from chart.

### Chat Integration

When the user has saved Vaastu property data, add to the chat system prompt:

```
=== VAASTU PROFILE ===
Property: {length}ft × {breadth}ft, {entrance} entrance, {floor} floor
Aayadi: Aaya {value} vs Vyaya {value} — {harmonious/disharmonious}
Yoni: {type} — {interpretation}
Afflicted Zones: {zone}: {reason} (remedy: {remedy})
Active HIT: {dasha_lord} receiving {hit_type} from {planet} → {direction} zone
```

This lets Astra answer questions like "What should I put in my West zone?" or "Is my kitchen placement okay?" using real computed data.

### Property Persistence

Save the user's property data to Supabase so it persists across sessions:
- New table `astra_vaastu_properties` (user_id, length, breadth, entrance_direction, floor_level, kitchen_zone, toilet_zones, brahmasthan_status, slope_direction, name_initial, created_at)
- One property per user (upsert on save)

### Components

```
components/vaastu/VaastuView.tsx          — Main page orchestrator
components/vaastu/PropertyForm.tsx        — Progressive input form
components/vaastu/CompassGrid.tsx         — 16-zone interactive compass visualization
components/vaastu/AayadiCard.tsx          — Dimensional harmony display
components/vaastu/HitReport.tsx           — HIT analysis display
components/vaastu/SpatialFindings.tsx     — Room placement rule results
components/vaastu/RemedyList.tsx          — Remedies grouped by zone
```

### API Routes

- `app/api/vaastu/analyze/route.ts` — Calls engine `/vaastu/analyze` with user's chart + property
- `app/api/vaastu/save/route.ts` — Saves property to Supabase

---

## Design System

All components follow existing Astra design language (dark cosmic theme):
- Compass grid uses violet/rose/green color coding on dark nebula background
- Cards use bg-nebula, border-white/5, rounded-xl
- Affliction indicators: rose for danger, yellow-400 for warning, green for clear, violet for positive
- Framer Motion animations on zone hover and result load

## Ethical Safeguards

Per the skill document:
- Probabilistic language: "higher probability," never absolutes
- Empowerment framing: chart as mirror for self-awareness
- Professional referral: direct to structural engineers for major concerns
- Disclaimer on every remedy: "Traditional Vedic Vaastu guidance — not a substitute for structural engineering or professional consultation"
- No fatalistic predictions

## Scope Boundaries

**In scope:** Engine services, API endpoints, tests, /vaastu page, compass grid, diagnostic report, chat integration, property persistence

**Out of scope:** 3D room visualization, photo upload analysis, multi-property support, floor plan editor, compass detection via device sensors
