"""
Ashtakoota (8-Koota) Kundali Milan compatibility scoring.
Traditional Vedic 8-fold matching system with max score of 36.
"""

from app.services.dasha import NAKSHATRA_LORDS
from app.services.vedic_chart import NAKSHATRAS, SANSKRIT_SIGNS

# ---------------------------------------------------------------------------
# Lookup Tables
# ---------------------------------------------------------------------------

# Varna hierarchy: Brahmin(4) > Kshatriya(3) > Vaishya(2) > Shudra(1)
# Traditional cyclic assignment across 27 nakshatras
NAKSHATRA_VARNA = {
    "Ashwini": "Vaishya",
    "Bharani": "Shudra",
    "Krittika": "Brahmin",
    "Rohini": "Kshatriya",
    "Mrigashira": "Vaishya",
    "Ardra": "Shudra",
    "Punarvasu": "Brahmin",
    "Pushya": "Kshatriya",
    "Ashlesha": "Vaishya",
    "Magha": "Shudra",
    "Purva Phalguni": "Brahmin",
    "Uttara Phalguni": "Kshatriya",
    "Hasta": "Vaishya",
    "Chitra": "Shudra",
    "Swati": "Brahmin",
    "Vishakha": "Kshatriya",
    "Anuradha": "Vaishya",
    "Jyeshtha": "Shudra",
    "Mula": "Brahmin",
    "Purva Ashadha": "Kshatriya",
    "Uttara Ashadha": "Vaishya",
    "Shravana": "Shudra",
    "Dhanishta": "Brahmin",
    "Shatabhisha": "Kshatriya",
    "Purva Bhadrapada": "Vaishya",
    "Uttara Bhadrapada": "Shudra",
    "Revati": "Brahmin",
}

VARNA_RANK = {"Brahmin": 4, "Kshatriya": 3, "Vaishya": 2, "Shudra": 1}

# Vashya — one primary category per sign
SIGN_VASHYA = {
    "Mesha": "Chatushpada",
    "Vrishabha": "Chatushpada",
    "Mithuna": "Manava",
    "Karka": "Jalachara",
    "Simha": "Vanachara",
    "Kanya": "Manava",
    "Tula": "Manava",
    "Vrishchika": "Keeta",
    "Dhanu": "Manava",
    "Makara": "Chatushpada",
    "Kumbha": "Manava",
    "Meena": "Jalachara",
}

# Vashya compatibility scoring
VASHYA_COMPATIBILITY: dict[frozenset, int] = {
    frozenset(["Chatushpada"]): 2,
    frozenset(["Manava"]): 2,
    frozenset(["Jalachara"]): 2,
    frozenset(["Vanachara"]): 2,
    frozenset(["Keeta"]): 2,
    frozenset(["Manava", "Chatushpada"]): 2,
    frozenset(["Manava", "Jalachara"]): 1,
    frozenset(["Manava", "Vanachara"]): 1,
    frozenset(["Manava", "Keeta"]): 1,
    frozenset(["Chatushpada", "Jalachara"]): 1,
    frozenset(["Chatushpada", "Vanachara"]): 0,
    frozenset(["Chatushpada", "Keeta"]): 0,
    frozenset(["Jalachara", "Vanachara"]): 1,
    frozenset(["Jalachara", "Keeta"]): 0,
    frozenset(["Vanachara", "Keeta"]): 0,
}

# Yoni animal for each nakshatra
NAKSHATRA_YONI = {
    "Ashwini": "Horse",
    "Bharani": "Elephant",
    "Krittika": "Sheep",
    "Rohini": "Serpent",
    "Mrigashira": "Serpent",
    "Ardra": "Dog",
    "Punarvasu": "Cat",
    "Pushya": "Sheep",
    "Ashlesha": "Cat",
    "Magha": "Rat",
    "Purva Phalguni": "Rat",
    "Uttara Phalguni": "Cow",
    "Hasta": "Buffalo",
    "Chitra": "Tiger",
    "Swati": "Buffalo",
    "Vishakha": "Tiger",
    "Anuradha": "Deer",
    "Jyeshtha": "Deer",
    "Mula": "Dog",
    "Purva Ashadha": "Monkey",
    "Uttara Ashadha": "Mongoose",
    "Shravana": "Monkey",
    "Dhanishta": "Lion",
    "Shatabhisha": "Horse",
    "Purva Bhadrapada": "Lion",
    "Uttara Bhadrapada": "Cow",
    "Revati": "Elephant",
}

