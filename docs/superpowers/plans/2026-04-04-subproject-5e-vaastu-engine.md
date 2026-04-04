# Sub-project 5E: Astro-Vaastu Engine Services — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build five Vaastu calculation services in the FastAPI engine — HIT calculator, 16-zone grid, Aayadi dimensional audit, spatial rules, and master diagnostic — so the AI-facing code receives pre-computed Vaastu analysis instead of relying on LLM guessing.

**Architecture:** Five Python modules under `engine/app/services/vaastu/` as a sub-package. Each module is a pure-function service with lookup tables and no AI dependency. Three new FastAPI routes expose them. All tested with pytest.

**Tech Stack:** Python 3.12, FastAPI, Pydantic v2, pytest

---

## File Structure

### New files to create:
```
engine/app/services/vaastu/__init__.py         — Package init, re-exports key functions
engine/app/services/vaastu/hit_calculator.py   — Compound degrees + HIT angle classification
engine/app/services/vaastu/vaastu_grid.py      — 16-zone system + 45 Devtas + planet-direction mapping
engine/app/services/vaastu/aayadi.py           — Dimensional harmony formulas (Aaya, Vyaya, Yoni)
engine/app/services/vaastu/spatial_rules.py    — Room placement rules + plant recommendations
engine/app/services/vaastu/diagnostic.py       — Master diagnostic combining all services
engine/app/routes/vaastu.py                    — POST /vaastu/analyze, /vaastu/aayadi, /vaastu/hits
engine/tests/test_vaastu_hits.py               — HIT calculator tests
engine/tests/test_vaastu_grid.py               — Grid + Devta tests
engine/tests/test_aayadi.py                    — Aayadi formula tests
engine/tests/test_spatial_rules.py             — Spatial rule tests
engine/tests/test_vaastu_diagnostic.py         — Integration tests
```

### Files to modify:
```
engine/app/models/schemas.py                   — Add Vaastu Pydantic models
engine/app/main.py                             — Register vaastu router
```

---

## Task 1: Vaastu Grid — 16-Zone System + Planet Directions

The grid is the foundation everything else maps to. Build it first.

**Files:**
- Create: `engine/app/services/vaastu/__init__.py`
- Create: `engine/app/services/vaastu/vaastu_grid.py`
- Create: `engine/tests/test_vaastu_grid.py`

- [ ] **Step 1: Write failing tests**

```python
# engine/tests/test_vaastu_grid.py
from app.services.vaastu.vaastu_grid import (
    ZONES,
    PLANET_DIRECTIONS,
    get_zone_for_planet,
    get_zone_for_direction,
    get_devtas_for_zone,
    map_afflictions,
)


def test_zones_has_16_entries():
    assert len(ZONES) == 16


def test_each_zone_has_required_fields():
    for zone in ZONES:
        assert "name" in zone
        assert "start_degree" in zone
        assert "end_degree" in zone
        assert "ruling_planet" in zone


def test_zones_cover_360_degrees():
    total = sum(z["end_degree"] - z["start_degree"] if z["end_degree"] > z["start_degree"]
                else (360 - z["start_degree"] + z["end_degree"])
                for z in ZONES)
    assert abs(total - 360.0) < 0.1


def test_planet_directions_has_9_planets():
    assert len(PLANET_DIRECTIONS) == 9
    for planet in ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"]:
        assert planet in PLANET_DIRECTIONS


def test_get_zone_for_planet_sun():
    zone = get_zone_for_planet("Sun")
    assert zone["name"] == "E"


def test_get_zone_for_planet_saturn():
    zone = get_zone_for_planet("Saturn")
    assert zone["name"] == "W"


def test_get_zone_for_planet_jupiter():
    zone = get_zone_for_planet("Jupiter")
    assert zone["name"] == "NE"


def test_get_zone_for_direction():
    zone = get_zone_for_direction("SE")
    assert zone["ruling_planet"] == "Venus"


def test_get_zone_for_direction_north():
    zone = get_zone_for_direction("N")
    assert zone["ruling_planet"] == "Mercury"


def test_get_devtas_for_zone_returns_list():
    devtas = get_devtas_for_zone("N")
    assert isinstance(devtas, list)
    assert len(devtas) >= 1
    for d in devtas:
        assert "name" in d
        assert "domain" in d


def test_get_devtas_for_zone_east():
    devtas = get_devtas_for_zone("E")
    names = [d["name"] for d in devtas]
    assert "Surya" in names


def test_map_afflictions_returns_zone_info():
    hits = [
        {"attacker": "Saturn", "victim": "Moon", "angle": 90.5, "type": "dangerous"}
    ]
    result = map_afflictions(hits)
    assert len(result) >= 1
    assert result[0]["zone"] == "W"  # Saturn's direction
    assert result[0]["hit_type"] == "dangerous"
    assert "devtas" in result[0]


def test_map_afflictions_empty_hits():
    result = map_afflictions([])
    assert result == []
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd engine && venv/Scripts/python -m pytest tests/test_vaastu_grid.py -v`
Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: Create the package init**

```python
# engine/app/services/vaastu/__init__.py
"""Astro-Vaastu calculation services."""
```

- [ ] **Step 4: Implement the Vaastu grid**

