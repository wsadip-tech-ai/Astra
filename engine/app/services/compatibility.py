from app.services.western_chart import ZODIAC_SIGNS, _angular_separation

ASPECT_DEFINITIONS = [
    ("conjunction", 0.0, 8.0),
    ("opposition", 180.0, 8.0),
    ("trine", 120.0, 7.0),
    ("square", 90.0, 7.0),
    ("sextile", 60.0, 5.0),
]

PERSONAL_PLANETS = {"Sun", "Moon", "Venus"}


def _sign_degree_to_longitude(sign: str, degree: int) -> float:
    """Convert sign name + degree to ecliptic longitude (0-360)."""
    index = ZODIAC_SIGNS.index(sign)
    return index * 30.0 + degree


def calculate_compatibility(
    chart1_planets: list[dict],
    chart2_planets: list[dict],
) -> dict:
    """Calculate synastry cross-aspects and compatibility score."""
    c1 = {p["name"]: _sign_degree_to_longitude(p["sign"], p["degree"]) for p in chart1_planets}
    c2 = {p["name"]: _sign_degree_to_longitude(p["sign"], p["degree"]) for p in chart2_planets}

    aspects = []
    for name1, lon1 in c1.items():
        for name2, lon2 in c2.items():
            sep = _angular_separation(lon1, lon2)
            for aspect_type, angle, max_orb in ASPECT_DEFINITIONS:
                orb = abs(sep - angle)
                if orb <= max_orb:
                    aspects.append({
                        "planet1": name1,
                        "planet2": name2,
                        "type": aspect_type,
                        "orb": round(orb, 1),
                    })
                    break

    score = 50
    for a in aspects:
        is_personal = a["planet1"] in PERSONAL_PLANETS or a["planet2"] in PERSONAL_PLANETS
        if a["type"] == "conjunction":
            score += 5 if is_personal else 3
        elif a["type"] == "trine":
            score += 4
        elif a["type"] == "sextile":
            score += 3
        elif a["type"] == "square":
            score -= 3
        elif a["type"] == "opposition":
            score -= 2

    score = max(0, min(100, score))

    sorted_aspects = sorted(aspects, key=lambda a: a["orb"])
    top3 = sorted_aspects[:3]
    summary_parts = []
    for a in top3:
        summary_parts.append(f"{a['planet1']}-{a['planet2']} {a['type']} ({a['orb']}°)")
    summary = "Key connections: " + ", ".join(summary_parts) if summary_parts else "No strong cross-aspects found."

    return {
        "score": score,
        "aspects": sorted_aspects,
        "summary": summary,
    }
