"""
Future yoga prediction via Swiss Ephemeris transit scanning.
Finds upcoming dates when key yogas activate through planetary transits.
"""
import swisseph as swe
from datetime import date, timedelta
from app.services.vedic_chart import SANSKRIT_SIGNS, _sidereal_longitude, _sid_to_sign_degree

# Kendra houses (1, 4, 7, 10) = 0, 3, 6, 9 sign distances
KENDRA_DISTANCES = {0, 3, 6, 9}


def _get_jupiter_sign_on_date(target_date: date) -> tuple[str, float]:
    """Get Jupiter's sidereal sign and degree on a given date."""
    jd = swe.julday(target_date.year, target_date.month, target_date.day, 12.0)
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    ayanamsa = swe.get_ayanamsa_ut(jd)
    result, _ = swe.calc_ut(jd, swe.JUPITER)
    sid_lon = _sidereal_longitude(result[0], ayanamsa)
    sign, degree = _sid_to_sign_degree(sid_lon)
    return sign, float(degree)


def _get_planet_sign_on_date(planet_id: int, target_date: date) -> tuple[str, float]:
    """Get any planet's sidereal sign and degree on a given date."""
    jd = swe.julday(target_date.year, target_date.month, target_date.day, 12.0)
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    ayanamsa = swe.get_ayanamsa_ut(jd)
    result, _ = swe.calc_ut(jd, planet_id)
    sid_lon = _sidereal_longitude(result[0], ayanamsa)
    sign, degree = _sid_to_sign_degree(sid_lon)
    return sign, float(degree)


def _sign_distance(from_sign: str, to_sign: str) -> int:
    """0-based sign distance."""
    from_idx = SANSKRIT_SIGNS.index(from_sign)
    to_idx = SANSKRIT_SIGNS.index(to_sign)
    return (to_idx - from_idx) % 12


def predict_gaja_kesari_windows(
    natal_moon_sign: str,
    from_date: str | None = None,
    years_ahead: int = 5,
) -> list[dict]:
    """Find upcoming periods when transiting Jupiter is in a Kendra from natal Moon.

    Scans forward day-by-day (with optimization: weekly steps, then refine).
    Returns list of windows with start_date, end_date, kendra_house, jupiter_sign.
    """
    start = date.fromisoformat(from_date) if from_date else date.today()
    end = start + timedelta(days=years_ahead * 365)

    moon_idx = SANSKRIT_SIGNS.index(natal_moon_sign)
    kendra_signs = set()
    for dist in KENDRA_DISTANCES:
        kendra_signs.add(SANSKRIT_SIGNS[(moon_idx + dist) % 12])

    windows = []
    current = start
    in_kendra = False
    window_start = None
    current_kendra_sign = None

    # Scan weekly first for efficiency, then refine boundaries
    while current <= end:
        jup_sign, jup_degree = _get_jupiter_sign_on_date(current)
        is_kendra = jup_sign in kendra_signs

        if is_kendra and not in_kendra:
            # Entering a Kendra — refine start date
            refined_start = current - timedelta(days=6)
            for d in range(7):
                check_date = refined_start + timedelta(days=d)
                s, _ = _get_jupiter_sign_on_date(check_date)
                if s in kendra_signs:
                    window_start = check_date
                    break
            else:
                window_start = current
            current_kendra_sign = jup_sign
            in_kendra = True

        elif not is_kendra and in_kendra:
            # Exiting a Kendra — refine end date
            refined_end = current - timedelta(days=6)
            window_end = current
            for d in range(7):
                check_date = refined_end + timedelta(days=d)
                s, _ = _get_jupiter_sign_on_date(check_date)
                if s not in kendra_signs:
                    window_end = check_date - timedelta(days=1)
                    break

            dist = _sign_distance(natal_moon_sign, current_kendra_sign)
            house = dist + 1  # 1-indexed

            windows.append({
                "yoga": "Gaja Kesari",
                "start_date": window_start.isoformat() if window_start else current.isoformat(),
                "end_date": window_end.isoformat(),
                "jupiter_sign": current_kendra_sign,
                "kendra_house": house,
                "description": _gaja_kesari_description(current_kendra_sign, house, natal_moon_sign),
                "strength": "strong" if house == 1 else "moderate",
            })
            in_kendra = False
            window_start = None

        current += timedelta(days=7)  # Weekly steps for speed

    # Handle case where we're still in a Kendra at the end of scan
    if in_kendra and window_start:
        dist = _sign_distance(natal_moon_sign, current_kendra_sign)
        house = dist + 1
        windows.append({
            "yoga": "Gaja Kesari",
            "start_date": window_start.isoformat(),
            "end_date": end.isoformat(),
            "jupiter_sign": current_kendra_sign,
            "kendra_house": house,
            "description": _gaja_kesari_description(current_kendra_sign, house, natal_moon_sign),
            "strength": "strong" if house == 1 else "moderate",
        })

    return windows


def _gaja_kesari_description(jupiter_sign: str, house: int, moon_sign: str) -> str:
    """Human-readable description of a Gaja Kesari window."""
    house_meanings = {
        1: f"Jupiter conjuncts your natal Moon in {moon_sign} — the strongest Gaja Kesari. Exceptional wisdom, reputation, and wealth potential. A landmark period for personal growth.",
        4: f"Jupiter in {jupiter_sign} aspects your Moon from the 4th house — brings domestic happiness, property gains, emotional security, and educational success.",
        7: f"Jupiter in {jupiter_sign} aspects your Moon from the 7th house — enhances partnerships, marriage harmony, business growth, and social standing.",
        10: f"Jupiter in {jupiter_sign} aspects your Moon from the 10th house — career advancement, public recognition, authority, and professional wisdom.",
    }
    return house_meanings.get(house, f"Jupiter in Kendra from your Moon — activates Gaja Kesari Yoga.")


def predict_upcoming_yogas(
    natal_moon_sign: str,
    natal_planets: list[dict] | None = None,
    from_date: str | None = None,
    years_ahead: int = 3,
) -> dict:
    """Predict all upcoming yoga windows.

    Currently predicts: Gaja Kesari (Jupiter-Moon Kendra).
    Future: can add more transit-activated yogas.
    """
    gaja_kesari = predict_gaja_kesari_windows(natal_moon_sign, from_date, years_ahead)

    # Determine if any yoga is currently active
    today = date.today().isoformat()

    currently_active = []
    upcoming = []

    for window in gaja_kesari:
        if window["start_date"] <= today <= window["end_date"]:
            currently_active.append(window)
        elif window["start_date"] > today:
            upcoming.append(window)

    # Sort upcoming by start date
    upcoming.sort(key=lambda w: w["start_date"])

    return {
        "currently_active": currently_active,
        "upcoming": upcoming,
        "next_gaja_kesari": upcoming[0] if upcoming else (currently_active[0] if currently_active else None),
    }