```python
# engine/app/services/vaastu/vaastu_grid.py
"""
16-zone Vaastu grid system with planet-direction mapping and 45 Devtas.
Each zone spans exactly 22.5 degrees of the compass.
"""

# 16 zones, each 22.5°, starting from North (0°)
ZONES = [
    {"name": "N",   "start_degree": 348.75, "end_degree": 11.25,  "ruling_planet": "Mercury", "element": "Water"},
    {"name": "NNE", "start_degree": 11.25,  "end_degree": 33.75,  "ruling_planet": None,      "element": "Water"},
    {"name": "NE",  "start_degree": 33.75,  "end_degree": 56.25,  "ruling_planet": "Jupiter", "element": "Water"},
    {"name": "ENE", "start_degree": 56.25,  "end_degree": 78.75,  "ruling_planet": None,      "element": "Fire"},
    {"name": "E",   "start_degree": 78.75,  "end_degree": 101.25, "ruling_planet": "Sun",     "element": "Fire"},
    {"name": "ESE", "start_degree": 101.25, "end_degree": 123.75, "ruling_planet": None,      "element": "Fire"},
    {"name": "SE",  "start_degree": 123.75, "end_degree": 146.25, "ruling_planet": "Venus",   "element": "Fire"},
    {"name": "SSE", "start_degree": 146.25, "end_degree": 168.75, "ruling_planet": None,      "element": "Earth"},
    {"name": "S",   "start_degree": 168.75, "end_degree": 191.25, "ruling_planet": "Mars",    "element": "Earth"},
    {"name": "SSW", "start_degree": 191.25, "end_degree": 213.75, "ruling_planet": None,      "element": "Earth"},
    {"name": "SW",  "start_degree": 213.75, "end_degree": 236.25, "ruling_planet": "Rahu",    "element": "Earth"},
    {"name": "WSW", "start_degree": 236.25, "end_degree": 258.75, "ruling_planet": None,      "element": "Air"},
    {"name": "W",   "start_degree": 258.75, "end_degree": 281.25, "ruling_planet": "Saturn",  "element": "Air"},
    {"name": "WNW", "start_degree": 281.25, "end_degree": 303.75, "ruling_planet": None,      "element": "Air"},
    {"name": "NW",  "start_degree": 303.75, "end_degree": 326.25, "ruling_planet": "Moon",    "element": "Air"},
    {"name": "NNW", "start_degree": 326.25, "end_degree": 348.75, "ruling_planet": None,      "element": "Water"},
]

# Planet to primary direction mapping
PLANET_DIRECTIONS: dict[str, str] = {
    "Sun": "E",
    "Moon": "NW",
    "Mars": "S",
    "Mercury": "N",
    "Jupiter": "NE",
    "Venus": "SE",
    "Saturn": "W",
    "Rahu": "SW",
    "Ketu": "NW",  # Shares NW with Moon
}

# 45 Devtas mapped to zones (simplified — key Devtas per cardinal/ordinal zone)
DEVTAS_45: dict[str, list[dict[str, str]]] = {
    "N":   [{"name": "Kubera", "domain": "Wealth and prosperity"},
            {"name": "Mukhya", "domain": "Leadership and authority"}],
    "NNE": [{"name": "Bhallata", "domain": "Health and healing"},
            {"name": "Soma", "domain": "Nourishment and calm"}],
    "NE":  [{"name": "Isha", "domain": "Spiritual growth and wisdom"},
            {"name": "Parjanya", "domain": "Rain and abundance"}],
    "ENE": [{"name": "Jayanta", "domain": "Victory and success"},
            {"name": "Indra", "domain": "Power and protection"}],
    "E":   [{"name": "Surya", "domain": "Vitality and confidence"},
            {"name": "Satya", "domain": "Truth and integrity"}],
    "ESE": [{"name": "Bhrisha", "domain": "Skill and craftsmanship"},
            {"name": "Akasha", "domain": "Space and expansion"}],
    "SE":  [{"name": "Agni", "domain": "Fire and transformation"},
            {"name": "Pusha", "domain": "Nourishment and growth"}],
    "SSE": [{"name": "Vitatha", "domain": "Deception awareness"},
            {"name": "Grihakshat", "domain": "Home protection"}],
    "S":   [{"name": "Yama", "domain": "Justice and dharma"},
            {"name": "Gandharva", "domain": "Arts and creativity"}],
    "SSW": [{"name": "Bhringraj", "domain": "Healing and rejuvenation"},
            {"name": "Mrigha", "domain": "Instinct and intuition"}],
    "SW":  [{"name": "Niriti", "domain": "Disposal and letting go"},
            {"name": "Dauwarik", "domain": "Gatekeeping and boundaries"}],
    "WSW": [{"name": "Sugriva", "domain": "Friendship and alliances"},
            {"name": "Pushpadanta", "domain": "Beauty and grace"}],
    "W":   [{"name": "Varuna", "domain": "Water and emotional balance"},
            {"name": "Asura", "domain": "Material strength"}],
    "WNW": [{"name": "Shosha", "domain": "Drying and discipline"},
            {"name": "Papayakshma", "domain": "Disease removal"}],
    "NW":  [{"name": "Vayu", "domain": "Air and communication"},
            {"name": "Naga", "domain": "Hidden treasures"}],
    "NNW": [{"name": "Roga", "domain": "Disease awareness"},
            {"name": "Aditi", "domain": "Cosmic motherhood"}],
}


def get_zone_for_planet(planet: str) -> dict:
    """Get the Vaastu zone associated with a planet."""
    direction = PLANET_DIRECTIONS.get(planet)
    if not direction:
        return ZONES[0]  # Default to N
    return next(z for z in ZONES if z["name"] == direction)


def get_zone_for_direction(direction: str) -> dict:
    """Get zone info by direction name."""
    return next((z for z in ZONES if z["name"] == direction), ZONES[0])


def get_devtas_for_zone(zone_name: str) -> list[dict[str, str]]:
    """Get the Devtas ruling a specific zone."""
    return DEVTAS_45.get(zone_name, [])


def map_afflictions(hits: list[dict]) -> list[dict]:
    """Map HIT results to physical Vaastu zones with Devta context."""
    afflictions = []
    for hit in hits:
        attacker = hit["attacker"]
        direction = PLANET_DIRECTIONS.get(attacker)
        if not direction:
            continue
        zone = get_zone_for_direction(direction)
        devtas = get_devtas_for_zone(direction)
        afflictions.append({
            "zone": direction,
            "zone_info": zone,
            "hit_type": hit["type"],
            "attacker": attacker,
            "victim": hit.get("victim", ""),
            "angle": hit.get("angle", 0),
            "devtas": devtas,
            "description": f"{attacker} in {direction} zone causing {hit['type']} impact via {hit.get('angle', 0):.1f}° aspect",
        })
    return afflictions
```

- [ ] **Step 5: Run tests**

Run: `cd engine && venv/Scripts/python -m pytest tests/test_vaastu_grid.py -v`
Expected: All 14 tests PASS

- [ ] **Step 6: Commit**

```bash
cd engine && git add app/services/vaastu/__init__.py app/services/vaastu/vaastu_grid.py tests/test_vaastu_grid.py
git commit -m "feat(engine): add 16-zone Vaastu grid with planet-direction mapping and 45 Devtas

22.5° per zone, 9 planet-to-direction assignments, Devta metadata
for each zone. Foundation for Astro-Vaastu diagnostic system."
```

---

## Task 2: HIT Calculator — Compound Degrees + Angular Relationships

Computes angular differences between planets and classifies them as HITs.

**Files:**
- Create: `engine/app/services/vaastu/hit_calculator.py`
- Create: `engine/tests/test_vaastu_hits.py`

- [ ] **Step 1: Write failing tests**

