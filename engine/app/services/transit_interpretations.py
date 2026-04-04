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
    degree: float = 15.0,
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

    # Transit timing window
    transit_window = _estimate_transit_window(planet_name, degree)

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
        "transit_window": transit_window,
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
            degree=float(tp.get("degree", 15)),
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


# Approximate transit duration per sign (in days) for each planet
# Used to estimate how long a transit effect lasts
TRANSIT_DURATION_DAYS: dict[str, int] = {
    "Sun": 30,          # ~1 month per sign
    "Moon": 2,           # ~2.5 days per sign
    "Mars": 45,          # ~1.5 months per sign (varies: 28-180 if retrograde)
    "Mercury": 25,       # ~25 days per sign (varies with retrograde)
    "Jupiter": 365,      # ~1 year per sign
    "Venus": 28,         # ~1 month per sign (varies with retrograde)
    "Saturn": 912,       # ~2.5 years per sign
    "Rahu": 547,         # ~18 months per sign
    "Ketu": 547,         # ~18 months per sign
}


def _estimate_transit_window(planet: str, current_degree: float) -> dict:
    """Estimate how long this transit has been active and how long it will last.

    Uses the planet's approximate speed through a sign to estimate
    start/end dates relative to today.
    """
    from datetime import date, timedelta

    total_days = TRANSIT_DURATION_DAYS.get(planet, 30)
    # Approximate progress through the sign (degree 0-29 maps to 0-100%)
    progress = min(current_degree / 30.0, 1.0)
    days_elapsed = int(progress * total_days)
    days_remaining = total_days - days_elapsed

    today = date.today()
    approx_start = (today - timedelta(days=days_elapsed)).isoformat()
    approx_end = (today + timedelta(days=days_remaining)).isoformat()

    # Human-readable duration
    if total_days >= 365:
        duration_text = f"~{total_days // 365} year{'s' if total_days >= 730 else ''}"
    elif total_days >= 30:
        months = total_days // 30
        duration_text = f"~{months} month{'s' if months > 1 else ''}"
    else:
        duration_text = f"~{total_days} days"

    return {
        "approx_start": approx_start,
        "approx_end": approx_end,
        "days_remaining": days_remaining,
        "total_duration_days": total_days,
        "duration_text": duration_text,
        "progress_pct": round(progress * 100),
    }


# Impact scoring: some transits matter more than others
IMPACT_WEIGHTS: dict[str, float] = {
    "Saturn": 1.5,   # Slow-moving, long-lasting effects
    "Jupiter": 1.4,  # Major benefic, significant shifts
    "Rahu": 1.3,     # Karmic, intense
    "Ketu": 1.2,     # Spiritual, detachment
    "Mars": 1.1,     # Action, conflicts
    "Sun": 0.9,
    "Venus": 0.9,
    "Mercury": 0.8,
    "Moon": 0.6,     # Fast-moving, daily effects
}

# Which houses have the biggest life impact
HIGH_IMPACT_HOUSES = {1, 2, 4, 7, 8, 10, 12}  # Self, money, home, marriage, transformation, career, loss

