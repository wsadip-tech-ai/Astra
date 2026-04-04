"""
Real-time sidereal transit calculations using Swiss Ephemeris.
Calculates current planetary positions, transit-to-natal aspects, Vedha, and Murthi Nirnaya.
"""
import swisseph as swe
from app.services.vedic_chart import (
    SANSKRIT_SIGNS, NAKSHATRAS,
    _sidereal_longitude, _sid_to_sign_degree, _get_nakshatra,
)

VEDIC_PLANET_IDS = [
    (swe.SUN, "Sun"),
    (swe.MOON, "Moon"),
    (swe.MERCURY, "Mercury"),
    (swe.VENUS, "Venus"),
    (swe.MARS, "Mars"),
    (swe.JUPITER, "Jupiter"),
    (swe.SATURN, "Saturn"),
]

SIGN_ELEMENTS: dict[str, str] = {
    "Mesha": "Fire", "Simha": "Fire", "Dhanu": "Fire",
    "Vrishabha": "Earth", "Kanya": "Earth", "Makara": "Earth",
    "Mithuna": "Air", "Tula": "Air", "Kumbha": "Air",
    "Karka": "Water", "Vrishchika": "Water", "Meena": "Water",
}

VEDHA_SUN = {3: 9, 6: 12, 10: 4, 11: 5}
VEDHA_JUPITER = {2: 12, 5: 4, 7: 3, 9: 10, 11: 8}

FAVORABLE_TRANSITS = {
    "Sun": {3, 6, 10, 11},
    "Moon": {1, 3, 6, 7, 10, 11},
    "Mars": {3, 6, 11},
    "Mercury": {2, 4, 6, 8, 10, 11},
    "Jupiter": {2, 5, 7, 9, 11},
    "Venus": {1, 2, 3, 4, 5, 8, 9, 11, 12},
    "Saturn": {3, 6, 11},
}

GENERAL_VEDHA: dict[int, int] = {
    1: 5, 2: 12, 3: 9, 4: 10, 5: 1, 6: 12,
    7: 3, 8: 2, 9: 3, 10: 4, 11: 5, 12: 6,
}


def _date_to_jd(date_str: str) -> float:
    parts = date_str.split("-")
    year, month, day = int(parts[0]), int(parts[1]), int(parts[2])
    return swe.julday(year, month, day, 12.0)


def calculate_transits(date_str: str) -> dict:
    jd = _date_to_jd(date_str)
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    ayanamsa = swe.get_ayanamsa_ut(jd)

    planets = []
    element_count: dict[str, int] = {"Fire": 0, "Earth": 0, "Air": 0, "Water": 0}

    for planet_id, name in VEDIC_PLANET_IDS:
        result, _flag = swe.calc_ut(jd, planet_id)
        tropical_lon = result[0]
        speed = result[3]
        sid_lon = _sidereal_longitude(tropical_lon, ayanamsa)
        sign, degree = _sid_to_sign_degree(sid_lon)
        nak_name, pada = _get_nakshatra(sid_lon)

        planets.append({
            "name": name,
            "sign": sign,
            "degree": degree,
            "longitude": round(sid_lon, 2),
            "nakshatra": nak_name,
            "pada": pada,
            "retrograde": speed < 0,
        })
        element_count[SIGN_ELEMENTS[sign]] += 1

    # Rahu and Ketu
    result, _flag = swe.calc_ut(jd, swe.MEAN_NODE)
    rahu_tropical = result[0]
    rahu_sid = _sidereal_longitude(rahu_tropical, ayanamsa)
    rahu_sign, rahu_degree = _sid_to_sign_degree(rahu_sid)
    rahu_nak, rahu_pada = _get_nakshatra(rahu_sid)

    ketu_sid = (rahu_sid + 180.0) % 360.0
    ketu_sign, ketu_degree = _sid_to_sign_degree(ketu_sid)
    ketu_nak, ketu_pada = _get_nakshatra(ketu_sid)

    planets.append({
        "name": "Rahu",
        "sign": rahu_sign,
        "degree": rahu_degree,
        "longitude": round(rahu_sid, 2),
        "nakshatra": rahu_nak,
        "pada": rahu_pada,
        "retrograde": True,
    })
    element_count[SIGN_ELEMENTS[rahu_sign]] += 1

    planets.append({
        "name": "Ketu",
        "sign": ketu_sign,
        "degree": ketu_degree,
        "longitude": round(ketu_sid, 2),
        "nakshatra": ketu_nak,
        "pada": ketu_pada,
        "retrograde": True,
    })
    element_count[SIGN_ELEMENTS[ketu_sign]] += 1

    dominant_element = max(element_count, key=element_count.get)

    return {
        "date": date_str,
        "planets": planets,
        "dominant_element": dominant_element,
    }