```python
# engine/tests/test_vaastu_hits.py
from app.services.vaastu.hit_calculator import (
    to_compound_degree,
    classify_angle,
    calculate_hits,
)

SANSKRIT_SIGNS = [
    "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
    "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
]


def test_compound_degree_aries_10():
    # 10° Mesha (Aries, index 0) = 10°
    assert to_compound_degree("Mesha", 10) == 10.0


def test_compound_degree_taurus_10():
    # 10° Vrishabha (Taurus, index 1) = 40°
    assert to_compound_degree("Vrishabha", 10) == 40.0


def test_compound_degree_pisces_29():
    # 29° Meena (Pisces, index 11) = 359°
    assert to_compound_degree("Meena", 29) == 359.0


def test_compound_degree_leo_15():
    # 15° Simha (Leo, index 4) = 135°
    assert to_compound_degree("Simha", 15) == 135.0


def test_classify_angle_killer():
    assert classify_angle(180.0) == "killer"
    assert classify_angle(175.0) == "killer"
    assert classify_angle(187.5) == "killer"


def test_classify_angle_dangerous():
    assert classify_angle(90.0) == "dangerous"
    assert classify_angle(86.0) == "dangerous"
    assert classify_angle(94.5) == "dangerous"


def test_classify_angle_obstacle():
    assert classify_angle(45.0) == "obstacle"
    assert classify_angle(42.5) == "obstacle"
    assert classify_angle(47.8) == "obstacle"


def test_classify_angle_best_support():
    assert classify_angle(120.0) == "best_support"
    assert classify_angle(116.0) == "best_support"
    assert classify_angle(124.5) == "best_support"


def test_classify_angle_friend():
    assert classify_angle(60.0) == "friend"
    assert classify_angle(57.5) == "friend"
    assert classify_angle(62.8) == "friend"


def test_classify_angle_positive():
    assert classify_angle(30.0) == "positive"
    assert classify_angle(27.5) == "positive"
    assert classify_angle(32.8) == "positive"


def test_classify_angle_none():
    assert classify_angle(15.0) is None
    assert classify_angle(70.0) is None
    assert classify_angle(150.0) is None


def test_calculate_hits_returns_primary_and_secondary():
    planets = [
        {"name": "Sun", "sign": "Mesha", "degree": 10},
        {"name": "Moon", "sign": "Tula", "degree": 10},  # 190° → 180° from Sun = killer
        {"name": "Mars", "sign": "Karka", "degree": 10},  # 100° → 90° from Sun = dangerous
        {"name": "Jupiter", "sign": "Simha", "degree": 10},  # 130° → 120° from Sun = best_support
    ]
    result = calculate_hits(planets, "Sun")
    assert "primary_hits" in result
    assert "secondary_hits" in result
    assert "positive_hits" in result
    assert result["dasha_lord"] == "Sun"


def test_calculate_hits_sun_moon_opposition():
    planets = [
        {"name": "Sun", "sign": "Mesha", "degree": 10},    # 10°
        {"name": "Moon", "sign": "Tula", "degree": 10},     # 190° → diff = 180° = killer
    ]
    result = calculate_hits(planets, "Sun")
    killer_hits = [h for h in result["primary_hits"] if h["type"] == "killer"]
    assert len(killer_hits) >= 1
    hit = killer_hits[0]
    assert hit["attacker"] in ("Sun", "Moon")
    assert hit["victim"] in ("Sun", "Moon")
    assert "direction" in hit


def test_calculate_hits_90_degree():
    planets = [
        {"name": "Sun", "sign": "Mesha", "degree": 10},    # 10°
        {"name": "Saturn", "sign": "Karka", "degree": 10},  # 100° → diff = 90° = dangerous
    ]
    result = calculate_hits(planets, "Sun")
    dangerous = [h for h in result["primary_hits"] if h["type"] == "dangerous"]
    assert len(dangerous) >= 1


def test_calculate_hits_positive_120():
    planets = [
        {"name": "Sun", "sign": "Mesha", "degree": 10},     # 10°
        {"name": "Jupiter", "sign": "Simha", "degree": 10},  # 130° → diff = 120° = best_support
    ]
    result = calculate_hits(planets, "Sun")
    positive = [h for h in result["positive_hits"] if h["type"] == "best_support"]
    assert len(positive) >= 1


def test_calculate_hits_dasha_lord_primary():
    planets = [
        {"name": "Moon", "sign": "Mesha", "degree": 10},    # 10°
        {"name": "Saturn", "sign": "Tula", "degree": 10},   # 190° → 180° from Moon = killer
        {"name": "Sun", "sign": "Karka", "degree": 10},     # 100° → 90° from Moon = dangerous
    ]
    result = calculate_hits(planets, "Moon")
    # Moon is dasha lord, so hits involving Moon are primary
    for hit in result["primary_hits"]:
        assert "Moon" in (hit["attacker"], hit["victim"])


def test_calculate_hits_no_hits_when_no_aspects():
    planets = [
        {"name": "Sun", "sign": "Mesha", "degree": 10},     # 10°
        {"name": "Moon", "sign": "Mesha", "degree": 25},     # 25° → diff = 15° = no hit
    ]
    result = calculate_hits(planets, "Sun")
    assert len(result["primary_hits"]) == 0
    assert len(result["positive_hits"]) == 0
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd engine && venv/Scripts/python -m pytest tests/test_vaastu_hits.py -v`
Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: Implement the HIT calculator**

```python
# engine/app/services/vaastu/hit_calculator.py
"""
HIT Calculator for Astro-Vaastu integration.
Converts planetary positions to compound degrees and classifies angular
relationships as positive or negative HITs using the 3-5-8 impact formula.
"""
from app.services.vaastu.vaastu_grid import PLANET_DIRECTIONS

SANSKRIT_SIGNS = [
    "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
    "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
]

# HIT classification: (target_angle, orb, type, is_negative)
HIT_DEFINITIONS = [
    (180.0, 8.0, "killer", True),
    (90.0,  5.0, "dangerous", True),
    (45.0,  3.0, "obstacle", True),
    (120.0, 5.0, "best_support", False),
    (60.0,  3.0, "friend", False),
    (30.0,  3.0, "positive", False),
]

NEGATIVE_TYPES = {"killer", "dangerous", "obstacle"}


def to_compound_degree(sign: str, degree: int | float) -> float:
    """Convert sign + degree to compound degree (0-360)."""
    sign_idx = SANSKRIT_SIGNS.index(sign)
    return sign_idx * 30.0 + degree


def _angular_difference(deg1: float, deg2: float) -> float:
    """Shortest angular distance between two compound degrees."""
    diff = abs(deg1 - deg2)
    return min(diff, 360.0 - diff)


def classify_angle(angle: float) -> str | None:
    """Classify an angular difference as a HIT type, or None if no match."""
    for target, orb, hit_type, _ in HIT_DEFINITIONS:
        if abs(angle - target) <= orb:
            return hit_type
    return None


def calculate_hits(
    planets: list[dict],
    active_dasha_lord: str,
) -> dict:
    """Calculate all planetary HITs and separate into primary/secondary.

    Args:
        planets: list of dicts with name, sign, degree
        active_dasha_lord: name of the currently active Dasha lord

    Returns:
        dict with primary_hits, secondary_hits, positive_hits, dasha_lord,
        dasha_lord_compound_degree
    """
    # Convert all planets to compound degrees
    positions: dict[str, float] = {}
    for p in planets:
        positions[p["name"]] = to_compound_degree(p["sign"], p["degree"])

    primary_hits = []
    secondary_hits = []
    positive_hits = []

    # Check all planet pairs
    planet_names = list(positions.keys())
    for i in range(len(planet_names)):
        for j in range(i + 1, len(planet_names)):
            p1 = planet_names[i]
            p2 = planet_names[j]
            angle = _angular_difference(positions[p1], positions[p2])
            hit_type = classify_angle(angle)

            if hit_type is None:
                continue

            # Determine attacker/victim (the one receiving the aspect is the victim)
            # In HIT theory, both planets are affected, but we label for clarity
            hit = {
                "attacker": p1,
                "victim": p2,
                "angle": round(angle, 1),
                "type": hit_type,
                "direction": PLANET_DIRECTIONS.get(p1, "N"),
            }

            is_negative = hit_type in NEGATIVE_TYPES
            involves_dasha_lord = active_dasha_lord in (p1, p2)

            if is_negative:
                if involves_dasha_lord:
                    primary_hits.append(hit)
                else:
                    secondary_hits.append(hit)
            else:
                positive_hits.append(hit)

    return {
        "primary_hits": primary_hits,
        "secondary_hits": secondary_hits,
        "positive_hits": positive_hits,
        "dasha_lord": active_dasha_lord,
        "dasha_lord_compound_degree": positions.get(active_dasha_lord, 0.0),
    }
```

