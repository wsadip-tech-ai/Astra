"""
Personality and life analysis from Vedic birth chart.

Derives character traits, family predictions, career direction,
health constitution, spiritual path, and life themes from house lords,
planet placements, and yogas.  Pure engine logic -- no AI involved.
"""

from __future__ import annotations

from app.services.interpretations import (
    get_planet_in_sign,
    get_planet_in_house,
    get_house_lord_in_house,
    get_nakshatra_meaning,
    SIGN_LORDS,
)

# ---------------------------------------------------------------------------
# Helper constants
# ---------------------------------------------------------------------------

SIGN_ELEMENTS: dict[str, str] = {
    "Mesha": "Fire",
    "Vrishabha": "Earth",
    "Mithuna": "Air",
    "Karka": "Water",
    "Simha": "Fire",
    "Kanya": "Earth",
    "Tula": "Air",
    "Vrishchika": "Water",
    "Dhanu": "Fire",
    "Makara": "Earth",
    "Kumbha": "Air",
    "Meena": "Water",
}

ELEMENT_NATURE: dict[str, str] = {
    "Fire": "dynamic, courageous, and action-oriented",
    "Earth": "practical, grounded, and stability-seeking",
    "Air": "intellectual, communicative, and socially aware",
    "Water": "emotional, intuitive, and deeply feeling",
}

KENDRA_HOUSES = {1, 4, 7, 10}
TRIKONA_HOUSES = {1, 5, 9}
DUSTHANA_HOUSES = {6, 8, 12}

CAREER_BY_ELEMENT: dict[str, str] = {
    "Fire": "leadership, military, sports, engineering, or government authority",
    "Earth": "business, finance, agriculture, real estate, or administration",
    "Air": "communication, teaching, writing, technology, or diplomacy",
    "Water": "healing, arts, counseling, hospitality, or spiritual service",
}

HEALTH_CONSTITUTION: dict[str, str] = {
    "Fire": "Pitta (fiery metabolism, sharp digestion, prone to inflammation)",
    "Earth": "Kapha (sturdy build, steady energy, prone to congestion and weight gain)",
    "Air": "Vata (light frame, quick movement, prone to anxiety and dryness)",
    "Water": "Kapha-Pitta mix (sensitive constitution, strong emotions tied to physical health)",
}

NATURAL_BENEFICS = {"Jupiter", "Venus", "Mercury", "Moon"}
NATURAL_MALEFICS = {"Saturn", "Mars", "Rahu", "Ketu", "Sun"}

HOUSE_THEMES: dict[int, str] = {
    1: "self-identity and personality",
    2: "wealth and family values",
    3: "communication and courage",
    4: "home, mother, and emotional security",
    5: "creativity, children, and intelligence",
    6: "health challenges, enemies, and service",
    7: "partnerships and marriage",
    8: "transformation, longevity, and hidden matters",
    9: "dharma, father, and higher learning",
    10: "career, status, and public life",
    11: "gains, aspirations, and social networks",
    12: "spirituality, losses, and foreign lands",
}

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _planet_map(chart: dict) -> dict[str, dict]:
    """Build a name -> planet-dict lookup from the chart's planets list."""
    return {p["name"]: p for p in chart.get("planets", [])}


def _house_map(chart: dict) -> dict[int, dict]:
    """Build a house-number -> house-dict lookup."""
    return {h["number"]: h for h in chart.get("houses", [])}


def _find_house(houses: dict[int, dict], num: int) -> dict:
    return houses.get(num, {"number": num, "sign": "Unknown", "lord": "Unknown", "lord_house": 1})


def _active_yogas(chart: dict) -> list[dict]:
    return [y for y in chart.get("yogas", []) if y.get("present")]


def _planets_in_house(chart: dict, house_num: int) -> list[dict]:
    return [p for p in chart.get("planets", []) if p.get("house") == house_num]


# ---------------------------------------------------------------------------
# Section builders
# ---------------------------------------------------------------------------


