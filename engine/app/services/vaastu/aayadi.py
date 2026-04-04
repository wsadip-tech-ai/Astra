"""
Aayadi Calculator — Dimensional Harmony

Implements the Aayadi Shadavarga (six-fold formula) from Vastu Shastra
to assess the auspiciousness of building dimensions.
"""

from typing import Any

# 8 Yoni types keyed 0-7, derived from (perimeter * 3) % 8
YONI_TYPES: dict[int, dict[str, str]] = {
    0: {
        "type": "Dhwaja",
        "interpretation": "Flag — wealth, prosperity, and fame for the occupants.",
    },
    1: {
        "type": "Dhooma",
        "interpretation": "Smoke — moderate results; some obstacles but manageable.",
    },
    2: {
        "type": "Simha",
        "interpretation": "Lion — courage, leadership, and authority; good for leaders.",
    },
    3: {
        "type": "Shwana",
        "interpretation": "Dog — loss and quarrels; inauspicious for family harmony.",
    },
    4: {
        "type": "Vrishabha",
        "interpretation": "Bull — steady gains, hard work rewarded; good for commerce.",
    },
    5: {
        "type": "Khara",
        "interpretation": "Donkey — hardship and struggles; unfavorable for occupants.",
    },
    6: {
        "type": "Gaja",
        "interpretation": "Elephant — abundance, stability, and long-term prosperity.",
    },
    7: {
        "type": "Kaaka",
        "interpretation": "Crow — disputes and instability; inauspicious placement.",
    },
}

# Footprint effects keyed by integer foot measurement
# Auspicious: 10, 12, 16, 20, 24, 27, 30, 32, 36, 40
# Inauspicious: 11, 13, 17, 19, 22, 25, 29, 31, 34, 37
FOOTPRINT_EFFECTS: dict[int, str] = {
    10: "Vishnu's Grace — divine protection and spiritual growth",
    11: "Moderate Loss — minor financial setbacks expected",
    12: "Brahma's Blessings — creative energy and intellectual prosperity",
    13: "Disease and Sorrow — health concerns for occupants",
    16: "Victory and Fame — recognition and success in endeavors",
    17: "Enemy Troubles — conflicts and opposition from rivals",
    19: "Fire Hazard — risk of accidents and sudden losses",
    20: "Wealth and Comfort — steady material gains and ease",
    22: "Debt and Poverty — financial strain and instability",
    24: "Happiness and Longevity — harmonious family life",
    25: "Loss of Cattle — diminishing resources over time",
    27: "Lakshmi's Favour — prosperity, abundance, and auspiciousness",
    29: "Grief and Misfortune — sorrow and repeated setbacks",
    30: "Lakshmi's Blessing — divine grace, wealth, and good fortune",
    31: "Loss of Children — family sorrows and lineage concerns",
    32: "Victory of Enemies — opposition prevails; caution advised",
    34: "Loss of Home — displacement, instability, property loss",
    36: "Royal Prosperity — high status and commanding success",
    37: "Loss of Wealth — gradual erosion of financial standing",
    40: "Abundance and Strength — long-lasting prosperity and vitality",
}


def calculate_aayadi(
    length_ft: float,
    breadth_ft: float,
    user_nakshatra: str,
) -> dict[str, Any]:
    """
    Calculate Aayadi dimensional harmony for a building footprint.

    Args:
        length_ft: Building length in feet.
        breadth_ft: Building breadth/width in feet.
        user_nakshatra: Occupant's birth nakshatra (used for description context).

    Returns:
        dict with keys: aaya, vyaya, aaya_greater, yoni, footprint_effects,
                        overall_harmony, description.
    """
    l = round(length_ft)
    b = round(breadth_ft)

    # Core formulas
    aaya: int = (l * 8) % 12
    vyaya: int = (b * 9) % 10

    # Harmony assessment
    if aaya > vyaya:
        aaya_greater = True
        overall_harmony = "favorable"
    elif aaya == vyaya:
        aaya_greater = True  # equal treated as aaya_greater per spec
        overall_harmony = "neutral"
    else:
        aaya_greater = False
        overall_harmony = "unfavorable"

    # Yoni: (perimeter * 3) % 8
    perimeter = 2 * (l + b)
    yoni_value: int = (perimeter * 3) % 8
    yoni_data = YONI_TYPES[yoni_value]
    yoni = {
        "value": yoni_value,
        "type": yoni_data["type"],
        "interpretation": yoni_data["interpretation"],
    }

    # Footprint effects — check both length and breadth
    footprint_effects = []
    for dim_ft, dim_label in ((l, "length"), (b, "breadth")):
        if dim_ft in FOOTPRINT_EFFECTS:
            footprint_effects.append(
                {
                    "dimension": dim_label,
                    "feet": dim_ft,
                    "effect": FOOTPRINT_EFFECTS[dim_ft],
                }
            )

    # Human-readable description
    harmony_word = {"favorable": "auspicious", "neutral": "balanced", "unfavorable": "inauspicious"}[
        overall_harmony
    ]
    description = (
        f"For a {l}ft × {b}ft building (Nakshatra: {user_nakshatra}): "
        f"Aaya={aaya}, Vyaya={vyaya} — the dimensional harmony is {harmony_word}. "
        f"Yoni is {yoni['type']} ({yoni['interpretation']})"
    )

    return {
        "aaya": aaya,
        "vyaya": vyaya,
        "aaya_greater": aaya_greater,
        "yoni": yoni,
        "footprint_effects": footprint_effects,
        "overall_harmony": overall_harmony,
        "description": description,
    }