- [ ] **Step 4: Run tests**

Run: `cd engine && venv/Scripts/python -m pytest tests/test_vaastu_hits.py -v`
Expected: All 18 tests PASS

- [ ] **Step 5: Commit**

```bash
cd engine && git add app/services/vaastu/hit_calculator.py tests/test_vaastu_hits.py
git commit -m "feat(engine): add HIT calculator for Astro-Vaastu angular analysis

Compound degree conversion, 3-5-8 impact formula (180°/90°/45° negative,
120°/60°/30° positive), primary vs secondary HIT classification based
on active Dasha lord."
```

---

## Task 3: Aayadi Calculator — Dimensional Harmony

**Files:**
- Create: `engine/app/services/vaastu/aayadi.py`
- Create: `engine/tests/test_aayadi.py`

- [ ] **Step 1: Write failing tests**

```python
# engine/tests/test_aayadi.py
from app.services.vaastu.aayadi import calculate_aayadi


def test_aayadi_returns_required_fields():
    result = calculate_aayadi(length_ft=30.0, breadth_ft=25.0, user_nakshatra="Ashwini")
    assert "aaya" in result
    assert "vyaya" in result
    assert "aaya_greater" in result
    assert "yoni" in result
    assert "footprint_effects" in result
    assert "overall_harmony" in result
    assert "description" in result


def test_aaya_formula():
    # Aaya = (length * 8) % 12
    # 30 * 8 = 240, 240 % 12 = 0 → remainder 0 means 12 (full cycle)
    result = calculate_aayadi(length_ft=30.0, breadth_ft=25.0, user_nakshatra="Ashwini")
    assert result["aaya"] == (30 * 8) % 12


def test_vyaya_formula():
    # Vyaya = (breadth * 9) % 10
    # 25 * 9 = 225, 225 % 10 = 5
    result = calculate_aayadi(length_ft=30.0, breadth_ft=25.0, user_nakshatra="Ashwini")
    assert result["vyaya"] == (25 * 9) % 10


def test_aaya_greater_than_vyaya():
    # 40 * 8 = 320, 320 % 12 = 8 (aaya)
    # 20 * 9 = 180, 180 % 10 = 0 (vyaya)
    result = calculate_aayadi(length_ft=40.0, breadth_ft=20.0, user_nakshatra="Ashwini")
    assert result["aaya"] == 8
    assert result["vyaya"] == 0
    assert result["aaya_greater"] is True
    assert result["overall_harmony"] == "favorable"


def test_aaya_less_than_vyaya():
    # 15 * 8 = 120, 120 % 12 = 0 (aaya)
    # 33 * 9 = 297, 297 % 10 = 7 (vyaya)
    result = calculate_aayadi(length_ft=15.0, breadth_ft=33.0, user_nakshatra="Ashwini")
    assert result["aaya"] == 0
    assert result["vyaya"] == 7
    assert result["aaya_greater"] is False
    assert result["overall_harmony"] == "unfavorable"


def test_yoni_formula():
    # Yoni = (perimeter * 3) % 8
    # perimeter = 2 * (30 + 25) = 110
    # 110 * 3 = 330, 330 % 8 = 2
    result = calculate_aayadi(length_ft=30.0, breadth_ft=25.0, user_nakshatra="Ashwini")
    assert result["yoni"]["value"] == 2
    assert "type" in result["yoni"]
    assert "interpretation" in result["yoni"]


def test_yoni_types():
    # Test all 8 yoni types exist by varying inputs
    result = calculate_aayadi(length_ft=30.0, breadth_ft=25.0, user_nakshatra="Ashwini")
    assert result["yoni"]["type"] in (
        "Dhwaja", "Dhooma", "Simha", "Shwana",
        "Vrishabha", "Khara", "Gaja", "Kaaka",
    )


def test_footprint_30ft_lakshmi():
    result = calculate_aayadi(length_ft=30.0, breadth_ft=25.0, user_nakshatra="Ashwini")
    effects = [e["effect"] for e in result["footprint_effects"]]
    assert any("Lakshmi" in e for e in effects)


def test_footprint_34ft_loss():
    result = calculate_aayadi(length_ft=34.0, breadth_ft=25.0, user_nakshatra="Ashwini")
    effects = [e["effect"] for e in result["footprint_effects"]]
    assert any("Loss" in e for e in effects)


def test_description_is_meaningful():
    result = calculate_aayadi(length_ft=30.0, breadth_ft=25.0, user_nakshatra="Ashwini")
    assert isinstance(result["description"], str)
    assert len(result["description"]) > 20
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd engine && venv/Scripts/python -m pytest tests/test_aayadi.py -v`
Expected: FAIL

- [ ] **Step 3: Implement the Aayadi calculator**

