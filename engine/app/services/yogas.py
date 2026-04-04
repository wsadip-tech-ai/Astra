"""
Vedic yoga (planetary combination) detection engine.
Deterministic checks based on traditional Jyotish rules.
"""
from app.services.interpretations import SIGN_LORDS

KENDRA_HOUSES = {1, 4, 7, 10}
TRIKONA_HOUSES = {1, 5, 9}
UPACHAYA_HOUSES = {3, 6, 10, 11}
MANGAL_DOSHA_HOUSES = {1, 4, 7, 8, 12}
BENEFICS = {"Jupiter", "Venus", "Mercury", "Moon"}

SANSKRIT_SIGNS = [
    "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
    "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
]


def _get_planet(planets: list[dict], name: str) -> dict | None:
    return next((p for p in planets if p["name"] == name), None)


def _house_distance(from_house: int, to_house: int) -> int:
    """Return 0-based house distance (0 = same house, 1-11 = steps forward)."""
    return (to_house - from_house) % 12


def _sign_index(sign: str) -> int:
    return SANSKRIT_SIGNS.index(sign)


# Kendra distances in 0-based terms: 0 (same), 3, 6, 9
_KENDRA_DISTANCES = {0, 3, 6, 9}
# Upachaya distances in 0-based terms: houses 3, 6, 10, 11 → distances 2, 5, 9, 10
_UPACHAYA_DISTANCES = {2, 5, 9, 10}