# Yoni enemy pairs score 0
YONI_ENEMIES = {
    frozenset(["Horse", "Buffalo"]),
    frozenset(["Elephant", "Lion"]),
    frozenset(["Sheep", "Monkey"]),
    frozenset(["Serpent", "Mongoose"]),
    frozenset(["Dog", "Deer"]),
    frozenset(["Cat", "Rat"]),
    frozenset(["Cow", "Tiger"]),
}

# Gana for each nakshatra
NAKSHATRA_GANA = {
    "Ashwini": "Deva",
    "Bharani": "Manushya",
    "Krittika": "Rakshasa",
    "Rohini": "Manushya",
    "Mrigashira": "Deva",
    "Ardra": "Manushya",
    "Punarvasu": "Deva",
    "Pushya": "Deva",
    "Ashlesha": "Rakshasa",
    "Magha": "Rakshasa",
    "Purva Phalguni": "Manushya",
    "Uttara Phalguni": "Manushya",
    "Hasta": "Deva",
    "Chitra": "Rakshasa",
    "Swati": "Deva",
    "Vishakha": "Rakshasa",
    "Anuradha": "Deva",
    "Jyeshtha": "Rakshasa",
    "Mula": "Rakshasa",
    "Purva Ashadha": "Manushya",
    "Uttara Ashadha": "Manushya",
    "Shravana": "Deva",
    "Dhanishta": "Rakshasa",
    "Shatabhisha": "Rakshasa",
    "Purva Bhadrapada": "Manushya",
    "Uttara Bhadrapada": "Manushya",
    "Revati": "Deva",
}

# Gana compatibility
GANA_COMPATIBILITY = {
    ("Deva", "Deva"): 6,
    ("Manushya", "Manushya"): 6,
    ("Rakshasa", "Rakshasa"): 6,
    ("Deva", "Manushya"): 5,
    ("Manushya", "Deva"): 5,
    ("Manushya", "Rakshasa"): 1,
    ("Rakshasa", "Manushya"): 1,
    ("Deva", "Rakshasa"): 0,
    ("Rakshasa", "Deva"): 0,
}

# Nadi for each nakshatra (Aadi/Madhya/Antya)
NAKSHATRA_NADI = {
    "Ashwini": "Aadi",
    "Bharani": "Madhya",
    "Krittika": "Antya",
    "Rohini": "Antya",
    "Mrigashira": "Madhya",
    "Ardra": "Aadi",
    "Punarvasu": "Aadi",
    "Pushya": "Madhya",
    "Ashlesha": "Antya",
    "Magha": "Antya",
    "Purva Phalguni": "Madhya",
    "Uttara Phalguni": "Aadi",
    "Hasta": "Aadi",
    "Chitra": "Madhya",
    "Swati": "Antya",
    "Vishakha": "Antya",
    "Anuradha": "Madhya",
    "Jyeshtha": "Aadi",
    "Mula": "Aadi",
    "Purva Ashadha": "Madhya",
    "Uttara Ashadha": "Antya",
    "Shravana": "Antya",
    "Dhanishta": "Madhya",
    "Shatabhisha": "Aadi",
    "Purva Bhadrapada": "Aadi",
    "Uttara Bhadrapada": "Madhya",
    "Revati": "Antya",
}