```python
# engine/app/services/vaastu/aayadi.py
"""
Aayadi Calculator — Dimensional harmony audit for Vaastu.
Computes Aaya (income), Vyaya (loss), and Yoni (energy flow)
from building dimensions and the user's birth nakshatra.
"""

# Yoni types by remainder (1-8, with 0 treated as 8)
YONI_TYPES = {
    0: {"type": "Kaaka", "interpretation": "Crow — restlessness, but adaptability and intelligence"},
    1: {"type": "Dhwaja", "interpretation": "Flag — honor, recognition, and victory"},
    2: {"type": "Dhooma", "interpretation": "Smoke — obstacles and slow progress, needs remedies"},
    3: {"type": "Simha", "interpretation": "Lion — courage, authority, and strength"},
    4: {"type": "Shwana", "interpretation": "Dog — loyalty and protection, but quarrels possible"},
    5: {"type": "Vrishabha", "interpretation": "Bull — wealth, stability, and prosperity"},
    6: {"type": "Khara", "interpretation": "Donkey — hard work with delayed rewards"},
    7: {"type": "Gaja", "interpretation": "Elephant — wealth, wisdom, and stability"},
}

# Auspicious/inauspicious footprint measurements in feet
FOOTPRINT_EFFECTS: dict[int, str] = {
    10: "Prosperity and happiness",
    12: "Growth and development",
    16: "Vehicle and comfort gains",
    20: "Wealth accumulation",
    24: "Gain of gold and precious items",
    27: "Grain abundance",
    30: "Lakshmi's Blessing — exceptional fortune",
    32: "Success in all endeavors",
    36: "Health and longevity",
    40: "Abundance of wealth",
    # Inauspicious
    11: "Fear and anxiety",
    13: "Quarrels and disputes",
    17: "Widowhood or separation risk",
    19: "Loss of wealth",
    22: "Mental disturbance",
    25: "Loss and poverty",
    29: "Cruelty and harshness",
    31: "Bad reputation",
    34: "Loss of Home — serious financial setback",
    37: "Enemies and conflicts",
}


def calculate_aayadi(
    length_ft: float,
    breadth_ft: float,
    user_nakshatra: str,
) -> dict:
    """Calculate Aayadi dimensional harmony.

    Args:
        length_ft: Building length in feet
        breadth_ft: Building breadth in feet
        user_nakshatra: User's birth nakshatra name

    Returns:
        dict with aaya, vyaya, aaya_greater, yoni, footprint_effects,
        overall_harmony, description
    """
    length = int(round(length_ft))
    breadth = int(round(breadth_ft))
    perimeter = 2 * (length + breadth)

    # Aaya (Income indicator)
    aaya = (length * 8) % 12

    # Vyaya (Expenditure indicator)
    vyaya = (breadth * 9) % 10

    # Yoni (Energy flow)
    yoni_value = (perimeter * 3) % 8
    yoni_data = YONI_TYPES.get(yoni_value, YONI_TYPES[0])

    # Aaya vs Vyaya comparison
    aaya_greater = aaya > vyaya if aaya != vyaya else aaya >= vyaya

    # Footprint effects
    footprint_effects = []
    if length in FOOTPRINT_EFFECTS:
        footprint_effects.append({
            "dimension": "length",
            "value": length,
            "effect": FOOTPRINT_EFFECTS[length],
        })
    if breadth in FOOTPRINT_EFFECTS:
        footprint_effects.append({
            "dimension": "breadth",
            "value": breadth,
            "effect": FOOTPRINT_EFFECTS[breadth],
        })

    # Overall assessment
    if aaya > vyaya:
        overall_harmony = "favorable"
        harmony_desc = f"Aaya ({aaya}) exceeds Vyaya ({vyaya}) — income potential exceeds expenditure, indicating financial growth."
    elif aaya == vyaya:
        overall_harmony = "neutral"
        harmony_desc = f"Aaya ({aaya}) equals Vyaya ({vyaya}) — balanced but no net growth. Consider adjusting dimensions."
    else:
        overall_harmony = "unfavorable"
        harmony_desc = f"Vyaya ({vyaya}) exceeds Aaya ({aaya}) — expenditure tendency exceeds income. Dimensional adjustment recommended."

    description = f"Building dimensions {length_ft}ft × {breadth_ft}ft. {harmony_desc} Yoni: {yoni_data['type']} — {yoni_data['interpretation']}."

    return {
        "aaya": aaya,
        "vyaya": vyaya,
        "aaya_greater": aaya_greater,
        "yoni": {"type": yoni_data["type"], "value": yoni_value, "interpretation": yoni_data["interpretation"]},
        "footprint_effects": footprint_effects,
        "overall_harmony": overall_harmony,
        "description": description,
    }
```

- [ ] **Step 4: Run tests**

Run: `cd engine && venv/Scripts/python -m pytest tests/test_aayadi.py -v`
Expected: All 10 tests PASS

- [ ] **Step 5: Commit**

```bash
cd engine && git add app/services/vaastu/aayadi.py tests/test_aayadi.py
git commit -m "feat(engine): add Aayadi dimensional harmony calculator

Aaya/Vyaya/Yoni formulas from building dimensions. 8 Yoni types,
footprint effects for specific measurements, harmony assessment."
```

---

## Task 4: Spatial Rules — Room Placement Validation

**Files:**
- Create: `engine/app/services/vaastu/spatial_rules.py`
- Create: `engine/tests/test_spatial_rules.py`

- [ ] **Step 1: Write failing tests**

```python
# engine/tests/test_spatial_rules.py
from app.services.vaastu.spatial_rules import check_spatial_rules


def test_returns_required_fields():
    result = check_spatial_rules(entrance_direction="N", floor_level="ground")
    assert "findings" in result
    assert "plant_recommendations" in result
    assert "overall_status" in result


def test_entrance_north_favorable():
    result = check_spatial_rules(
        entrance_direction="N",
        floor_level="ground",
        user_name_initial="A",
    )
    entrance_finding = next(f for f in result["findings"] if f["rule"] == "Main Entrance")
    assert entrance_finding["status"] == "favorable"


def test_entrance_sw_unfavorable():
    result = check_spatial_rules(entrance_direction="SW", floor_level="ground")
    entrance_finding = next(f for f in result["findings"] if f["rule"] == "Main Entrance")
    assert entrance_finding["status"] == "unfavorable"


def test_kitchen_se_favorable():
    result = check_spatial_rules(
        entrance_direction="N",
        floor_level="ground",
        kitchen_zone="SE",
    )
    kitchen_finding = next(f for f in result["findings"] if f["rule"] == "Kitchen Placement")
    assert kitchen_finding["status"] == "favorable"


def test_kitchen_ne_unfavorable():
    result = check_spatial_rules(
        entrance_direction="N",
        floor_level="ground",
        kitchen_zone="NE",
    )
    kitchen_finding = next(f for f in result["findings"] if f["rule"] == "Kitchen Placement")
    assert kitchen_finding["status"] == "unfavorable"


def test_toilet_ne_unfavorable():
    result = check_spatial_rules(
        entrance_direction="N",
        floor_level="ground",
        toilet_zones=["NE"],
    )
    toilet_finding = next(f for f in result["findings"] if f["rule"] == "Toilet Placement")
    assert toilet_finding["status"] == "unfavorable"


def test_brahmasthan_open_favorable():
    result = check_spatial_rules(
        entrance_direction="N",
        floor_level="ground",
        brahmasthan_status="open",
    )
    brahma_finding = next(f for f in result["findings"] if f["rule"] == "Brahmasthan")
    assert brahma_finding["status"] == "favorable"


def test_brahmasthan_walled_unfavorable():
    result = check_spatial_rules(
        entrance_direction="N",
        floor_level="ground",
        brahmasthan_status="walled",
    )
    brahma_finding = next(f for f in result["findings"] if f["rule"] == "Brahmasthan")
    assert brahma_finding["status"] == "unfavorable"


def test_slope_ne_favorable():
    result = check_spatial_rules(
        entrance_direction="N",
        floor_level="ground",
        slope_direction="NE",
    )
    slope_finding = next(f for f in result["findings"] if f["rule"] == "Plot Slope")
    assert slope_finding["status"] == "favorable"


def test_slope_sw_unfavorable():
    result = check_spatial_rules(
        entrance_direction="N",
        floor_level="ground",
        slope_direction="SW",
    )
    slope_finding = next(f for f in result["findings"] if f["rule"] == "Plot Slope")
    assert slope_finding["status"] == "unfavorable"


def test_plant_recommendations_returned():
    result = check_spatial_rules(entrance_direction="N", floor_level="ground")
    assert isinstance(result["plant_recommendations"], list)
    for rec in result["plant_recommendations"]:
        assert "plant" in rec
        assert "zone" in rec
        assert "purpose" in rec


def test_overall_status_values():
    result = check_spatial_rules(entrance_direction="N", floor_level="ground")
    assert result["overall_status"] in ("favorable", "mostly_favorable", "needs_attention", "unfavorable")
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd engine && venv/Scripts/python -m pytest tests/test_spatial_rules.py -v`
Expected: FAIL

