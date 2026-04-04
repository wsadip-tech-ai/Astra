"""
HIT Calculator — Compound Degrees + Angular Relationships

Implements the 3-5-8 impact formula for Astro-Vaastu analysis:
  Negative angles: 180° (killer), 90° (dangerous), 45° (obstacle)
  Positive angles: 120° (best_support), 60° (friend), 30° (positive)

Primary HITs involve the active Dasha lord; all others are secondary.
"""

from __future__ import annotations
from typing import Any

from app.services.vaastu.vaastu_grid import PLANET_DIRECTIONS

# ---------------------------------------------------------------------------
# Sign order (Sanskrit names, Mesha = 0, Vrishabha = 1, ..., Meena = 11)
# ---------------------------------------------------------------------------
SANSKRIT_SIGNS: list[str] = [
    "Mesha",      # Aries     0
    "Vrishabha",  # Taurus    1
    "Mithuna",    # Gemini    2
    "Karka",      # Cancer    3
    "Simha",      # Leo       4
    "Kanya",      # Virgo     5
    "Tula",       # Libra     6
    "Vrishchika", # Scorpio   7
    "Dhanu",      # Sagittarius 8
    "Makara",     # Capricorn 9
    "Kumbha",     # Aquarius  10
    "Meena",      # Pisces    11
]

# ---------------------------------------------------------------------------
# HIT definitions: (target_angle, orb, type, is_negative)
# Ordered most-severe first so the first match wins in classify_angle.
# ---------------------------------------------------------------------------
HIT_DEFINITIONS: list[tuple[float, float, str, bool]] = [
    (180.0, 8.0, "killer",       True),
    (90.0,  5.0, "dangerous",    True),
    (45.0,  3.0, "obstacle",     True),
    (120.0, 5.0, "best_support", False),
    (60.0,  3.0, "friend",       False),
    (30.0,  3.0, "positive",     False),
]

NEGATIVE_TYPES: set[str] = {"killer", "dangerous", "obstacle"}


# ---------------------------------------------------------------------------
# Core helpers
# ---------------------------------------------------------------------------

def to_compound_degree(sign: str, degree: float) -> float:
    """Convert a sign name + degree-within-sign to a 0–360 compound degree.

    Mesha (Aries) starts at 0°; each sign spans 30°.
    """
    idx = SANSKRIT_SIGNS.index(sign)   # raises ValueError for unknown sign
    return float(idx * 30 + degree)


def _angular_difference(deg1: float, deg2: float) -> float:
    """Return the shortest arc (0–180°) between two compound degrees."""
    diff = abs(deg1 - deg2) % 360.0
    if diff > 180.0:
        diff = 360.0 - diff
    return diff


def classify_angle(angle: float) -> str | None:
    """Return the hit type for *angle* (shortest-arc degrees), or None if no hit."""
    for target, orb, hit_type, _ in HIT_DEFINITIONS:
        if abs(angle - target) <= orb:
            return hit_type
    return None


# ---------------------------------------------------------------------------
# Main calculator
# ---------------------------------------------------------------------------

def calculate_hits(
    planets: list[dict[str, Any]],
    active_dasha_lord: str,
) -> dict[str, Any]:
    """Calculate all angular HITs among a list of planets.

    Parameters
    ----------
    planets:
        List of dicts, each with keys: ``name`` (str), ``sign`` (str),
        ``degree`` (float | int).
    active_dasha_lord:
        Name of the planet currently running its Dasha period.

    Returns
    -------
    dict with keys:
        primary_hits   — list of hit dicts involving the Dasha lord
        secondary_hits — list of hit dicts not involving the Dasha lord
        positive_hits  — list of hit dicts for positive (trine/sextile/semi-sextile) angles
        dasha_lord     — echoed back for convenience
        dasha_lord_compound_degree — compound degree of the Dasha lord (or None)
    """
    # Build compound-degree map
    compound: dict[str, float] = {}
    for p in planets:
        compound[p["name"]] = to_compound_degree(p["sign"], p["degree"])

    dasha_lord_cd = compound.get(active_dasha_lord)

    primary_hits: list[dict[str, Any]] = []
    secondary_hits: list[dict[str, Any]] = []
    positive_hits: list[dict[str, Any]] = []

    names = [p["name"] for p in planets]
    n = len(names)

    for i in range(n):
        for j in range(i + 1, n):
            p1, p2 = names[i], names[j]
            angle = _angular_difference(compound[p1], compound[p2])
            hit_type = classify_angle(angle)
            if hit_type is None:
                continue

            # Determine attacker/victim: lower compound degree is attacker
            if compound[p1] <= compound[p2]:
                attacker, victim = p1, p2
            else:
                attacker, victim = p2, p1

            hit: dict[str, Any] = {
                "attacker":  attacker,
                "victim":    victim,
                "angle":     round(angle, 4),
                "type":      hit_type,
                "direction": PLANET_DIRECTIONS.get(attacker),
            }

            involves_dasha = active_dasha_lord in (p1, p2)
            is_negative = hit_type in NEGATIVE_TYPES

            if is_negative:
                if involves_dasha:
                    primary_hits.append(hit)
                else:
                    secondary_hits.append(hit)
            else:
                positive_hits.append(hit)

    return {
        "primary_hits":             primary_hits,
        "secondary_hits":           secondary_hits,
        "positive_hits":            positive_hits,
        "dasha_lord":               active_dasha_lord,
        "dasha_lord_compound_degree": dasha_lord_cd,
    }
