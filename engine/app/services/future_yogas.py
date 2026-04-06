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


def _scan_planet_sign_windows(
    planet_id: int,
    target_signs: set[str],
    start: date,
    end: date,
    step_days: int = 7,
) -> list[tuple[date, date, str]]:
    """Scan for windows when a planet is in any of the target signs.

    Returns list of (window_start, window_end, sign) tuples.
    Uses weekly steps with daily refinement at boundaries.
    """
    windows: list[tuple[date, date, str]] = []
    current = start
    in_target = False
    window_start: date | None = None
    current_sign: str | None = None

    while current <= end:
        sign, _ = _get_planet_sign_on_date(planet_id, current)
        is_target = sign in target_signs

        if is_target and not in_target:
            # Entering target — refine start
            refined_start = current - timedelta(days=step_days - 1)
            if refined_start < start:
                refined_start = start
            found = False
            for d in range(step_days):
                check = refined_start + timedelta(days=d)
                s, _ = _get_planet_sign_on_date(planet_id, check)
                if s in target_signs:
                    window_start = check
                    current_sign = s
                    found = True
                    break
            if not found:
                window_start = current
                current_sign = sign
            in_target = True

        elif not is_target and in_target:
            # Exiting target — refine end
            refined_end = current - timedelta(days=step_days - 1)
            window_end = current - timedelta(days=1)
            for d in range(step_days):
                check = refined_end + timedelta(days=d)
                s, _ = _get_planet_sign_on_date(planet_id, check)
                if s not in target_signs:
                    window_end = check - timedelta(days=1)
                    break
            windows.append((window_start or current, window_end, current_sign or ""))
            in_target = False
            window_start = None

        elif is_target and in_target and sign != current_sign:
            # Still in target set but sign changed (e.g. moved from 12th-from-Moon to Moon sign)
            # Close old window, open new one
            windows.append((window_start or current, current - timedelta(days=1), current_sign or ""))
            window_start = current
            current_sign = sign

        current += timedelta(days=step_days)

    if in_target and window_start:
        windows.append((window_start, end, current_sign or ""))

    return windows


# ─── Sade Sati ──────────────────────────────────────────────────────────────────

def predict_sade_sati(
    natal_moon_sign: str,
    from_date: str | None = None,
    years_ahead: int = 10,
) -> dict:
    """Predict Sade Sati periods — Saturn transiting 12th, 1st, and 2nd from natal Moon.

    Each phase lasts ~2.5 years; total ~7.5 years.
    """
    start = date.fromisoformat(from_date) if from_date else date.today()
    end = start + timedelta(days=years_ahead * 365)

    moon_idx = SANSKRIT_SIGNS.index(natal_moon_sign)
    rising_sign = SANSKRIT_SIGNS[(moon_idx - 1) % 12]  # 12th from Moon
    peak_sign = SANSKRIT_SIGNS[moon_idx]                # 1st (Moon sign itself)
    setting_sign = SANSKRIT_SIGNS[(moon_idx + 1) % 12]  # 2nd from Moon

    phase_map = {
        rising_sign: "rising",
        peak_sign: "peak",
        setting_sign: "setting",
    }
    target_signs = set(phase_map.keys())

    windows = _scan_planet_sign_windows(swe.SATURN, target_signs, start, end, step_days=14)

    # Build phase details
    phase_details: dict[str, dict] = {}
    descriptions = {
        "rising": "Saturn approaches your Moon — subtle changes begin",
        "peak": "Saturn on your Moon — deepest transformation",
        "setting": "Saturn moves past — lessons integrate",
    }

    for w_start, w_end, sign in windows:
        phase = phase_map.get(sign, "unknown")
        if phase not in phase_details:
            phase_details[phase] = {
                "sign": sign,
                "start": w_start.isoformat(),
                "end": w_end.isoformat(),
                "description": descriptions.get(phase, "Saturn transiting near your Moon"),
            }
        else:
            # Extend existing phase if Saturn retrogrades back
            existing = phase_details[phase]
            if w_start.isoformat() < existing["start"]:
                existing["start"] = w_start.isoformat()
            if w_end.isoformat() > existing["end"]:
                existing["end"] = w_end.isoformat()

    # Determine if currently active
    today_str = (from_date or date.today().isoformat())
    currently_active = False
    current_phase = None
    for phase_name, details in phase_details.items():
        if details["start"] <= today_str <= details["end"]:
            currently_active = True
            current_phase = phase_name
            break

    # Determine next Sade Sati if not active
    next_sade_sati = None
    if not currently_active and phase_details:
        future_phases = [(n, d) for n, d in phase_details.items() if d["start"] > today_str]
        if future_phases:
            future_phases.sort(key=lambda x: x[1]["start"])
            first_phase_start = future_phases[0][1]["start"]
            last_phase_end = max(d["end"] for _, d in phase_details.items() if d["start"] >= first_phase_start)
            next_sade_sati = {"start": first_phase_start, "end": last_phase_end}

    return {
        "currently_active": currently_active,
        "current_phase": current_phase,
        "phase_details": phase_details,
        "next_sade_sati": next_sade_sati,
        "description": (
            f"Sade Sati is active — you are in the {current_phase} phase."
            if currently_active
            else "Sade Sati is not currently active for your Moon sign."
        ),
        "remedies": {
            "mantra": "Om Shanaischaraya Namah",
            "practice": "Serve elders, practice patience, maintain discipline",
            "charity": "Donate black items on Saturdays",
        },
    }