- [ ] **Step 3: Implement spatial rules**

The implementer should create `engine/app/services/vaastu/spatial_rules.py` with:

1. **Entrance rules:** Favorable directions: N, NE, E, NW. Acceptable: W, SE. Unfavorable: S, SW, SSW, SSE. Name-initial mapping: vowels (A/I/O/U/E) favor N/NE/E/W.

2. **Kitchen rules:** Favorable: SE (Agneya, fire element). Acceptable: NW, S. Unfavorable: NE, SW, N.

3. **Toilet rules:** Must not be in NE or center (Brahmasthan). SW, S, W are acceptable. NE is strongly unfavorable.

4. **Brahmasthan rules:** "open" = favorable, "pillared" = warning (restricts energy), "walled" = unfavorable (blocks energy completely).

5. **Slope rules:** Favorable: NE, N, E (water flows to prosperity). Unfavorable: SW, S, W (energy drains).

6. **Plant recommendations:** Return 3-4 standard recommendations:
   - Snake Plant in N/NE for clarity (IT professionals)
   - Tulsi in NE for spiritual growth
   - Money Plant in SE for financial flow
   - Neem in N for purification

7. **Overall status:** Count favorable/unfavorable findings. All favorable → "favorable", mostly → "mostly_favorable", mixed → "needs_attention", mostly bad → "unfavorable".

Function signature:
```python
def check_spatial_rules(
    entrance_direction: str,
    floor_level: str,
    kitchen_zone: str | None = None,
    toilet_zones: list[str] | None = None,
    brahmasthan_status: str | None = None,
    slope_direction: str | None = None,
    user_name_initial: str | None = None,
) -> dict:
```

- [ ] **Step 4: Run tests**

Run: `cd engine && venv/Scripts/python -m pytest tests/test_spatial_rules.py -v`
Expected: All 12 tests PASS

- [ ] **Step 5: Commit**

```bash
cd engine && git add app/services/vaastu/spatial_rules.py tests/test_spatial_rules.py
git commit -m "feat(engine): add Vaastu spatial rules for room placement validation

Entrance, kitchen, toilet, Brahmasthan, and slope direction rules.
Plant recommendations. Overall status assessment."
```

---

## Task 5: Master Diagnostic — Combining All Services

**Files:**
- Create: `engine/app/services/vaastu/diagnostic.py`
- Create: `engine/tests/test_vaastu_diagnostic.py`

- [ ] **Step 1: Write failing tests**

```python
# engine/tests/test_vaastu_diagnostic.py
from app.services.vaastu.diagnostic import run_vaastu_diagnostic


def _make_vedic_chart():
    """Create a minimal Vedic chart for testing."""
    return {
        "planets": [
            {"name": "Sun", "sign": "Mesha", "degree": 10, "house": 1},
            {"name": "Moon", "sign": "Tula", "degree": 10, "house": 7},
            {"name": "Mars", "sign": "Karka", "degree": 15, "house": 4},
            {"name": "Mercury", "sign": "Mesha", "degree": 25, "house": 1},
            {"name": "Jupiter", "sign": "Simha", "degree": 10, "house": 5},
            {"name": "Venus", "sign": "Mithuna", "degree": 20, "house": 3},
            {"name": "Saturn", "sign": "Makara", "degree": 5, "house": 10},
            {"name": "Rahu", "sign": "Vrishabha", "degree": 15, "house": 2},
            {"name": "Ketu", "sign": "Vrishchika", "degree": 15, "house": 8},
        ],
        "dasha": {
            "current_mahadasha": {"planet": "Moon", "start": "2022-01-01", "end": "2032-01-01"},
            "current_antardasha": {"planet": "Saturn", "start": "2025-06-01", "end": "2027-01-01"},
        },
    }


def test_diagnostic_returns_required_fields():
    result = run_vaastu_diagnostic(
        vedic_chart=_make_vedic_chart(),
        property={"length": 30, "breadth": 25, "entrance_direction": "N", "floor_level": "ground"},
        user_nakshatra="Ashwini",
    )
    assert "summary" in result
    assert "aayadi" in result
    assert "hits" in result
    assert "zone_map" in result
    assert "spatial_findings" in result
    assert "remedies" in result
    assert "disclaimer" in result


def test_diagnostic_zone_map_has_16_zones():
    result = run_vaastu_diagnostic(
        vedic_chart=_make_vedic_chart(),
        property={"length": 30, "breadth": 25, "entrance_direction": "N", "floor_level": "ground"},
        user_nakshatra="Ashwini",
    )
    assert len(result["zone_map"]) == 16


def test_diagnostic_zone_map_has_status():
    result = run_vaastu_diagnostic(
        vedic_chart=_make_vedic_chart(),
        property={"length": 30, "breadth": 25, "entrance_direction": "N", "floor_level": "ground"},
        user_nakshatra="Ashwini",
    )
    for zone in result["zone_map"]:
        assert "zone" in zone
        assert "status" in zone
        assert zone["status"] in ("clear", "afflicted", "warning", "positive")


def test_diagnostic_has_hits():
    result = run_vaastu_diagnostic(
        vedic_chart=_make_vedic_chart(),
        property={"length": 30, "breadth": 25, "entrance_direction": "N", "floor_level": "ground"},
        user_nakshatra="Ashwini",
    )
    # Sun at 10° and Moon at 190° → 180° killer hit → should appear
    assert len(result["hits"]["primary_hits"]) > 0


def test_diagnostic_has_aayadi():
    result = run_vaastu_diagnostic(
        vedic_chart=_make_vedic_chart(),
        property={"length": 30, "breadth": 25, "entrance_direction": "N", "floor_level": "ground"},
        user_nakshatra="Ashwini",
    )
    assert "aaya" in result["aayadi"]
    assert "vyaya" in result["aayadi"]


def test_diagnostic_remedies_for_afflicted_zones():
    result = run_vaastu_diagnostic(
        vedic_chart=_make_vedic_chart(),
        property={"length": 30, "breadth": 25, "entrance_direction": "N", "floor_level": "ground"},
        user_nakshatra="Ashwini",
    )
    if any(z["status"] == "afflicted" for z in result["zone_map"]):
        assert len(result["remedies"]) > 0
        for remedy in result["remedies"]:
            assert "zone" in remedy
            assert "remedy" in remedy
            assert "reason" in remedy


def test_diagnostic_with_room_details():
    result = run_vaastu_diagnostic(
        vedic_chart=_make_vedic_chart(),
        property={"length": 30, "breadth": 25, "entrance_direction": "N", "floor_level": "ground"},
        room_details={"kitchen_zone": "SE", "brahmasthan_status": "open"},
        user_nakshatra="Ashwini",
    )
    assert len(result["spatial_findings"]) > 0


def test_diagnostic_without_room_details():
    result = run_vaastu_diagnostic(
        vedic_chart=_make_vedic_chart(),
        property={"length": 30, "breadth": 25, "entrance_direction": "N", "floor_level": "ground"},
        user_nakshatra="Ashwini",
    )
    # Still has spatial findings (entrance at minimum)
    assert isinstance(result["spatial_findings"], list)


def test_diagnostic_disclaimer_present():
    result = run_vaastu_diagnostic(
        vedic_chart=_make_vedic_chart(),
        property={"length": 30, "breadth": 25, "entrance_direction": "N", "floor_level": "ground"},
        user_nakshatra="Ashwini",
    )
    assert "not a substitute" in result["disclaimer"].lower() or "traditional" in result["disclaimer"].lower()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd engine && venv/Scripts/python -m pytest tests/test_vaastu_diagnostic.py -v`