# Planet friendship table (traditional Jyotish)
PLANET_FRIENDS = {
    "Sun": {"friends": {"Moon", "Mars", "Jupiter"}, "neutrals": {"Mercury"}, "enemies": {"Venus", "Saturn", "Rahu", "Ketu"}},
    "Moon": {"friends": {"Sun", "Mercury"}, "neutrals": {"Mars", "Jupiter", "Venus", "Saturn"}, "enemies": {"Rahu", "Ketu"}},
    "Mars": {"friends": {"Sun", "Moon", "Jupiter"}, "neutrals": {"Venus", "Saturn"}, "enemies": {"Mercury", "Rahu", "Ketu"}},
    "Mercury": {"friends": {"Sun", "Venus"}, "neutrals": {"Mars", "Jupiter", "Saturn"}, "enemies": {"Moon", "Rahu", "Ketu"}},
    "Jupiter": {"friends": {"Sun", "Moon", "Mars"}, "neutrals": {"Saturn"}, "enemies": {"Mercury", "Venus", "Rahu", "Ketu"}},
    "Venus": {"friends": {"Mercury", "Saturn"}, "neutrals": {"Mars", "Jupiter"}, "enemies": {"Sun", "Moon", "Rahu", "Ketu"}},
    "Saturn": {"friends": {"Mercury", "Venus"}, "neutrals": {"Jupiter"}, "enemies": {"Sun", "Moon", "Mars", "Rahu", "Ketu"}},
    "Rahu": {"friends": {"Mercury", "Venus", "Saturn"}, "neutrals": {"Jupiter"}, "enemies": {"Sun", "Moon", "Mars", "Ketu"}},
    "Ketu": {"friends": {"Mars", "Venus", "Saturn"}, "neutrals": {"Mercury", "Jupiter"}, "enemies": {"Sun", "Moon", "Rahu"}},
}


# ---------------------------------------------------------------------------
# Private scoring functions
# ---------------------------------------------------------------------------

def _get_relationship(planet_a: str, planet_b: str) -> str:
    """Get relationship of planet_a towards planet_b."""
    info = PLANET_FRIENDS.get(planet_a, {})
    if planet_b in info.get("friends", set()):
        return "friend"
    if planet_b in info.get("enemies", set()):
        return "enemy"
    return "neutral"


def _score_varna(user_nak: str, partner_nak: str) -> tuple[float, str]:
    """Varna koota: max 1 point."""
    u_varna = NAKSHATRA_VARNA[user_nak]
    p_varna = NAKSHATRA_VARNA[partner_nak]
    u_rank = VARNA_RANK[u_varna]
    p_rank = VARNA_RANK[p_varna]

    if u_rank >= p_rank:
        return 1, f"Varna compatible: {u_varna} (user) and {p_varna} (partner) - user varna is equal or higher."
    else:
        return 0, f"Varna incompatible: {u_varna} (user) is lower than {p_varna} (partner)."


def _score_vashya(user_sign: str, partner_sign: str) -> tuple[float, str]:
    """Vashya koota: max 2 points."""
    u_cat = SIGN_VASHYA[user_sign]
    p_cat = SIGN_VASHYA[partner_sign]

    pair = frozenset([u_cat, p_cat]) if u_cat != p_cat else frozenset([u_cat])
    score = VASHYA_COMPATIBILITY.get(pair, 0)
    return score, f"Vashya: {u_cat} (user) and {p_cat} (partner) score {score}/2 for mutual attraction."


def _score_tara(user_nak: str, partner_nak: str) -> tuple[float, str]:
    """Tara koota: max 3 points."""
    u_idx = NAKSHATRAS.index(user_nak)
    p_idx = NAKSHATRAS.index(partner_nak)

    count = ((p_idx - u_idx) % 27) + 1
    remainder = count % 9
    if remainder == 0:
        remainder = 9

    favorable = {1, 2, 4, 6, 8, 9}
    semi_favorable = {3, 5}

    if remainder in favorable:
        score = 3
        desc = f"Tara favorable (remainder {remainder}): indicates auspicious energy flow between partners."
    elif remainder in semi_favorable:
        score = 1.5
        desc = f"Tara semi-favorable (remainder {remainder}): moderate compatibility in destiny alignment."
    else:
        score = 0
        desc = f"Tara unfavorable (remainder {remainder}): challenging karmic relationship indicated."

    return score, desc


