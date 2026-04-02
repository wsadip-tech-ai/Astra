import swisseph as swe
from datetime import datetime
from zoneinfo import ZoneInfo

ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

PLANET_IDS = [
    (swe.SUN, "Sun", "☉"),
    (swe.MOON, "Moon", "☽"),
    (swe.MERCURY, "Mercury", "☿"),
    (swe.VENUS, "Venus", "♀"),
    (swe.MARS, "Mars", "♂"),
    (swe.JUPITER, "Jupiter", "♃"),
    (swe.SATURN, "Saturn", "♄"),
    (swe.URANUS, "Uranus", "♅"),
    (swe.NEPTUNE, "Neptune", "♆"),
    (swe.PLUTO, "Pluto", "♇"),
]

ASPECT_DEFINITIONS = [
    ("conjunction", 0.0, 8.0),
    ("opposition", 180.0, 8.0),
    ("trine", 120.0, 7.0),
    ("square", 90.0, 7.0),
    ("sextile", 60.0, 5.0),
]


def _longitude_to_sign_degree(longitude: float) -> tuple[str, int]:
    """Convert ecliptic longitude (0-360) to zodiac sign and degree (0-29)."""
    sign_index = int(longitude // 30)
    degree = int(longitude % 30)
    return ZODIAC_SIGNS[sign_index], degree


def _find_house(longitude: float, cusps: list[float]) -> int:
    """Find which house a planet falls in given house cusps."""
    for i in range(12):
        next_i = (i + 1) % 12
        cusp_start = cusps[i]
        cusp_end = cusps[next_i]

        if cusp_start <= cusp_end:
            if cusp_start <= longitude < cusp_end:
                return i + 1
        else:
            # Wraps around 360°
            if longitude >= cusp_start or longitude < cusp_end:
                return i + 1
    return 1  # Fallback


def _angular_separation(lon1: float, lon2: float) -> float:
    """Calculate the smallest angle between two ecliptic longitudes."""
    diff = abs(lon1 - lon2) % 360
    return min(diff, 360 - diff)


def _to_julian_day(date_of_birth: str, time_of_birth: str | None, timezone: str) -> float:
    """Parse date/time and convert to Julian Day in UT."""
    date_parts = date_of_birth.split("-")
    year = int(date_parts[0])
    month = int(date_parts[1])
    day = int(date_parts[2])

    if time_of_birth:
        time_parts = time_of_birth.split(":")
        hour = int(time_parts[0])
        minute = int(time_parts[1])
    else:
        hour, minute = 12, 0  # Default to noon

    local_dt = datetime(year, month, day, hour, minute, tzinfo=ZoneInfo(timezone))
    utc_dt = local_dt.astimezone(ZoneInfo("UTC"))

    decimal_hour = utc_dt.hour + utc_dt.minute / 60.0 + utc_dt.second / 3600.0
    jd = swe.julday(utc_dt.year, utc_dt.month, utc_dt.day, decimal_hour)
    return jd


def calculate_western_chart(
    date_of_birth: str,
    time_of_birth: str | None,
    latitude: float,
    longitude: float,
    timezone: str,
) -> dict:
    """Calculate a Western natal chart and return structured data."""
    jd = _to_julian_day(date_of_birth, time_of_birth, timezone)

    # Calculate house cusps (Placidus)
    cusps_tuple, ascmc = swe.houses(jd, latitude, longitude, b"P")
    cusps = list(cusps_tuple)  # 12 house cusps

    # Build houses response
    houses = []
    for i, cusp_lon in enumerate(cusps):
        sign, degree = _longitude_to_sign_degree(cusp_lon)
        houses.append({"number": i + 1, "sign": sign, "degree": degree})

    # Calculate planets
    planets = []
    planet_longitudes: dict[str, float] = {}

    for planet_id, name, symbol in PLANET_IDS:
        result, flag = swe.calc_ut(jd, planet_id)
        lon = result[0]  # Ecliptic longitude
        speed = result[3]  # Speed in longitude
        sign, degree = _longitude_to_sign_degree(lon)
        house = _find_house(lon, cusps)
        retrograde = speed < 0

        planets.append({
            "name": name,
            "symbol": symbol,
            "sign": sign,
            "degree": degree,
            "house": house,
            "retrograde": retrograde,
        })
        planet_longitudes[name] = lon

    # Calculate aspects
    aspects = []
    planet_names = list(planet_longitudes.keys())
    for i in range(len(planet_names)):
        for j in range(i + 1, len(planet_names)):
            p1 = planet_names[i]
            p2 = planet_names[j]
            sep = _angular_separation(planet_longitudes[p1], planet_longitudes[p2])

            for aspect_type, angle, max_orb in ASPECT_DEFINITIONS:
                orb = abs(sep - angle)
                if orb <= max_orb:
                    aspects.append({
                        "planet1": p1,
                        "planet2": p2,
                        "type": aspect_type,
                        "orb": round(orb, 1),
                    })
                    break  # Only the closest aspect for each pair

    # Summary
    sun_sign = next(p["sign"] for p in planets if p["name"] == "Sun")
    moon_sign = next(p["sign"] for p in planets if p["name"] == "Moon")
    asc_sign = houses[0]["sign"]
    summary = f"Sun {sun_sign}, Moon {moon_sign}, ASC {asc_sign}"

    return {
        "summary": summary,
        "planets": planets,
        "houses": houses,
        "aspects": aspects,
    }