def _build_personality(chart: dict, planets: dict, houses: dict) -> dict:
    lagna_sign = chart.get("lagna", {}).get("sign", "Unknown")
    lagna_element = SIGN_ELEMENTS.get(lagna_sign, "Unknown")
    lagna_lord = SIGN_LORDS.get(lagna_sign, "Unknown")
    lagna_lord_info = planets.get(lagna_lord, {})
    lagna_lord_sign = lagna_lord_info.get("sign", "Unknown")
    lagna_lord_house = lagna_lord_info.get("house", 1)

    core_nature = (
        f"With {lagna_sign} lagna, the native is fundamentally {ELEMENT_NATURE.get(lagna_element, 'complex')}. "
        f"The lagna lord {lagna_lord} is placed in house {lagna_lord_house} in {lagna_lord_sign}. "
        f"{get_planet_in_sign(lagna_lord, lagna_lord_sign)}"
    )

    # Emotional nature — Moon
    moon = planets.get("Moon", {})
    moon_sign = moon.get("sign", "Unknown")
    moon_nak = moon.get("nakshatra", "Unknown")
    nak_info = get_nakshatra_meaning(moon_nak)
    moon_traits = nak_info.get("traits", "intuitive nature")
    emotional_nature = (
        f"{get_planet_in_sign('Moon', moon_sign)} "
        f"The Moon nakshatra is {moon_nak}, associated with {moon_traits}."
    )

    # Outer expression — Sun
    sun = planets.get("Sun", {})
    sun_sign = sun.get("sign", "Unknown")
    sun_house = sun.get("house", 1)
    outer_expression = (
        f"Sun in {sun_sign} in house {sun_house}: {get_planet_in_house('Sun', sun_house)}"
    )

    # Strengths — benefics and strong placements
    strengths: list[str] = []
    for p in chart.get("planets", []):
        h = p.get("house", 0)
        name = p.get("name", "")
        if h in KENDRA_HOUSES or h in TRIKONA_HOUSES:
            label = "kendra" if h in KENDRA_HOUSES else "trikona"
            strengths.append(f"{name} strong in house {h} ({label})")
    for yoga in _active_yogas(chart):
        strengths.append(f"{yoga['name']} ({yoga.get('strength', 'active')})")

    # Challenges — dusthana placements, retrograde, malefics
    challenges: list[str] = []
    for p in chart.get("planets", []):
        h = p.get("house", 0)
        name = p.get("name", "")
        if h in DUSTHANA_HOUSES:
            challenges.append(f"{name} in dusthana house {h} — {HOUSE_THEMES.get(h, '')}")
        if p.get("retrograde") and name not in ("Rahu", "Ketu"):
            challenges.append(f"{name} retrograde — internalized or delayed expression")

    return {
        "core_nature": core_nature,
        "emotional_nature": emotional_nature,
        "outer_expression": outer_expression,
        "strengths": strengths if strengths else ["No strongly placed benefics identified"],
        "challenges": challenges if challenges else ["No major challenges identified from placements"],
    }


def _build_family(chart: dict, planets: dict, houses: dict) -> dict:
    # Mother — 4th house + Moon
    h4 = _find_house(houses, 4)
    moon = planets.get("Moon", {})
    mother = (
        f"4th house lord is {h4['lord']} placed in house {h4['lord_house']}. "
        f"{get_house_lord_in_house(4, h4['lord_house'])} "
        f"Moon is in {moon.get('sign', 'Unknown')} in house {moon.get('house', 'unknown')}: "
        f"{get_planet_in_house('Moon', moon.get('house', 4))}"
    )

    # Father — 9th house + Sun
    h9 = _find_house(houses, 9)
    sun = planets.get("Sun", {})
    father = (
        f"9th house lord is {h9['lord']} placed in house {h9['lord_house']}. "
        f"{get_house_lord_in_house(9, h9['lord_house'])} "
        f"Sun is in {sun.get('sign', 'Unknown')} in house {sun.get('house', 'unknown')}: "
        f"{get_planet_in_house('Sun', sun.get('house', 9))}"
    )

    # Spouse — 7th house + Venus
    h7 = _find_house(houses, 7)
    venus = planets.get("Venus", {})
    spouse = (
        f"7th house lord is {h7['lord']} placed in house {h7['lord_house']}. "
        f"{get_house_lord_in_house(7, h7['lord_house'])} "
        f"Venus is in {venus.get('sign', 'Unknown')} in house {venus.get('house', 'unknown')}: "
        f"{get_planet_in_house('Venus', venus.get('house', 7))}"
    )

    # Children — 5th house + Jupiter
    h5 = _find_house(houses, 5)
    jupiter = planets.get("Jupiter", {})
    children = (
        f"5th house lord is {h5['lord']} placed in house {h5['lord_house']}. "
        f"{get_house_lord_in_house(5, h5['lord_house'])} "
        f"Jupiter is in {jupiter.get('sign', 'Unknown')} in house {jupiter.get('house', 'unknown')}: "
        f"{get_planet_in_house('Jupiter', jupiter.get('house', 5))}"
    )

    return {
        "mother": mother,
        "father": father,
        "spouse": spouse,
        "children": children,
    }