def _score_yoni(user_nak: str, partner_nak: str) -> tuple[float, str]:
    """Yoni koota: max 4 points."""
    u_animal = NAKSHATRA_YONI[user_nak]
    p_animal = NAKSHATRA_YONI[partner_nak]

    if u_animal == p_animal:
        return 4, f"Yoni: same animal ({u_animal}) - excellent sexual and physical compatibility."

    pair = frozenset([u_animal, p_animal])
    if pair in YONI_ENEMIES:
        return 0, f"Yoni: enemy animals ({u_animal} and {p_animal}) - significant physical incompatibility."

    # Friendly = 3, neutral = 2, unfriendly = 1
    # Simplified: non-enemy, non-same → assign 2 (neutral) as default
    return 2, f"Yoni: {u_animal} (user) and {p_animal} (partner) - moderate physical compatibility."


def _score_graha_maitri(user_nak: str, partner_nak: str) -> tuple[float, str]:
    """Graha Maitri koota: max 5 points."""
    u_idx = NAKSHATRAS.index(user_nak)
    p_idx = NAKSHATRAS.index(partner_nak)
    u_lord = NAKSHATRA_LORDS[u_idx]
    p_lord = NAKSHATRA_LORDS[p_idx]

    if u_lord == p_lord:
        return 5, f"Graha Maitri: same lord ({u_lord}) - excellent mental and intellectual compatibility."

    rel_a = _get_relationship(u_lord, p_lord)
    rel_b = _get_relationship(p_lord, u_lord)

    rels = sorted([rel_a, rel_b])

    if rels == ["friend", "friend"]:
        score = 5
    elif rels == ["friend", "neutral"]:
        score = 4
    elif rels == ["neutral", "neutral"]:
        score = 3
    elif "friend" in rels and "enemy" in rels:
        score = 1
    elif "enemy" in rels and "neutral" in rels:
        score = 1
    elif rels == ["enemy", "enemy"]:
        score = 0
    else:
        score = 3  # fallback

    return score, f"Graha Maitri: lords {u_lord} and {p_lord} ({rel_a}/{rel_b}) score {score}/5 for mental harmony."


def _score_gana(user_nak: str, partner_nak: str) -> tuple[float, str]:
    """Gana koota: max 6 points."""
    u_gana = NAKSHATRA_GANA[user_nak]
    p_gana = NAKSHATRA_GANA[partner_nak]
    score = GANA_COMPATIBILITY[(u_gana, p_gana)]
    return score, f"Gana: {u_gana} (user) and {p_gana} (partner) - temperament compatibility score {score}/6."


def _score_bhakoot(user_sign: str, partner_sign: str) -> tuple[float, str]:
    """Bhakoot koota: max 7 points."""
    u_idx = SANSKRIT_SIGNS.index(user_sign)
    p_idx = SANSKRIT_SIGNS.index(partner_sign)

    dist_forward = ((p_idx - u_idx) % 12) + 1
    dist_backward = ((u_idx - p_idx) % 12) + 1

    unfavorable_pairs = [{2, 12}, {5, 9}, {6, 8}]

    pair = {dist_forward, dist_backward}
    for uf in unfavorable_pairs:
        if pair == uf:
            return 0, f"Bhakoot: {user_sign} to {partner_sign} ({dist_forward}/{dist_backward}) is unfavorable - potential health or financial challenges."

    return 7, f"Bhakoot: {user_sign} to {partner_sign} ({dist_forward}/{dist_backward}) is favorable - good overall prosperity."


def _score_nadi(user_nak: str, partner_nak: str, user_pada: int, partner_pada: int) -> tuple[float, str]:
    """Nadi koota: max 8 points."""
    # Exception: same nakshatra but different pada → score 8
    if user_nak == partner_nak and user_pada != partner_pada:
        return 8, f"Nadi exception: same nakshatra ({user_nak}) with different padas - no nadi dosha."

    u_nadi = NAKSHATRA_NADI[user_nak]
    p_nadi = NAKSHATRA_NADI[partner_nak]

    if u_nadi == p_nadi:
        return 0, f"Nadi dosha: both have {u_nadi} nadi - indicates potential health issues for progeny."
    else:
        return 8, f"Nadi: {u_nadi} (user) and {p_nadi} (partner) - different nadis indicate good health compatibility."