def calculate_personal_transits(
    natal_planets: list[dict],
    moon_sign: str,
    date_str: str,
) -> dict:
    transits = calculate_transits(date_str)
    moon_sign_idx = SANSKRIT_SIGNS.index(moon_sign)

    transit_aspects = []
    vedha_flags = []
    transit_house_map: dict[str, int] = {}

    for tp in transits["planets"]:
        tp_sign_idx = SANSKRIT_SIGNS.index(tp["sign"])
        house_from_moon = ((tp_sign_idx - moon_sign_idx) % 12) + 1
        transit_house_map[tp["name"]] = house_from_moon

    for tp in transits["planets"]:
        tp_sign_idx = SANSKRIT_SIGNS.index(tp["sign"])
        for np in natal_planets:
            if np["name"] == tp["name"]:
                continue
            np_sign_idx = SANSKRIT_SIGNS.index(np["sign"])
            sign_dist = ((tp_sign_idx - np_sign_idx) % 12)

            aspect_type = None
            if sign_dist == 0:
                degree_diff = abs(tp["degree"] - np["degree"])
                if degree_diff <= 8:
                    aspect_type = "conjunction"
            elif sign_dist == 6:
                aspect_type = "opposition"
            elif sign_dist in (4, 8):
                aspect_type = "trine"
            elif sign_dist in (3, 9):
                aspect_type = "square"

            if aspect_type:
                orb = abs(tp["degree"] - np["degree"])
                transit_aspects.append({
                    "transit_planet": tp["name"],
                    "natal_planet": np["name"],
                    "aspect_type": aspect_type,
                    "orb": orb,
                    "transit_sign": tp["sign"],
                    "natal_sign": np["sign"],
                })

    for planet_name, house in transit_house_map.items():
        if planet_name in ("Rahu", "Ketu"):
            continue
        favorable_houses = FAVORABLE_TRANSITS.get(planet_name, set())
        if house in favorable_houses:
            vedha_house = GENERAL_VEDHA.get(house)
            if vedha_house:
                for other_name, other_house in transit_house_map.items():
                    if other_name != planet_name and other_house == vedha_house:
                        vedha_flags.append({
                            "planet": planet_name,
                            "favorable_house": house,
                            "obstructed_by": other_name,
                            "vedha_house": vedha_house,
                            "description": f"{planet_name}'s favorable transit in {house}th house is obstructed by {other_name} in {vedha_house}th house.",
                        })

    transit_moon = next(p for p in transits["planets"] if p["name"] == "Moon")
    moon_nak_idx = NAKSHATRAS.index(transit_moon["nakshatra"]) if transit_moon["nakshatra"] in NAKSHATRAS else 0
    murthi_map = {0: "Gold", 1: "Silver", 2: "Copper", 3: "Iron"}
    murthi = murthi_map[moon_nak_idx % 4]

    return {
        "transit_aspects": transit_aspects,
        "vedha_flags": vedha_flags,
        "murthi_nirnaya": murthi,
        "transit_houses": transit_house_map,
    }
