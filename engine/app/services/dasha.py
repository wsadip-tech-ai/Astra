"""
Vimshottari Dasha calculator.
120-year planetary timing system based on Moon's nakshatra at birth.
"""
from datetime import date, timedelta
from app.services.vedic_chart import NAKSHATRAS, NAKSHATRA_SPAN

# Vimshottari sequence and durations (years)
DASHA_SEQUENCE = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]
DASHA_YEARS: dict[str, int] = {
    "Ketu": 7, "Venus": 20, "Sun": 6, "Moon": 10, "Mars": 7,
    "Rahu": 18, "Jupiter": 16, "Saturn": 19, "Mercury": 17,
}

# Nakshatra to ruling planet (every 3 nakshatras share the same lord in sequence)
NAKSHATRA_LORDS = [
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
]

TOTAL_DASHA_DAYS = 120 * 365.25  # 120 years in days


def _get_nakshatra_index(moon_longitude: float) -> int:
    """Get nakshatra index (0-26) from sidereal Moon longitude."""
    idx = int(moon_longitude / NAKSHATRA_SPAN)
    return min(idx, 26)


def _fraction_elapsed_in_nakshatra(moon_longitude: float) -> float:
    """How much of the current nakshatra has been traversed (0.0 to 1.0)."""
    nak_idx = _get_nakshatra_index(moon_longitude)
    nak_start = nak_idx * NAKSHATRA_SPAN
    elapsed = moon_longitude - nak_start
    return elapsed / NAKSHATRA_SPAN


def _add_days(start: date, days: float) -> date:
    """Add fractional days to a date."""
    return start + timedelta(days=round(days))


def calculate_vimshottari_dasha(
    moon_longitude: float,
    date_of_birth: str,
) -> dict:
    """Calculate full Vimshottari Dasha timeline.

    Args:
        moon_longitude: Moon's sidereal longitude (0-360)
        date_of_birth: "YYYY-MM-DD"

    Returns:
        dict with mahadashas, current_mahadasha, current_antardasha, upcoming_antardashas
    """
    birth = date.fromisoformat(date_of_birth)
    today = date.today()

    nak_idx = _get_nakshatra_index(moon_longitude)
    birth_lord = NAKSHATRA_LORDS[nak_idx]
    fraction_elapsed = _fraction_elapsed_in_nakshatra(moon_longitude)

    # Find where birth_lord sits in the DASHA_SEQUENCE
    lord_pos = DASHA_SEQUENCE.index(birth_lord)

    # Build the ordered sequence starting from the birth lord
    ordered = DASHA_SEQUENCE[lord_pos:] + DASHA_SEQUENCE[:lord_pos]

    # The first dasha's remaining duration = (1 - fraction_elapsed) * total years
    first_remaining_years = (1.0 - fraction_elapsed) * DASHA_YEARS[ordered[0]]
    first_remaining_days = first_remaining_years * 365.25

    mahadashas = []
    cursor = birth

    for i, planet in enumerate(ordered):
        if i == 0:
            duration_days = first_remaining_days
        else:
            duration_days = DASHA_YEARS[planet] * 365.25

        md_start = cursor
        md_end = _add_days(cursor, duration_days)

        # Calculate antardashas within this mahadasha
        antardashas = []
        ad_cursor = md_start
        ad_sequence = ordered[i:] + ordered[:i]  # Starts from same planet

        for ad_planet in ad_sequence:
            # Antardasha duration = (MD duration in years * AD planet years / 120) in days
            ad_actual_days = (duration_days / 365.25) * DASHA_YEARS[ad_planet] * 365.25 / 120.0

            ad_start = ad_cursor
            ad_end = _add_days(ad_cursor, ad_actual_days)
            antardashas.append({
                "planet": ad_planet,
                "start": ad_start.isoformat(),
                "end": ad_end.isoformat(),
            })
            ad_cursor = ad_end

        mahadashas.append({
            "planet": planet,
            "start": md_start.isoformat(),
            "end": md_end.isoformat(),
            "antardashas": antardashas,
        })
        cursor = md_end

    # Find current mahadasha and antardasha
    current_mahadasha = None
    current_antardasha = None
    upcoming_antardashas = []

    for md in mahadashas:
        md_start = date.fromisoformat(md["start"])
        md_end = date.fromisoformat(md["end"])
        if md_start <= today <= md_end:
            current_mahadasha = {
                "planet": md["planet"],
                "start": md["start"],
                "end": md["end"],
            }
            # Find current antardasha
            found_current_ad = False
            for j, ad in enumerate(md["antardashas"]):
                ad_start = date.fromisoformat(ad["start"])
                ad_end = date.fromisoformat(ad["end"])
                if ad_start <= today <= ad_end:
                    current_antardasha = {
                        "planet": ad["planet"],
                        "start": ad["start"],
                        "end": ad["end"],
                    }
                    found_current_ad = True
                    # Collect up to 3 upcoming antardashas
                    remaining = md["antardashas"][j + 1:]
                    upcoming_antardashas = [
                        {"planet": a["planet"], "start": a["start"], "end": a["end"]}
                        for a in remaining[:3]
                    ]
                    break
            if not found_current_ad and md["antardashas"]:
                # Fallback: use first antardasha
                current_antardasha = {
                    "planet": md["antardashas"][0]["planet"],
                    "start": md["antardashas"][0]["start"],
                    "end": md["antardashas"][0]["end"],
                }
            break

    # Fallback if today is outside the 120-year range
    if not current_mahadasha:
        current_mahadasha = {
            "planet": mahadashas[-1]["planet"],
            "start": mahadashas[-1]["start"],
            "end": mahadashas[-1]["end"],
        }
    if not current_antardasha:
        current_antardasha = {
            "planet": current_mahadasha["planet"],
            "start": current_mahadasha["start"],
            "end": current_mahadasha["end"],
        }

    return {
        "mahadashas": mahadashas,
        "current_mahadasha": current_mahadasha,
        "current_antardasha": current_antardasha,
        "upcoming_antardashas": upcoming_antardashas,
    }