# Remedy suggestions by planet
PLANET_REMEDIES: dict[str, dict[str, str]] = {
    "Sun": {"mantra": "Om Suryaya Namah", "gemstone": "Ruby", "charity": "Donate wheat on Sundays", "practice": "Wake before sunrise, practice Surya Namaskar"},
    "Moon": {"mantra": "Om Chandraya Namah", "gemstone": "Pearl", "charity": "Donate rice or milk on Mondays", "practice": "Meditate during moonrise, stay near water"},
    "Mars": {"mantra": "Om Mangalaya Namah", "gemstone": "Red Coral", "charity": "Donate red lentils on Tuesdays", "practice": "Physical exercise, practice patience before reacting"},
    "Mercury": {"mantra": "Om Budhaya Namah", "gemstone": "Emerald", "charity": "Donate green moong on Wednesdays", "practice": "Journaling, learning new skills, clear communication"},
    "Jupiter": {"mantra": "Om Gurave Namah", "gemstone": "Yellow Sapphire", "charity": "Donate turmeric or yellow items on Thursdays", "practice": "Study scriptures, teach others, practice gratitude"},
    "Venus": {"mantra": "Om Shukraya Namah", "gemstone": "Diamond", "charity": "Donate white items on Fridays", "practice": "Appreciate beauty, nurture relationships, creative expression"},
    "Saturn": {"mantra": "Om Shanaischaraya Namah", "gemstone": "Blue Sapphire", "charity": "Donate black sesame on Saturdays", "practice": "Serve elders, discipline daily routine, practice humility"},
    "Rahu": {"mantra": "Om Rahuve Namah", "gemstone": "Hessonite (Gomed)", "charity": "Donate to outcasts or underprivileged", "practice": "Avoid shortcuts, ground yourself with routine, reduce screen time"},
    "Ketu": {"mantra": "Om Ketuve Namah", "gemstone": "Cat's Eye", "charity": "Donate blankets to the poor", "practice": "Meditation, spiritual study, let go of material attachments"},
}


def _compute_impact_score(planet: str, house: int, is_favorable: bool, is_retrograde: bool, is_dasha_lord: bool) -> float:
    """Score how impactful a transit is (higher = more important to the user)."""
    score = IMPACT_WEIGHTS.get(planet, 1.0)
    if house in HIGH_IMPACT_HOUSES:
        score *= 1.5
    if not is_favorable:
        score *= 1.3  # Challenging transits need more attention
    if is_retrograde:
        score *= 1.2
    if is_dasha_lord:
        score *= 1.8  # Dasha lord transit is extremely significant
    return round(score, 2)


def get_high_impact_summary(
    planet_interpretations: list[dict],
    life_area_summary: dict,
    dasha_lord: str | None = None,
    upcoming_antardashas: list[dict] | None = None,
) -> dict:
    """Extract the 2-3 highest-impact transits and build focused alerts.

    Args:
        planet_interpretations: from interpret_all_transits
        life_area_summary: from interpret_all_transits
        dasha_lord: current Mahadasha planet
        upcoming_antardashas: list of {planet, start, end} for timeline

    Returns:
        dict with: alerts (top 2-3), life_scores, timeline, remedies
    """
    # Score each transit by impact
    scored = []
    for interp in planet_interpretations:
        is_dasha_lord = dasha_lord and interp["planet"] == dasha_lord
        impact = _compute_impact_score(
            planet=interp["planet"],
            house=interp["house"],
            is_favorable=interp["is_favorable"],
            is_retrograde=interp.get("retrograde_note") is not None,
            is_dasha_lord=bool(is_dasha_lord),
        )
        scored.append({**interp, "impact_score": impact})

    # Sort by impact, take top 3
    scored.sort(key=lambda x: x["impact_score"], reverse=True)
    top_alerts = []
    for item in scored[:3]:
        planet = item["planet"]
        remedy = PLANET_REMEDIES.get(planet, {})

        if item["is_favorable"]:
            alert_type = "opportunity"
            action = f"Maximize this energy: {remedy.get('practice', 'Stay open to opportunities')}"
        else:
            alert_type = "attention"
            action = f"Remedy: {remedy.get('practice', 'Practice patience and awareness')}"

        # Include timing from transit window
        window = item.get("transit_window", {})

        top_alerts.append({
            "planet": planet,
            "house": item["house"],
            "sign": item["sign"],
            "type": alert_type,
            "impact_score": item["impact_score"],
            "life_areas": item["life_areas"][:2],
            "headline": _build_headline(planet, item["house"], item["is_favorable"], item["life_areas"]),
            "detail": item["summary"],
            "remedy": {
                "mantra": remedy.get("mantra", ""),
                "gemstone": remedy.get("gemstone", ""),
                "charity": remedy.get("charity", ""),
                "practice": remedy.get("practice", ""),
            },
            "is_favorable": item["is_favorable"],
            "timing": {
                "active_from": window.get("approx_start", ""),
                "active_until": window.get("approx_end", ""),
                "days_remaining": window.get("days_remaining", 0),
                "duration": window.get("duration_text", ""),
                "progress_pct": window.get("progress_pct", 50),
            },
        })

    # Life area one-line verdicts
    life_scores = {}
    for category, data in life_area_summary.items():
        outlook = data["outlook"]
        planet_names = [p["planet"] for p in data["planets"]]
        if outlook == "favorable":
            verdict = f"Supported by {', '.join(planet_names[:2])}"
        elif outlook == "challenging":
            verdict = f"Watch out — {', '.join(planet_names[:2])} bringing tests"
        else:
            verdict = f"Mixed energy from {', '.join(planet_names[:2])}"
        life_scores[category] = {
            "outlook": outlook,
            "verdict": verdict,
        }

    # Timeline from upcoming antardashas
    timeline = []
    if upcoming_antardashas:
        for ad in upcoming_antardashas[:5]:
            planet = ad.get("planet", "Unknown")
            start = ad.get("start", "")
            # Determine if this antardasha lord is generally beneficial
            is_benefic = planet in ("Jupiter", "Venus", "Mercury", "Moon")
            timeline.append({
                "planet": planet,
                "start": start,
                "end": ad.get("end", ""),
                "nature": "favorable" if is_benefic else "challenging" if planet in ("Saturn", "Rahu", "Ketu") else "mixed",
                "description": f"{planet} Antardasha begins — {'expansion and opportunities' if is_benefic else 'discipline and transformation required' if planet in ('Saturn', 'Rahu', 'Ketu') else 'action and change'}",
            })

    return {
        "alerts": top_alerts,
        "life_scores": life_scores,
        "timeline": timeline,
    }