def detect_yogas(planets: list[dict], lagna_sign: str) -> list[dict]:
    """Detect key Vedic yogas from planet positions.

    Args:
        planets: List of planet dicts with keys: name, sign, degree, house, nakshatra, retrograde
        lagna_sign: Sanskrit name of the ascendant sign

    Returns:
        List of yoga dicts with keys: name, present, strength, interpretation
    """
    moon = _get_planet(planets, "Moon")
    sun = _get_planet(planets, "Sun")
    mars = _get_planet(planets, "Mars")
    mercury = _get_planet(planets, "Mercury")
    jupiter = _get_planet(planets, "Jupiter")
    venus = _get_planet(planets, "Venus")
    yogas = []

    # 1. Gaja Kesari Yoga: Jupiter in Kendra (1/4/7/10) from Moon
    # Kendra means same house or 3/6/9 houses ahead in 0-based distance
    # (equivalent to 1st/4th/7th/10th in 1-based counting)
    gk_present = False
    gk_strength = "none"
    gk_interp = "Gaja Kesari Yoga is not formed in this chart."
    if moon and jupiter:
        dist = _house_distance(moon["house"], jupiter["house"])
        if dist in _KENDRA_DISTANCES:
            gk_present = True
            if jupiter["sign"] in ("Dhanu", "Meena", "Karka"):
                gk_strength = "strong"
                gk_interp = "Gaja Kesari Yoga — Jupiter in Kendra from Moon in a strong sign. Exceptional wisdom, wealth, and lasting reputation. Natural teacher and guide."
            else:
                gk_strength = "moderate"
                gk_interp = "Gaja Kesari Yoga — Jupiter in Kendra from Moon. Wisdom, financial acumen, and respected social standing. Good for teaching and advisory roles."
    yogas.append({"name": "Gaja Kesari Yoga", "present": gk_present, "strength": gk_strength, "interpretation": gk_interp})

    # 2. Lakshmi Yoga: Strong 9th lord + Venus in Kendra or Trikona
    lk_present = False
    lk_strength = "none"
    lk_interp = "Lakshmi Yoga is not formed in this chart."
    lagna_idx = _sign_index(lagna_sign)
    ninth_sign = SANSKRIT_SIGNS[(lagna_idx + 8) % 12]
    ninth_lord_name = SIGN_LORDS[ninth_sign]
    ninth_lord = _get_planet(planets, ninth_lord_name)
    if ninth_lord and venus:
        ninth_lord_strong = ninth_lord["house"] in KENDRA_HOUSES or ninth_lord["house"] in TRIKONA_HOUSES
        venus_in_kendra_trikona = venus["house"] in (KENDRA_HOUSES | TRIKONA_HOUSES)
        if ninth_lord_strong and venus_in_kendra_trikona:
            lk_present = True
            if venus["sign"] in ("Vrishabha", "Tula", "Meena"):
                lk_strength = "strong"
                lk_interp = "Lakshmi Yoga — 9th lord strong and Venus well-placed in own/exalted sign. Exceptional fortune, luxury, and prosperity blessed by Goddess Lakshmi."
            else:
                lk_strength = "moderate"
                lk_interp = "Lakshmi Yoga — 9th lord strong and Venus in Kendra/Trikona. Fortune, material comfort, and prosperity through ethical means."
    yogas.append({"name": "Lakshmi Yoga", "present": lk_present, "strength": lk_strength, "interpretation": lk_interp})

    # 3. Vasumati Yoga: Benefics in upachaya houses (3, 6, 10, 11) from Moon
    vm_present = False
    vm_strength = "none"
    vm_interp = "Vasumati Yoga is not formed in this chart."
    if moon:
        benefics_in_upachaya = 0
        for p in planets:
            if p["name"] in BENEFICS and p["name"] != "Moon":
                dist = _house_distance(moon["house"], p["house"])
                if dist in _UPACHAYA_DISTANCES:
                    benefics_in_upachaya += 1
        if benefics_in_upachaya >= 2:
            vm_present = True
            if benefics_in_upachaya >= 3:
                vm_strength = "strong"
                vm_interp = f"Vasumati Yoga — {benefics_in_upachaya} benefics in upachaya houses from Moon. Sustained wealth accumulation, growing prosperity, and financial resilience."
            else:
                vm_strength = "moderate"
                vm_interp = f"Vasumati Yoga — {benefics_in_upachaya} benefics in upachaya houses from Moon. Gradual wealth growth and steady financial improvement over time."
    yogas.append({"name": "Vasumati Yoga", "present": vm_present, "strength": vm_strength, "interpretation": vm_interp})

    # 4. Budhaditya Yoga: Sun and Mercury in the same sign
    bd_present = False
    bd_strength = "none"
    bd_interp = "Budhaditya Yoga is not formed in this chart."
    if sun and mercury and sun["sign"] == mercury["sign"]:
        bd_present = True
        degree_diff = abs(sun["degree"] - mercury["degree"])
        if mercury["sign"] in ("Mithuna", "Kanya"):
            bd_strength = "strong"
            bd_interp = "Budhaditya Yoga — Sun-Mercury conjunction with Mercury in own sign. Brilliant intellect, authoritative communication, and success in writing or technology."
        elif degree_diff < 3:
            bd_strength = "mild"
            bd_interp = "Budhaditya Yoga — Sun-Mercury conjunction but Mercury is combust (too close to Sun). Intelligence present but expression may be overshadowed by ego."
        else:
            bd_strength = "moderate"
            bd_interp = "Budhaditya Yoga — Sun-Mercury conjunction. Sharp intelligence, skilled speech, and ability to combine authority with analytical thinking."
    yogas.append({"name": "Budhaditya Yoga", "present": bd_present, "strength": bd_strength, "interpretation": bd_interp})

    # 5. Chandra-Mangal Yoga: Moon and Mars in the same sign
    cm_present = False
    cm_strength = "none"
    cm_interp = "Chandra-Mangal Yoga is not formed in this chart."
    if moon and mars and moon["sign"] == mars["sign"]:
        cm_present = True
        if mars["sign"] in ("Mesha", "Vrishchika", "Makara"):
            cm_strength = "strong"
            cm_interp = "Chandra-Mangal Yoga — Moon-Mars conjunction with Mars in strong sign. Exceptional courage, financial drive, and entrepreneurial energy."
        else:
            cm_strength = "moderate"
            cm_interp = "Chandra-Mangal Yoga — Moon-Mars conjunction. Emotional courage, financial determination, and drive to earn through bold action."
    yogas.append({"name": "Chandra-Mangal Yoga", "present": cm_present, "strength": cm_strength, "interpretation": cm_interp})

    # 6. Mangal Dosha: Mars in 1st, 4th, 7th, 8th, or 12th house
    md_present = False
    md_strength = "none"
    md_interp = "Mangal Dosha is not present in this chart."
    if mars and mars["house"] in MANGAL_DOSHA_HOUSES:
        md_present = True
        if mars["house"] in (7, 8):
            md_strength = "strong"
            md_interp = f"Mangal Dosha — Mars in {mars['house']}th house. Strong intensity in partnerships and intimate relationships. Traditional remedies include Hanuman Chalisa and Mangal Shanti puja."
        elif mars["house"] in (1, 4):
            md_strength = "moderate"
            md_interp = f"Mangal Dosha — Mars in {mars['house']}th house. Moderate intensity affecting personality and domestic peace. Can be balanced by partner with similar Mars placement."
        else:
            md_strength = "mild"
            md_interp = f"Mangal Dosha — Mars in {mars['house']}th house. Mild effect on expenses and subconscious patterns. Generally manageable with awareness."
    yogas.append({"name": "Mangal Dosha", "present": md_present, "strength": md_strength, "interpretation": md_interp})

    return yogas
