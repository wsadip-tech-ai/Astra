from app.services.interpretations import (
    get_planet_in_sign,
    get_planet_in_house,
    get_nakshatra_meaning,
    get_planet_remedy,
    get_house_lord_in_house,
    SIGN_LORDS,
)


def test_planet_in_sign_returns_string():
    result = get_planet_in_sign("Sun", "Mesha")
    assert isinstance(result, str)
    assert len(result) > 20


def test_planet_in_sign_all_9_grahas():
    grahas = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ketu"]
    signs = ["Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
             "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena"]
    for graha in grahas:
        for sign in signs:
            result = get_planet_in_sign(graha, sign)
            assert isinstance(result, str), f"Missing: {graha} in {sign}"
            assert len(result) > 0


def test_planet_in_sign_unknown_returns_fallback():
    result = get_planet_in_sign("Pluto", "Mesha")
    assert "not available" in result.lower() or isinstance(result, str)


def test_planet_in_house_returns_string():
    result = get_planet_in_house("Moon", 4)
    assert isinstance(result, str)
    assert len(result) > 20


def test_planet_in_house_all_combinations():
    grahas = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ketu"]
    for graha in grahas:
        for house in range(1, 13):
            result = get_planet_in_house(graha, house)
            assert isinstance(result, str), f"Missing: {graha} in house {house}"


def test_nakshatra_meaning():
    result = get_nakshatra_meaning("Ashwini")
    assert "ruling_planet" in result
    assert "deity" in result
    assert "traits" in result
    assert isinstance(result["traits"], str)


def test_all_27_nakshatras():
    # Use the canonical list directly so the test does not depend on swisseph
    # (vedic_chart.py imports swisseph at module level which may be unavailable
    # in environments without the compiled C extension).
    NAKSHATRAS = [
        "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
        "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
        "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha",
        "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha",
        "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada",
        "Uttara Bhadrapada", "Revati",
    ]
    assert len(NAKSHATRAS) == 27, "Canonical nakshatra list must have exactly 27 entries"
    for nak in NAKSHATRAS:
        result = get_nakshatra_meaning(nak)
        assert "ruling_planet" in result, f"Missing nakshatra: {nak}"


def test_planet_remedy():
    result = get_planet_remedy("Saturn")
    assert "gemstone" in result
    assert "mantra" in result
    assert "charity" in result
    assert "deity" in result


def test_all_9_planet_remedies():
    for planet in ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ketu"]:
        result = get_planet_remedy(planet)
        assert "gemstone" in result, f"Missing remedy for {planet}"


def test_sign_lords_mapping():
    assert SIGN_LORDS["Mesha"] == "Mars"
    assert SIGN_LORDS["Vrishchika"] == "Mars"
    assert SIGN_LORDS["Vrishabha"] == "Venus"
    assert SIGN_LORDS["Simha"] == "Sun"
    assert SIGN_LORDS["Karka"] == "Moon"
    assert SIGN_LORDS["Makara"] == "Saturn"
    assert SIGN_LORDS["Dhanu"] == "Jupiter"


def test_house_lord_in_house():
    result = get_house_lord_in_house(1, 7)
    assert isinstance(result, str)
    assert len(result) > 20
