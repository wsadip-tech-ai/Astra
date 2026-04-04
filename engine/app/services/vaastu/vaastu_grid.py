"""
16-Zone Vaastu Grid — 22.5° per zone, starting from N at 348.75°.
Includes planet-direction assignments and 45 Devtas metadata.
"""

from typing import Any

# ---------------------------------------------------------------------------
# 16 Zones — each 22.5°, covering a full 360° circle
# N straddles 0° so its start_degree > end_degree (wrap-around handled)
# ---------------------------------------------------------------------------
ZONES: list[dict[str, Any]] = [
    {"name": "N",   "start_degree": 348.75, "end_degree":  11.25, "ruling_planet": "Mercury", "element": "Water"},
    {"name": "NNE", "start_degree":  11.25, "end_degree":  33.75, "ruling_planet": None,       "element": "Water"},
    {"name": "NE",  "start_degree":  33.75, "end_degree":  56.25, "ruling_planet": "Jupiter",  "element": "Water"},
    {"name": "ENE", "start_degree":  56.25, "end_degree":  78.75, "ruling_planet": None,       "element": "Fire"},
    {"name": "E",   "start_degree":  78.75, "end_degree": 101.25, "ruling_planet": "Sun",      "element": "Fire"},
    {"name": "ESE", "start_degree": 101.25, "end_degree": 123.75, "ruling_planet": None,       "element": "Fire"},
    {"name": "SE",  "start_degree": 123.75, "end_degree": 146.25, "ruling_planet": "Venus",    "element": "Fire"},
    {"name": "SSE", "start_degree": 146.25, "end_degree": 168.75, "ruling_planet": None,       "element": "Earth"},
    {"name": "S",   "start_degree": 168.75, "end_degree": 191.25, "ruling_planet": "Mars",     "element": "Earth"},
    {"name": "SSW", "start_degree": 191.25, "end_degree": 213.75, "ruling_planet": None,       "element": "Earth"},
    {"name": "SW",  "start_degree": 213.75, "end_degree": 236.25, "ruling_planet": "Rahu",     "element": "Earth"},
    {"name": "WSW", "start_degree": 236.25, "end_degree": 258.75, "ruling_planet": None,       "element": "Air"},
    {"name": "W",   "start_degree": 258.75, "end_degree": 281.25, "ruling_planet": "Saturn",   "element": "Air"},
    {"name": "WNW", "start_degree": 281.25, "end_degree": 303.75, "ruling_planet": None,       "element": "Air"},
    {"name": "NW",  "start_degree": 303.75, "end_degree": 326.25, "ruling_planet": "Moon",     "element": "Air"},
    {"name": "NNW", "start_degree": 326.25, "end_degree": 348.75, "ruling_planet": None,       "element": "Water"},
]

# ---------------------------------------------------------------------------
# Planet → primary direction assignments
# ---------------------------------------------------------------------------
PLANET_DIRECTIONS: dict[str, str] = {
    "Sun":     "E",
    "Moon":    "NW",
    "Mars":    "S",
    "Mercury": "N",
    "Jupiter": "NE",
    "Venus":   "SE",
    "Saturn":  "W",
    "Rahu":    "SW",
    "Ketu":    "NW",
}