# ─── Jupiter Return ─────────────────────────────────────────────────────────────

def predict_jupiter_return(
    natal_jupiter_sign: str,
    from_date: str | None = None,
    years_ahead: int = 15,
) -> list[dict]:
    """Predict periods when transiting Jupiter returns to its natal sign (~12 year cycle)."""
    start = date.fromisoformat(from_date) if from_date else date.today()
    end = start + timedelta(days=years_ahead * 365)

    target_signs = {natal_jupiter_sign}
    windows = _scan_planet_sign_windows(swe.JUPITER, target_signs, start, end, step_days=7)

    results = []
    for w_start, w_end, sign in windows:
        results.append({
            "start_date": w_start.isoformat(),
            "end_date": w_end.isoformat(),
            "sign": sign,
            "description": f"Jupiter returns to {sign} — a period of expansion, growth, and renewed purpose in the themes of your natal Jupiter.",
            "strength": "strong",
        })
    return results


# ─── Saturn Return ───────────────────────────────────────────────────────────────

def predict_saturn_return(
    natal_saturn_sign: str,
    from_date: str | None = None,
    years_ahead: int = 30,
) -> list[dict]:
    """Predict periods when transiting Saturn returns to its natal sign (~29 year cycle)."""
    start = date.fromisoformat(from_date) if from_date else date.today()
    end = start + timedelta(days=years_ahead * 365)

    target_signs = {natal_saturn_sign}
    windows = _scan_planet_sign_windows(swe.SATURN, target_signs, start, end, step_days=14)

    results = []
    for w_start, w_end, sign in windows:
        results.append({
            "start_date": w_start.isoformat(),
            "end_date": w_end.isoformat(),
            "sign": sign,
            "description": f"Saturn returns to {sign} — a major maturity milestone. Restructuring of responsibilities, career, and life direction.",
            "strength": "strong",
        })
    return results


# ─── Rahu-Ketu Transit over Moon ────────────────────────────────────────────────

def predict_rahu_ketu_moon_transit(
    natal_moon_sign: str,
    from_date: str | None = None,
    years_ahead: int = 5,
) -> list[dict]:
    """Predict when Rahu or Ketu transits over the natal Moon sign.

    Rahu = Mean Node. Ketu is always exactly opposite (6 signs away).
    """
    start = date.fromisoformat(from_date) if from_date else date.today()
    end = start + timedelta(days=years_ahead * 365)

    moon_idx = SANSKRIT_SIGNS.index(natal_moon_sign)
    ketu_equivalent_sign = SANSKRIT_SIGNS[(moon_idx + 6) % 12]  # Ketu on Moon = Rahu opposite

    results = []

    # Scan Rahu (Mean Node) for Rahu-over-Moon
    rahu_windows = _scan_planet_sign_windows(swe.MEAN_NODE, {natal_moon_sign}, start, end, step_days=7)
    for w_start, w_end, sign in rahu_windows:
        results.append({
            "yoga": "Rahu over Moon",
            "start_date": w_start.isoformat(),
            "end_date": w_end.isoformat(),
            "sign": sign,
            "description": f"Rahu transits your Moon sign ({sign}) — heightened emotions, obsessive thinking, and karmic intensity. Practice grounding.",
            "strength": "strong",
        })

    # Ketu over Moon = Rahu in opposite sign
    ketu_windows = _scan_planet_sign_windows(swe.MEAN_NODE, {ketu_equivalent_sign}, start, end, step_days=7)
    for w_start, w_end, _ in ketu_windows:
        results.append({
            "yoga": "Ketu over Moon",
            "start_date": w_start.isoformat(),
            "end_date": w_end.isoformat(),
            "sign": natal_moon_sign,
            "description": f"Ketu transits your Moon sign ({natal_moon_sign}) — spiritual detachment, past-life themes surface. Embrace inner work.",
            "strength": "strong",
        })

    results.sort(key=lambda r: r["start_date"])
    return results