Expected: FAIL

- [ ] **Step 3: Implement the diagnostic**

The implementer should create `engine/app/services/vaastu/diagnostic.py` that:

1. Extracts active Dasha lord from `vedic_chart["dasha"]["current_mahadasha"]["planet"]`
2. Runs `calculate_hits(vedic_chart["planets"], dasha_lord)`
3. Maps afflictions to zones via `map_afflictions(hits["primary_hits"])`
4. Runs `calculate_aayadi(property["length"], property["breadth"], user_nakshatra)`
5. If room_details provided, runs `check_spatial_rules(...)` with entrance from property + room details
6. Otherwise, runs `check_spatial_rules(entrance_direction=property["entrance_direction"], floor_level=property["floor_level"])`
7. Builds `zone_map`: 16 entries, one per zone. Status is "afflicted" if a primary negative HIT maps there, "warning" if secondary HIT or spatial warning, "positive" if a positive HIT maps there, "clear" otherwise.
8. Generates remedies: for each afflicted zone, suggest a remedy based on the Devta and hit type:
   - Killer/dangerous → "Place Copper Pyramid in {zone} zone to contain the {attacker} energy"
   - Obstacle → "Place a Yantra for {devta} in the {zone} zone"
   - Dasha-activation for positive zones → "Enhance {zone} zone with {planet}-related items during {dasha_lord} Dasha"
9. Returns full diagnostic dict with disclaimer.

Function signature:
```python
def run_vaastu_diagnostic(
    vedic_chart: dict,
    property: dict,
    user_nakshatra: str,
    room_details: dict | None = None,
    user_name_initial: str | None = None,
) -> dict:
```

- [ ] **Step 4: Run tests**

Run: `cd engine && venv/Scripts/python -m pytest tests/test_vaastu_diagnostic.py -v`
Expected: All 9 tests PASS

- [ ] **Step 5: Commit**

```bash
cd engine && git add app/services/vaastu/diagnostic.py tests/test_vaastu_diagnostic.py
git commit -m "feat(engine): add master Vaastu diagnostic combining all services

Orchestrates HIT calculator, zone mapping, Aayadi, and spatial rules
into a unified diagnostic with zone status map and remedies."
```

---

## Task 6: Pydantic Schemas + FastAPI Routes

Wire the Vaastu services to HTTP endpoints.

**Files:**
- Modify: `engine/app/models/schemas.py` — append Vaastu models
- Create: `engine/app/routes/vaastu.py`
- Modify: `engine/app/main.py` — register router

- [ ] **Step 1: Append Pydantic models to schemas.py**

Add after the existing `VedicCompatibilityResponse` class at the end of schemas.py:

```python
# --- Vaastu models ---

class VaastuPropertyInput(BaseModel):
    length: float
    breadth: float
    entrance_direction: str
    floor_level: str = "ground"


class VaastuRoomDetails(BaseModel):
    kitchen_zone: str | None = None
    toilet_zones: list[str] | None = None
    brahmasthan_status: str | None = None
    slope_direction: str | None = None


class VaastuAnalyzeRequest(BaseModel):
    property: VaastuPropertyInput
    room_details: VaastuRoomDetails | None = None
    user_nakshatra: str
    user_name_initial: str | None = None
    planets: list[VedicPlanetResponse]
    dasha_lord: str


class VaastuAayadiRequest(BaseModel):
    length: float
    breadth: float
    user_nakshatra: str


class VaastuHitsRequest(BaseModel):
    planets: list[VedicPlanetResponse]
    dasha_lord: str


class VaastuHitResult(BaseModel):
    attacker: str
    victim: str
    angle: float
    type: str
    direction: str


class VaastuZoneStatus(BaseModel):
    zone: str
    status: str
    planet: str | None = None
    hit_type: str | None = None
    devtas: list[dict] = []


class VaastuRemedy(BaseModel):
    zone: str
    type: str
    remedy: str
    reason: str


class AayadiResult(BaseModel):
    aaya: int
    vyaya: int
    aaya_greater: bool
    yoni: dict
    footprint_effects: list[dict]
    overall_harmony: str
    description: str


class VaastuHitsResponse(BaseModel):
    primary_hits: list[VaastuHitResult]
    secondary_hits: list[VaastuHitResult]
    positive_hits: list[VaastuHitResult]
    dasha_lord: str


class VaastuDiagnosticResponse(BaseModel):
    summary: str
    aayadi: AayadiResult
    hits: VaastuHitsResponse
    zone_map: list[VaastuZoneStatus]
    spatial_findings: list[dict]
    remedies: list[VaastuRemedy]
    plant_recommendations: list[dict]
    disclaimer: str
```