def _build_career(chart: dict, planets: dict, houses: dict) -> dict:
    h10 = _find_house(houses, 10)
    h10_sign = h10.get("sign", "Unknown")
    h10_element = SIGN_ELEMENTS.get(h10_sign, "Unknown")
    career_inclination = CAREER_BY_ELEMENT.get(h10_element, "diverse professional fields")

    h10_lord = h10.get("lord", "Unknown")
    h10_lord_house = h10.get("lord_house", 10)

    direction = (
        f"10th house is {h10_sign} ({h10_element} element), inclining the native toward {career_inclination}. "
        f"The 10th lord {h10_lord} is placed in house {h10_lord_house}. "
        f"{get_house_lord_in_house(10, h10_lord_house)}"
    )

    # Strengths — strong planets in kendras
    strong = []
    for p in chart.get("planets", []):
        if p.get("house") in KENDRA_HOUSES and p["name"] in NATURAL_BENEFICS:
            strong.append(f"{p['name']} in kendra house {p['house']}")
    career_strengths = "; ".join(strong) if strong else "No natural benefics in kendra houses"

    # Wealth — 2nd + 11th house
    h2 = _find_house(houses, 2)
    h11 = _find_house(houses, 11)
    wealth = (
        f"2nd house lord {h2['lord']} in house {h2['lord_house']}: {get_house_lord_in_house(2, h2['lord_house'])} "
        f"11th house lord {h11['lord']} in house {h11['lord_house']}: {get_house_lord_in_house(11, h11['lord_house'])}"
    )

    return {
        "direction": direction,
        "strengths": career_strengths,
        "wealth_potential": wealth,
    }


def _build_health(chart: dict, planets: dict, houses: dict) -> dict:
    lagna_sign = chart.get("lagna", {}).get("sign", "Unknown")
    lagna_element = SIGN_ELEMENTS.get(lagna_sign, "Unknown")

    constitution = HEALTH_CONSTITUTION.get(lagna_element, "Mixed constitution")

    # Vulnerabilities — 6th + 8th house
    h6 = _find_house(houses, 6)
    h8 = _find_house(houses, 8)
    planets_in_6 = [p["name"] for p in _planets_in_house(chart, 6)]
    planets_in_8 = [p["name"] for p in _planets_in_house(chart, 8)]
    vuln_parts = [f"6th house lord {h6['lord']} in house {h6['lord_house']}: {get_house_lord_in_house(6, h6['lord_house'])}"]
    if planets_in_6:
        vuln_parts.append(f"Planets in 6th house: {', '.join(planets_in_6)}")
    if planets_in_8:
        vuln_parts.append(f"Planets in 8th house: {', '.join(planets_in_8)}")
    vulnerabilities = " ".join(vuln_parts)

    # Vitality — Sun + Mars
    sun = planets.get("Sun", {})
    mars = planets.get("Mars", {})
    vitality = (
        f"Sun in house {sun.get('house', '?')}: {get_planet_in_house('Sun', sun.get('house', 1))} "
        f"Mars in house {mars.get('house', '?')}: {get_planet_in_house('Mars', mars.get('house', 1))}"
    )

    return {
        "constitution": constitution,
        "vulnerabilities": vulnerabilities,
        "vitality": vitality,
    }


