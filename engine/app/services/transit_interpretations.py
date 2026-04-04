"""
Transit interpretation service.
Maps transiting planets to life areas and provides personalized readings.
"""
from app.services.interpretations import get_planet_in_house, get_planet_in_sign

# House to life area mapping
HOUSE_LIFE_AREAS: dict[int, list[str]] = {
    1: ["Self", "Health", "Personality"],
    2: ["Finance", "Family", "Speech"],
    3: ["Communication", "Siblings", "Courage"],
    4: ["Home", "Mother", "Property", "Emotions"],
    5: ["Creativity", "Children", "Romance", "Education"],
    6: ["Health", "Enemies", "Service", "Daily Work"],
    7: ["Relationships", "Marriage", "Partnerships", "Business"],
    8: ["Transformation", "Occult", "Longevity", "Inheritance"],
    9: ["Spirituality", "Higher Learning", "Travel", "Luck"],
    10: ["Career", "Public Image", "Authority", "Father"],
    11: ["Gains", "Friends", "Ambitions", "Social Network"],
    12: ["Expenses", "Spirituality", "Foreign Lands", "Liberation"],
}

# Planets and their natural significations
PLANET_THEMES: dict[str, str] = {
    "Sun": "vitality, authority, and self-expression",
    "Moon": "emotions, mind, and comfort",
    "Mars": "energy, courage, and action",
    "Mercury": "communication, intellect, and trade",
    "Jupiter": "wisdom, expansion, and fortune",
    "Venus": "love, beauty, and luxury",
    "Saturn": "discipline, karma, and endurance",
    "Rahu": "ambition, unconventional pursuits, and desires",
    "Ketu": "spirituality, detachment, and past-life karma",
}

# Favorable transit houses for each planet (from Vedic Ashtakavarga perspective)
FAVORABLE_TRANSIT_HOUSES: dict[str, set[int]] = {
    "Sun": {3, 6, 10, 11},
    "Moon": {1, 3, 6, 7, 10, 11},
    "Mars": {3, 6, 11},
    "Mercury": {2, 4, 6, 8, 10, 11},
    "Jupiter": {2, 5, 7, 9, 11},
    "Venus": {1, 2, 3, 4, 5, 8, 9, 11, 12},
    "Saturn": {3, 6, 11},
    "Rahu": {3, 6, 10, 11},
    "Ketu": {3, 6, 10, 11},
}

# Life area categories for grouping
LIFE_CATEGORIES = {
    "Finance & Career": [2, 6, 10, 11],
    "Relationships & Family": [4, 5, 7],
    "Health & Wellbeing": [1, 6, 8],
    "Spirituality & Growth": [5, 9, 12],
}


def interpret_transit(
    planet_name: str,
    transit_sign: str,
    transit_house: int,
    is_retrograde: bool,
    dasha_lord: str | None = None,
) -> dict:
    """Interpret a single planet's transit through a house.

    Returns dict with: planet, house, sign, life_areas, is_favorable,
    interpretation, retrograde_note, dasha_connection
    """
    life_areas = HOUSE_LIFE_AREAS.get(transit_house, ["General"])
    planet_theme = PLANET_THEMES.get(planet_name, "cosmic energy")
    is_favorable = transit_house in FAVORABLE_TRANSIT_HOUSES.get(planet_name, set())

    # Base interpretation from lookup tables
    house_meaning = get_planet_in_house(planet_name, transit_house)

    # Build the interpretation
    if is_favorable:
        tone = "supportive"
        summary = f"{planet_name} transiting your {transit_house}th house in {transit_sign} brings {planet_theme} to your {', '.join(life_areas[:2]).lower()} sector. This is a favorable transit."
    else:
        tone = "challenging"
        summary = f"{planet_name} transiting your {transit_house}th house in {transit_sign} activates themes of {planet_theme} in your {', '.join(life_areas[:2]).lower()} sector. Awareness and patience recommended."

    # Retrograde note
    retrograde_note = None
    if is_retrograde:
        retrograde_note = f"{planet_name} is retrograde — its energy turns inward. Review and reflect rather than initiate new actions in {life_areas[0].lower()} matters."

    # Dasha connection
    dasha_connection = None
    if dasha_lord and dasha_lord == planet_name:
        dasha_connection = f"{planet_name} is your current Dasha lord, amplifying this transit's effects significantly. Pay special attention to {life_areas[0].lower()} themes."

    return {
        "planet": planet_name,
        "sign": transit_sign,
        "house": transit_house,
        "life_areas": life_areas,
        "is_favorable": is_favorable,
        "tone": tone,
        "summary": summary,
        "detailed": house_meaning,
        "retrograde_note": retrograde_note,
        "dasha_connection": dasha_connection,
    }


def interpret_all_transits(
    transit_houses: dict[str, int],
    transit_planets: list[dict],
    dasha_lord: str | None = None,
) -> dict:
    """Interpret all current transits and group by life area.

    Args:
        transit_houses: dict of planet_name -> house_from_moon
        transit_planets: list of planet dicts with name, sign, retrograde
        dasha_lord: current Mahadasha planet name

    Returns dict with: planet_interpretations, life_area_summary,
    favorable_count, challenging_count, overall_outlook
    """
    planet_interpretations = []

    for tp in transit_planets:
        name = tp["name"]
        house = transit_houses.get(name)
        if house is None:
            continue
        interp = interpret_transit(
            planet_name=name,
            transit_sign=tp["sign"],
            transit_house=house,
            is_retrograde=tp.get("retrograde", False),
            dasha_lord=dasha_lord,
        )
        planet_interpretations.append(interp)

    # Count favorable vs challenging
    favorable = [p for p in planet_interpretations if p["is_favorable"]]
    challenging = [p for p in planet_interpretations if not p["is_favorable"]]

    # Group by life category
    life_area_summary = {}
    for category, houses in LIFE_CATEGORIES.items():
        category_planets = [
            p for p in planet_interpretations if p["house"] in houses
        ]
        if category_planets:
            fav = sum(1 for p in category_planets if p["is_favorable"])
            chal = len(category_planets) - fav
            if fav > chal:
                outlook = "favorable"
            elif chal > fav:
                outlook = "challenging"
            else:
                outlook = "mixed"
            life_area_summary[category] = {
                "outlook": outlook,
                "planets": [
                    {
                        "planet": p["planet"],
                        "house": p["house"],
                        "tone": p["tone"],
                        "summary": p["summary"],
                    }
                    for p in category_planets
                ],
            }

    # Overall outlook
    if len(favorable) > len(challenging) + 2:
        overall = "Very favorable period — multiple supportive transits active."
    elif len(favorable) > len(challenging):
        overall = "Generally favorable period with some areas needing attention."
    elif len(challenging) > len(favorable) + 2:
        overall = "A period of growth through challenges — patience and awareness are your allies."
    elif len(challenging) > len(favorable):
        overall = "Mixed period with more challenging transits — focus on areas of strength."
    else:
        overall = "Balanced period — equal supportive and challenging energies at play."

    return {
        "planet_interpretations": planet_interpretations,
        "life_area_summary": life_area_summary,
        "favorable_count": len(favorable),
        "challenging_count": len(challenging),
        "overall_outlook": overall,
    }