- [ ] **Step 2: Create the route file**

```python
# engine/app/routes/vaastu.py
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.models.schemas import (
    VaastuAnalyzeRequest, VaastuDiagnosticResponse,
    VaastuAayadiRequest, AayadiResult,
    VaastuHitsRequest, VaastuHitsResponse,
    ErrorResponse,
)
from app.services.vaastu.diagnostic import run_vaastu_diagnostic
from app.services.vaastu.aayadi import calculate_aayadi
from app.services.vaastu.hit_calculator import calculate_hits

router = APIRouter()


@router.post(
    "/vaastu/analyze",
    response_model=VaastuDiagnosticResponse,
    responses={500: {"model": ErrorResponse}},
)
async def vaastu_analyze(request: VaastuAnalyzeRequest):
    try:
        vedic_chart = {
            "planets": [p.model_dump() for p in request.planets],
            "dasha": {
                "current_mahadasha": {"planet": request.dasha_lord},
            },
        }
        room_details = request.room_details.model_dump() if request.room_details else None
        result = run_vaastu_diagnostic(
            vedic_chart=vedic_chart,
            property=request.property.model_dump(),
            user_nakshatra=request.user_nakshatra,
            room_details=room_details,
            user_name_initial=request.user_name_initial,
        )
        return result
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": "calculation_failed", "detail": str(e)},
        )


@router.post(
    "/vaastu/aayadi",
    response_model=AayadiResult,
    responses={500: {"model": ErrorResponse}},
)
async def vaastu_aayadi(request: VaastuAayadiRequest):
    try:
        result = calculate_aayadi(request.length, request.breadth, request.user_nakshatra)
        return result
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": "calculation_failed", "detail": str(e)},
        )


@router.post(
    "/vaastu/hits",
    response_model=VaastuHitsResponse,
    responses={500: {"model": ErrorResponse}},
)
async def vaastu_hits(request: VaastuHitsRequest):
    try:
        planets = [p.model_dump() for p in request.planets]
        result = calculate_hits(planets, request.dasha_lord)
        return result
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": "calculation_failed", "detail": str(e)},
        )
```

- [ ] **Step 3: Register router in main.py**

Add after the vedic_compat_router import:
```python
from app.routes.vaastu import router as vaastu_router
```

And after `app.include_router(vedic_compat_router)`:
```python
app.include_router(vaastu_router)
```

- [ ] **Step 4: Commit**

```bash
cd engine && git add app/models/schemas.py app/routes/vaastu.py app/main.py
git commit -m "feat(engine): add Vaastu API routes and Pydantic schemas

POST /vaastu/analyze (full diagnostic), POST /vaastu/aayadi (dimensions),
POST /vaastu/hits (angular analysis). Registered in main app."
```

---

## Task 7: Route Integration Tests + Final Verification

**Files:**
- Modify: `engine/tests/test_vedic_enhanced.py` — add Vaastu route tests

- [ ] **Step 1: Add route integration tests**

Append to `engine/tests/test_vedic_enhanced.py`:

```python
@pytest.mark.asyncio
async def test_vaastu_analyze_endpoint(client):
    response = await client.post("/vaastu/analyze", json={
        "property": {"length": 30, "breadth": 25, "entrance_direction": "N", "floor_level": "ground"},
        "user_nakshatra": "Ashwini",
        "dasha_lord": "Moon",
        "planets": [
            {"name": "Sun", "sign": "Mesha", "degree": 10, "house": 1, "nakshatra": "Ashwini", "retrograde": False},
            {"name": "Moon", "sign": "Tula", "degree": 10, "house": 7, "nakshatra": "Swati", "retrograde": False},
            {"name": "Mars", "sign": "Karka", "degree": 15, "house": 4, "nakshatra": "Pushya", "retrograde": False},
            {"name": "Mercury", "sign": "Mesha", "degree": 25, "house": 1, "nakshatra": "Bharani", "retrograde": False},
            {"name": "Jupiter", "sign": "Simha", "degree": 10, "house": 5, "nakshatra": "Magha", "retrograde": False},
            {"name": "Venus", "sign": "Mithuna", "degree": 20, "house": 3, "nakshatra": "Ardra", "retrograde": False},
            {"name": "Saturn", "sign": "Makara", "degree": 5, "house": 10, "nakshatra": "Uttara Ashadha", "retrograde": False},
            {"name": "Rahu", "sign": "Vrishabha", "degree": 15, "house": 2, "nakshatra": "Rohini", "retrograde": True},
            {"name": "Ketu", "sign": "Vrishchika", "degree": 15, "house": 8, "nakshatra": "Anuradha", "retrograde": True},
        ],
    }, headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert len(data["zone_map"]) == 16
    assert "aayadi" in data
    assert "remedies" in data
    assert "disclaimer" in data


@pytest.mark.asyncio
async def test_vaastu_aayadi_endpoint(client):
    response = await client.post("/vaastu/aayadi", json={
        "length": 30.0,
        "breadth": 25.0,
        "user_nakshatra": "Ashwini",
    }, headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert "aaya" in data
    assert "vyaya" in data
    assert "yoni" in data


@pytest.mark.asyncio
async def test_vaastu_hits_endpoint(client):
    response = await client.post("/vaastu/hits", json={
        "dasha_lord": "Moon",
        "planets": [
            {"name": "Sun", "sign": "Mesha", "degree": 10, "house": 1, "nakshatra": "Ashwini", "retrograde": False},
            {"name": "Moon", "sign": "Tula", "degree": 10, "house": 7, "nakshatra": "Swati", "retrograde": False},
        ],
    }, headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert "primary_hits" in data
    assert "dasha_lord" in data
```

- [ ] **Step 2: Run ALL engine tests**

Run: `cd engine && venv/Scripts/python -m pytest -v --tb=short`
Expected: All tests pass (existing 94 + new Vaastu tests)

- [ ] **Step 3: Verify engine starts with new routes**

Run: `cd engine && venv/Scripts/python -c "from app.main import app; print('App loaded with', len(app.routes), 'routes')"`
Expected: Route count increased by 3

- [ ] **Step 4: Commit**

```bash
cd engine && git add tests/test_vedic_enhanced.py
git commit -m "feat(engine): add Vaastu route integration tests

Tests for POST /vaastu/analyze, /vaastu/aayadi, /vaastu/hits endpoints."
```

---

## Decomposition Note

This plan covers **Sub-project 5E (Vaastu Engine)** only. The frontend (5F) will be planned separately after 5E is complete:

- **5F:** `/vaastu` premium page with progressive input form, 16-zone compass grid visualization, diagnostic report, chat integration with Vaastu context