def _build_spiritual(chart: dict, planets: dict, houses: dict) -> dict:
    h9 = _find_house(houses, 9)
    h12 = _find_house(houses, 12)
    jupiter = planets.get("Jupiter", {})
    ketu = planets.get("Ketu", {})

    path = (
        f"9th house lord {h9['lord']} in house {h9['lord_house']}: {get_house_lord_in_house(9, h9['lord_house'])} "
        f"Jupiter in {jupiter.get('sign', 'Unknown')} in house {jupiter.get('house', '?')}: "
        f"{get_planet_in_house('Jupiter', jupiter.get('house', 9))} "
        f"Ketu in house {ketu.get('house', '?')}: {get_planet_in_house('Ketu', ketu.get('house', 12))}"
    )

    past_life = (
        f"12th house lord {h12['lord']} in house {h12['lord_house']}: {get_house_lord_in_house(12, h12['lord_house'])} "
        f"Ketu in {ketu.get('sign', 'Unknown')} in house {ketu.get('house', '?')}: "
        f"{get_planet_in_sign('Ketu', ketu.get('sign', 'Mesha'))}"
    )

    sun = planets.get("Sun", {})
    dharma = (
        f"9th house lord {h9['lord']} in house {h9['lord_house']} shapes the dharmic path. "
        f"Sun in {sun.get('sign', 'Unknown')}: {get_planet_in_sign('Sun', sun.get('sign', 'Mesha'))}"
    )

    return {
        "path": path,
        "past_life_karma": past_life,
        "dharma": dharma,
    }


def _build_life_themes(chart: dict, planets: dict, houses: dict) -> list[str]:
    themes: list[str] = []

    # 1. Find houses with the most planets (concentration)
    house_counts: dict[int, int] = {}
    for p in chart.get("planets", []):
        h = p.get("house", 0)
        house_counts[h] = house_counts.get(h, 0) + 1
    for h_num, count in sorted(house_counts.items(), key=lambda x: -x[1]):
        if count >= 2:
            themes.append(f"Strong focus on {HOUSE_THEMES.get(h_num, f'house {h_num}')} ({count} planets in house {h_num})")
        if len(themes) >= 2:
            break

    # 2. Active yogas
    for yoga in _active_yogas(chart):
        themes.append(f"{yoga['name']}: {yoga.get('interpretation', 'active yoga')}")
        if len(themes) >= 4:
            break

    # 3. Dasha lord themes
    dasha = chart.get("dasha", {})
    md = dasha.get("current_mahadasha", {})
    md_planet = md.get("planet", "")
    if md_planet:
        md_info = planets.get(md_planet, {})
        md_house = md_info.get("house", 0)
        theme_text = HOUSE_THEMES.get(md_house, "general life direction")
        themes.append(
            f"Current {md_planet} mahadasha period emphasizes {theme_text} (house {md_house})"
        )

    # Ensure at least 3 themes
    if len(themes) < 3:
        lagna_sign = chart.get("lagna", {}).get("sign", "Unknown")
        lagna_element = SIGN_ELEMENTS.get(lagna_sign, "Unknown")
        themes.append(
            f"{lagna_sign} rising gives a life colored by {ELEMENT_NATURE.get(lagna_element, 'complex')} energy"
        )
    if len(themes) < 3:
        themes.append("Ongoing karmic lessons through planetary periods and transits")

    return themes[:5]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def analyze_personality(vedic_chart: dict) -> dict:
    """Analyze a Vedic birth chart and return structured personality and life predictions.

    Parameters
    ----------
    vedic_chart : dict
        The full Vedic chart JSON containing lagna, planets, houses, nakshatras,
        yogas, and dasha information.

    Returns
    -------
    dict
        Structured analysis with sections: personality, family, career, health,
        spiritual, and life_themes.
    """
    planets = _planet_map(vedic_chart)
    houses = _house_map(vedic_chart)

    return {
        "personality": _build_personality(vedic_chart, planets, houses),
        "family": _build_family(vedic_chart, planets, houses),
        "career": _build_career(vedic_chart, planets, houses),
        "health": _build_health(vedic_chart, planets, houses),
        "spiritual": _build_spiritual(vedic_chart, planets, houses),
        "life_themes": _build_life_themes(vedic_chart, planets, houses),
    }