# ---------------------------------------------------------------------------
# 45 Devtas — 2-3 per zone (total >= 45 across 16 zones)
# ---------------------------------------------------------------------------
DEVTAS_45: dict[str, list[dict[str, str]]] = {
    "N":   [
        {"name": "Kubera",  "domain": "Wealth"},
        {"name": "Mukhya",  "domain": "Leadership"},
        {"name": "Soma",    "domain": "Nourishment"},
    ],
    "NNE": [
        {"name": "Bhallata", "domain": "Strength"},
        {"name": "Aryaman",  "domain": "Honour"},
    ],
    "NE":  [
        {"name": "Isha",     "domain": "Spiritual growth"},
        {"name": "Parjanya", "domain": "Abundance"},
        {"name": "Diti",     "domain": "Protection"},
    ],
    "ENE": [
        {"name": "Aditi",    "domain": "Infinite potential"},
        {"name": "Diti",     "domain": "Bounded reality"},
    ],
    "E":   [
        {"name": "Surya",    "domain": "Vitality"},
        {"name": "Satya",    "domain": "Truth"},
        {"name": "Indra",    "domain": "Prosperity"},
    ],
    "ESE": [
        {"name": "Savita",   "domain": "Inspiration"},
        {"name": "Vivasvan", "domain": "Light"},
    ],
    "SE":  [
        {"name": "Agni",     "domain": "Transformation"},
        {"name": "Pusha",    "domain": "Growth"},
        {"name": "Vitatha",  "domain": "Illusion"},
    ],
    "SSE": [
        {"name": "Grihakshat", "domain": "Home protection"},
        {"name": "Yama",       "domain": "Order"},
    ],
    "S":   [
        {"name": "Yama",     "domain": "Justice"},
        {"name": "Gandharva","domain": "Arts"},
        {"name": "Mrigna",   "domain": "Nature"},
    ],
    "SSW": [
        {"name": "Pitru",    "domain": "Ancestors"},
        {"name": "Dauwarik", "domain": "Thresholds"},
    ],
    "SW":  [
        {"name": "Niriti",   "domain": "Letting go"},
        {"name": "Dauwarik", "domain": "Boundaries"},
        {"name": "Sugriva",  "domain": "Courage"},
    ],
    "WSW": [
        {"name": "Pushpdant", "domain": "Abundance"},
        {"name": "Varun",     "domain": "Cosmic order"},
    ],
    "W":   [
        {"name": "Varuna",   "domain": "Emotional balance"},
        {"name": "Asura",    "domain": "Material strength"},
        {"name": "Shosha",   "domain": "Absorption"},
    ],
    "WNW": [
        {"name": "Papyakshma", "domain": "Purification"},
        {"name": "Roga",       "domain": "Health challenges"},
    ],
    "NW":  [
        {"name": "Vayu",     "domain": "Communication"},
        {"name": "Naga",     "domain": "Hidden treasures"},
        {"name": "Mukhya",   "domain": "Authority"},
    ],
    "NNW": [
        {"name": "Bhujanga", "domain": "Transformation"},
        {"name": "Soma",     "domain": "Cycles"},
    ],
}

# ---------------------------------------------------------------------------
# Helper: internal zone lookup by name
# ---------------------------------------------------------------------------
_ZONE_BY_NAME: dict[str, dict[str, Any]] = {z["name"]: z for z in ZONES}


def _zone_for_name(name: str) -> dict[str, Any]:
    """Return the zone dict for the given zone name, or raise KeyError."""
    if name not in _ZONE_BY_NAME:
        raise KeyError(f"Unknown zone name: {name!r}")
    return _ZONE_BY_NAME[name]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_zone_for_planet(planet: str) -> dict[str, Any]:
    """Return the Vaastu zone that governs *planet*'s primary direction."""
    direction = PLANET_DIRECTIONS[planet]
    return _zone_for_name(direction)


def get_zone_for_direction(direction: str) -> dict[str, Any]:
    """Return the Vaastu zone for the given compass direction name."""
    return _zone_for_name(direction)


def get_devtas_for_zone(zone_name: str) -> list[dict[str, str]]:
    """Return the list of Devta dicts for *zone_name*."""
    if zone_name not in DEVTAS_45:
        raise KeyError(f"No Devta data for zone: {zone_name!r}")
    return DEVTAS_45[zone_name]


def map_afflictions(
    hits: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Map a list of planetary affliction hits to Vaastu zone metadata.

    Each hit dict must contain at least:
        attacker (str)  — the afflicting planet
        victim   (str)  — the afflicted planet
        angle    (float)— orb / separation angle
        type     (str)  — severity label, e.g. "dangerous"

    Returns a list of enriched dicts with keys:
        zone, hit_type, attacker, victim, angle, devtas
    """
    if not hits:
        return []

    result = []
    for hit in hits:
        attacker = hit["attacker"]
        zone = get_zone_for_planet(attacker)
        zone_name = zone["name"]
        devtas = get_devtas_for_zone(zone_name) if zone_name in DEVTAS_45 else []
        result.append({
            "zone":     zone_name,
            "hit_type": hit["type"],
            "attacker": attacker,
            "victim":   hit["victim"],
            "angle":    hit["angle"],
            "devtas":   devtas,
        })
    return result
