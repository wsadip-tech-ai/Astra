import swisseph as swe
from app.services.western_chart import _to_julian_day

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

NAKSHATRA_SPAN = 360.0 / 27
PADA_SPAN = NAKSHATRA_SPAN / 4

VEDIC_PLANET_IDS = [
    (swe.SUN, "Sun"),
    (swe.MOON, "Moon"),
    (swe.MERCURY, "Mercury"),
    (swe.VENUS, "Venus"),
    (swe.MARS, "Mars"),
    (swe.JUPITER, "Jupiter"),
    (swe.SATURN, "Saturn"),
]


def _sidereal_longitude(tropical_lon: float, ayanamsa: float) -> float:
    sid = tropical_lon - ayanamsa
    if sid < 0:
        sid += 360.0
    return sid


def _sid_to_sign_degree(sid_longitude: float) -> tuple[str, int]:
    sign_index = int(sid_longitude // 30)
    degree = int(sid_longitude % 30)
    return SANSKRIT_SIGNS[sign_index], degree


def _get_nakshatra(sid_longitude: float) -> tuple[str, int]:
    nak_index = int(sid_longitude / NAKSHATRA_SPAN)
    if nak_index >= 27:
        nak_index = 26
    remainder = sid_longitude - (nak_index * NAKSHATRA_SPAN)
    pada = int(remainder / PADA_SPAN) + 1
    if pada > 4:
        pada = 4
    return NAKSHATRAS[nak_index], pada


def _whole_sign_house(planet_sign_index: int, lagna_sign_index: int) -> int:
    return ((planet_sign_index - lagna_sign_index) % 12) + 1


def calculate_vedic_chart(
    date_of_birth: str,
    time_of_birth: str | None,
    latitude: float,
    longitude: float,
    timezone: str,
) -> dict:
    from app.services.interpretations import (
        SIGN_LORDS, get_planet_in_sign, get_planet_in_house,
        get_nakshatra_meaning, get_planet_remedy, get_house_lord_in_house,
    )
    from app.services.yogas import detect_yogas
    from app.services.dasha import calculate_vimshottari_dasha

    jd = _to_julian_day(date_of_birth, time_of_birth, timezone, latitude, longitude)

    swe.set_sid_mode(swe.SIDM_LAHIRI)
    ayanamsa = swe.get_ayanamsa_ut(jd)

    _cusps, ascmc = swe.houses(jd, latitude, longitude, b"P")
    tropical_asc = ascmc[0]
    sid_asc = _sidereal_longitude(tropical_asc, ayanamsa)
    lagna_sign, lagna_degree = _sid_to_sign_degree(sid_asc)
    lagna_sign_idx = SANSKRIT_SIGNS.index(lagna_sign)
    lagna_nak, lagna_pada = _get_nakshatra(sid_asc)

    planets = []
    nakshatras = []
    moon_sign = ""
    moon_nakshatra = ""
    moon_longitude = 0.0

    for planet_id, name in VEDIC_PLANET_IDS:
        result, _flag = swe.calc_ut(jd, planet_id)
        tropical_lon = result[0]
        speed = result[3]
        sid_lon = _sidereal_longitude(tropical_lon, ayanamsa)

        sign, degree = _sid_to_sign_degree(sid_lon)
        nak_name, pada = _get_nakshatra(sid_lon)
        retrograde = speed < 0
        sign_idx = SANSKRIT_SIGNS.index(sign)
        house = _whole_sign_house(sign_idx, lagna_sign_idx)

        planets.append({
            "name": name, "sign": sign, "degree": degree,
            "house": house, "nakshatra": nak_name, "retrograde": retrograde,
        })
        nakshatras.append({"planet": name, "nakshatra": nak_name, "pada": pada})

        if name == "Moon":
            moon_sign = sign
            moon_nakshatra = nak_name
            moon_longitude = sid_lon

    # Rahu and Ketu
    result, _flag = swe.calc_ut(jd, swe.MEAN_NODE)
    rahu_tropical = result[0]
    rahu_sid = _sidereal_longitude(rahu_tropical, ayanamsa)
    rahu_sign, rahu_degree = _sid_to_sign_degree(rahu_sid)
    rahu_nak, rahu_pada = _get_nakshatra(rahu_sid)
    rahu_sign_idx = SANSKRIT_SIGNS.index(rahu_sign)
    rahu_house = _whole_sign_house(rahu_sign_idx, lagna_sign_idx)

    ketu_sid = (rahu_sid + 180.0) % 360.0
    ketu_sign, ketu_degree = _sid_to_sign_degree(ketu_sid)
    ketu_nak, ketu_pada = _get_nakshatra(ketu_sid)
    ketu_sign_idx = SANSKRIT_SIGNS.index(ketu_sign)
    ketu_house = _whole_sign_house(ketu_sign_idx, lagna_sign_idx)

    planets.append({"name": "Rahu", "sign": rahu_sign, "degree": rahu_degree, "house": rahu_house, "nakshatra": rahu_nak, "retrograde": True})
    nakshatras.append({"planet": "Rahu", "nakshatra": rahu_nak, "pada": rahu_pada})
    planets.append({"name": "Ketu", "sign": ketu_sign, "degree": ketu_degree, "house": ketu_house, "nakshatra": ketu_nak, "retrograde": True})
    nakshatras.append({"planet": "Ketu", "nakshatra": ketu_nak, "pada": ketu_pada})

    # Whole Sign houses
    houses = []
    for i in range(12):
        house_sign_idx = (lagna_sign_idx + i) % 12
        house_sign = SANSKRIT_SIGNS[house_sign_idx]
        lord = SIGN_LORDS[house_sign]
        lord_planet = next((p for p in planets if p["name"] == lord), None)
        lord_house = lord_planet["house"] if lord_planet else i + 1
        houses.append({"number": i + 1, "sign": house_sign, "lord": lord, "lord_house": lord_house})

    # Yogas
    yogas = detect_yogas(planets, lagna_sign)

    # Dasha
    dasha = calculate_vimshottari_dasha(moon_longitude, date_of_birth)

    # Interpretations
    lagna_lord_name = SIGN_LORDS[lagna_sign]
    lagna_lord_planet = next((p for p in planets if p["name"] == lagna_lord_name), None)
    lagna_lord_interp = get_house_lord_in_house(1, lagna_lord_planet["house"]) if lagna_lord_planet else "Lagna lord placement not determined."

    moon_nak_meaning = get_nakshatra_meaning(moon_nakshatra)
    moon_nak_interp = f"{moon_nakshatra} nakshatra — ruled by {moon_nak_meaning['ruling_planet']}, deity {moon_nak_meaning['deity']}. {moon_nak_meaning['traits']}"

    planet_highlights = []
    for p in planets:
        if p["name"] in ("Sun", "Moon", "Jupiter", "Saturn", "Rahu"):
            planet_highlights.append({
                "planet": p["name"],
                "text": f"{p['name']} in {p['sign']} in {p['house']}th house — {get_planet_in_sign(p['name'], p['sign'])}",
            })

    interpretations = {
        "lagna_lord": f"{lagna_lord_name} rules your ascendant ({lagna_sign}) — {lagna_lord_interp}",
        "moon_nakshatra": moon_nak_interp,
        "planet_highlights": planet_highlights,
    }

    # Remedies
    remedies = []
    for dasha_key in ("current_mahadasha", "current_antardasha"):
        dasha_planet = dasha[dasha_key]["planet"]
        remedy = get_planet_remedy(dasha_planet)
        remedies.append({
            "planet": dasha_planet,
            "reason": f"{dasha_planet} {'Mahadasha' if 'maha' in dasha_key else 'Antardasha'} active",
            "gemstone": remedy["gemstone"],
            "mantra": remedy["mantra"],
            "charity": remedy["charity"],
            "deity": remedy["deity"],
            "disclaimer": "Traditional Vedic remedy — not medical or financial advice",
        })

    summary = f"Lagna {lagna_sign}, Moon {moon_sign}, Nakshatra {moon_nakshatra}"

    return {
        "summary": summary,
        "lagna": {"sign": lagna_sign, "degree": lagna_degree, "nakshatra": lagna_nak, "pada": lagna_pada},
        "planets": planets,
        "nakshatras": nakshatras,
        "houses": houses,
        "yogas": yogas,
        "dasha": {
            "current_mahadasha": dasha["current_mahadasha"],
            "current_antardasha": dasha["current_antardasha"],
            "upcoming_antardashas": dasha["upcoming_antardashas"],
        },
        "interpretations": interpretations,
        "remedies": remedies,
    }