# ─── Combined Prediction ─────────────────────────────────────────────────────────

def predict_upcoming_yogas(
    natal_moon_sign: str,
    natal_planets: list[dict] | None = None,
    from_date: str | None = None,
    years_ahead: int = 5,
) -> dict:
    """Predict all upcoming yoga windows.

    Predicts: Gaja Kesari, Sade Sati, Jupiter Return, Saturn Return, Rahu-Ketu Moon.
    """
    gaja_kesari = predict_gaja_kesari_windows(natal_moon_sign, from_date, min(years_ahead, 5))
    sade_sati = predict_sade_sati(natal_moon_sign, from_date, min(years_ahead, 10))

    jupiter_return: list[dict] = []
    saturn_return: list[dict] = []

    if natal_planets:
        jup = next((p for p in natal_planets if p["name"] == "Jupiter"), None)
        sat = next((p for p in natal_planets if p["name"] == "Saturn"), None)
        if jup:
            jupiter_return = predict_jupiter_return(jup["sign"], from_date, min(years_ahead, 15))
        if sat:
            saturn_return = predict_saturn_return(sat["sign"], from_date, min(years_ahead, 30))

    rahu_ketu_moon = predict_rahu_ketu_moon_transit(natal_moon_sign, from_date, min(years_ahead, 5))

    # Build combined timeline
    ref_date = from_date or date.today().isoformat()
    all_events: list[dict] = []

    # Gaja Kesari windows
    for w in gaja_kesari:
        if w.get("start_date", "") >= ref_date:
            all_events.append({**w, "category": "opportunity"})

    # Sade Sati
    if sade_sati["currently_active"]:
        phase = sade_sati["current_phase"]
        details = sade_sati["phase_details"].get(phase, {})
        all_events.append({
            "yoga": "Sade Sati",
            "start_date": details.get("start", ""),
            "end_date": details.get("end", ""),
            "description": details.get("description", "Saturn transiting near your Moon"),
            "strength": "strong" if phase == "peak" else "moderate",
            "category": "transformation",
            "phase": phase,
        })
    elif sade_sati.get("next_sade_sati"):
        ns = sade_sati["next_sade_sati"]
        all_events.append({
            "yoga": "Sade Sati (upcoming)",
            "start_date": ns["start"],
            "end_date": ns["end"],
            "description": "Saturn will begin transiting near your Moon — a period of karmic restructuring",
            "strength": "strong",
            "category": "transformation",
        })

    # Jupiter Return
    for w in jupiter_return:
        all_events.append({**w, "yoga": "Jupiter Return", "category": "opportunity"})

    # Saturn Return
    for w in saturn_return:
        all_events.append({**w, "yoga": "Saturn Return", "category": "transformation"})

    # Rahu-Ketu over Moon
    for w in rahu_ketu_moon:
        all_events.append({**w, "category": "karmic"})

    all_events.sort(key=lambda e: e.get("start_date", "9999"))

    # Determine what's active right now
    currently_active = [
        e for e in all_events
        if e.get("start_date", "9999") <= ref_date <= e.get("end_date", "0000")
    ]

    return {
        "gaja_kesari": gaja_kesari,
        "sade_sati": sade_sati,
        "jupiter_return": jupiter_return,
        "saturn_return": saturn_return,
        "rahu_ketu_moon": rahu_ketu_moon,
        "timeline": all_events,
        "next_gaja_kesari": gaja_kesari[0] if gaja_kesari else None,
        "currently_active": currently_active,
    }
