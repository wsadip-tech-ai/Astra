import swisseph as swe
from app.services.western_chart import PLANET_IDS, _to_julian_day

SANSKRIT_SIGNS = [
    "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
    "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
]

NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
    "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha",
    "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha",
    "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada",
    "Uttara Bhadrapada", "Revati",
]

NAKSHATRA_SPAN = 360.0 / 27  # 13.333...°
PADA_SPAN = NAKSHATRA_SPAN / 4  # 3.333...°


def _sidereal_longitude(tropical_lon: float, ayanamsa: float) -> float:
    """Convert tropical longitude to sidereal by subtracting ayanamsa."""
    sid = tropical_lon - ayanamsa
    if sid < 0:
        sid += 360.0
    return sid


def _sid_to_sign_degree(sid_longitude: float) -> tuple[str, int]:
    """Convert sidereal longitude to Sanskrit sign name and degree."""
    sign_index = int(sid_longitude // 30)
    degree = int(sid_longitude % 30)
    return SANSKRIT_SIGNS[sign_index], degree


def _get_nakshatra(sid_longitude: float) -> tuple[str, int]:
    """Get nakshatra name and pada (1-4) from sidereal longitude."""
    nak_index = int(sid_longitude / NAKSHATRA_SPAN)
    if nak_index >= 27:
        nak_index = 26
    remainder = sid_longitude - (nak_index * NAKSHATRA_SPAN)
    pada = int(remainder / PADA_SPAN) + 1
    if pada > 4:
        pada = 4
    return NAKSHATRAS[nak_index], pada


def calculate_vedic_chart(
    date_of_birth: str,
    time_of_birth: str | None,
    latitude: float,
    longitude: float,
    timezone: str,
) -> dict:
    """Calculate a Vedic natal chart using Lahiri ayanamsa and Whole Sign houses."""
    jd = _to_julian_day(date_of_birth, time_of_birth, timezone, latitude, longitude)

    # Set Lahiri ayanamsa
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    ayanamsa = swe.get_ayanamsa_ut(jd)

    # Get tropical ascendant and convert to sidereal
    _cusps, ascmc = swe.houses(jd, latitude, longitude, b"P")
    tropical_asc = ascmc[0]
    sid_asc = _sidereal_longitude(tropical_asc, ayanamsa)
    lagna_sign, lagna_degree = _sid_to_sign_degree(sid_asc)

    # Calculate planets
    planets = []
    nakshatras = []
    moon_sign = ""
    moon_nakshatra = ""

    for planet_id, name, _symbol in PLANET_IDS:
        result, _flag = swe.calc_ut(jd, planet_id)
        tropical_lon = result[0]
        speed = result[3]
        sid_lon = _sidereal_longitude(tropical_lon, ayanamsa)

        sign, degree = _sid_to_sign_degree(sid_lon)
        nak_name, pada = _get_nakshatra(sid_lon)
        retrograde = speed < 0

        planets.append({
            "name": name,
            "sign": sign,
            "degree": degree,
            "nakshatra": nak_name,
            "retrograde": retrograde,
        })
        nakshatras.append({
            "planet": name,
            "nakshatra": nak_name,
            "pada": pada,
        })

        if name == "Moon":
            moon_sign = sign
            moon_nakshatra = nak_name

    summary = f"Lagna {lagna_sign}, Moon {moon_sign}, Nakshatra {moon_nakshatra}"

    return {
        "summary": summary,
        "lagna": {"sign": lagna_sign, "degree": lagna_degree},
        "planets": planets,
        "nakshatras": nakshatras,
    }