def _build_headline(planet: str, house: int, is_favorable: bool, life_areas: list[str]) -> str:
    """Build a punchy one-line headline for an alert."""
    area = life_areas[0] if life_areas else "life"

    FAVORABLE_HEADLINES = {
        "Jupiter": f"Jupiter blesses your {area.lower()} — growth period ahead",
        "Venus": f"Venus enhances your {area.lower()} — harmony incoming",
        "Mercury": f"Mercury sharpens your {area.lower()} — communicate boldly",
        "Moon": f"Emotional clarity in {area.lower()} matters",
        "Sun": f"Confidence rising in {area.lower()} — step forward",
        "Mars": f"Energy surge in {area.lower()} — take action",
        "Saturn": f"Saturn rewards discipline in {area.lower()}",
        "Rahu": f"Unconventional gains in {area.lower()} possible",
        "Ketu": f"Spiritual insight awakening in {area.lower()}",
    }

    CHALLENGING_HEADLINES = {
        "Saturn": f"Saturn testing your {area.lower()} — patience is key",
        "Mars": f"Tensions in {area.lower()} — channel energy wisely",
        "Rahu": f"Rahu stirring restlessness in {area.lower()} — stay grounded",
        "Ketu": f"Ketu bringing detachment in {area.lower()} — let go gracefully",
        "Sun": f"Ego challenges in {area.lower()} — stay humble",
        "Moon": f"Emotional turbulence in {area.lower()} — self-care needed",
        "Mercury": f"Communication hurdles in {area.lower()} — think before speaking",
        "Jupiter": f"Over-expansion risk in {area.lower()} — maintain balance",
        "Venus": f"Relationship tests in {area.lower()} — nurture with care",
    }

    if is_favorable:
        return FAVORABLE_HEADLINES.get(planet, f"{planet} supporting your {area.lower()}")
    return CHALLENGING_HEADLINES.get(planet, f"{planet} challenging your {area.lower()}")