# ---------------------------------------------------------------------------
# Mangal Dosha
# ---------------------------------------------------------------------------

MANGAL_DOSHA_HOUSES = {1, 4, 7, 8, 12}


def _check_mangal_dosha(mars_house: int | None) -> tuple[bool, str | None]:
    """Check if Mars placement causes Mangal Dosha."""
    if mars_house is None:
        return False, None
    if mars_house in MANGAL_DOSHA_HOUSES:
        if mars_house in {7, 8}:
            severity = "strong"
        elif mars_house in {1, 4}:
            severity = "moderate"
        else:
            severity = "mild"
        return True, severity
    return False, None


# ---------------------------------------------------------------------------
# Main Function
# ---------------------------------------------------------------------------

def calculate_ashtakoota(
    user_moon_sign: str,
    user_nakshatra: str,
    user_pada: int,
    partner_moon_sign: str,
    partner_nakshatra: str,
    partner_pada: int,
    user_mars_house: int | None = None,
    partner_mars_house: int | None = None,
) -> dict:
    """Calculate Ashtakoota (8-koota) compatibility score.

    Args:
        user_moon_sign: Sanskrit name of user's Moon rashi
        user_nakshatra: Name of user's birth nakshatra
        user_pada: Pada (1-4) of user's nakshatra
        partner_moon_sign: Sanskrit name of partner's Moon rashi
        partner_nakshatra: Name of partner's birth nakshatra
        partner_pada: Pada (1-4) of partner's nakshatra
        user_mars_house: House number (1-12) where user's Mars is placed
        partner_mars_house: House number (1-12) where partner's Mars is placed

    Returns:
        Dictionary with score, max_score, rating, kootas, doshas, and mangal dosha flags.
    """
    # Calculate all 8 kootas
    koota_results = [
        ("Varna", 1, _score_varna(user_nakshatra, partner_nakshatra)),
        ("Vashya", 2, _score_vashya(user_moon_sign, partner_moon_sign)),
        ("Tara", 3, _score_tara(user_nakshatra, partner_nakshatra)),
        ("Yoni", 4, _score_yoni(user_nakshatra, partner_nakshatra)),
        ("Graha Maitri", 5, _score_graha_maitri(user_nakshatra, partner_nakshatra)),
        ("Gana", 6, _score_gana(user_nakshatra, partner_nakshatra)),
        ("Bhakoot", 7, _score_bhakoot(user_moon_sign, partner_moon_sign)),
        ("Nadi", 8, _score_nadi(user_nakshatra, partner_nakshatra, user_pada, partner_pada)),
    ]

    kootas = []
    for name, max_score, (score, desc) in koota_results:
        kootas.append({
            "name": name,
            "score": score,
            "max_score": max_score,
            "description": desc,
        })

    total_score = sum(k["score"] for k in kootas)

    # Rating
    if total_score >= 31:
        rating = "Excellent"
    elif total_score >= 25:
        rating = "Good"
    elif total_score >= 18:
        rating = "Average"
    else:
        rating = "Not Recommended"

    # Mangal Dosha
    user_mangal, user_severity = _check_mangal_dosha(user_mars_house)
    partner_mangal, partner_severity = _check_mangal_dosha(partner_mars_house)

    both_have = user_mangal and partner_mangal
    doshas: list[dict] = []

    remedy_text = (
        "Performing Mangal Shanti puja, chanting Hanuman Chalisa, "
        "and wearing a coral gemstone are traditional remedies."
    )

    if user_mangal:
        doshas.append({
            "type": "Mangal Dosha",
            "person": "user",
            "severity": user_severity,
            "canceled": both_have,
            "remedy": "" if both_have else remedy_text,
        })

    if partner_mangal:
        doshas.append({
            "type": "Mangal Dosha",
            "person": "partner",
            "severity": partner_severity,
            "canceled": both_have,
            "remedy": "" if both_have else remedy_text,
        })

    return {
        "score": total_score,
        "max_score": 36,
        "rating": rating,
        "kootas": kootas,
        "doshas": doshas,
        "mangal_dosha_user": user_mangal,
        "mangal_dosha_partner": partner_mangal,
    }
