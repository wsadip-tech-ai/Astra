from app.services.transits import calculate_transits, calculate_personal_transits
from datetime import date

VALID_SIGNS = {
    "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
    "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
}

VEDIC_GRAHAS = {"Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ketu"}


def test_transits_returns_9_grahas():
    result = calculate_transits(date.today().isoformat())
    assert len(result["planets"]) == 9
    names = {p["name"] for p in result["planets"]}
    assert names == VEDIC_GRAHAS


def test_transits_planets_have_required_fields():
    result = calculate_transits(date.today().isoformat())
    for planet in result["planets"]:
        assert planet["sign"] in VALID_SIGNS
        assert 0 <= planet["degree"] <= 29
        assert isinstance(planet["nakshatra"], str)
        assert 1 <= planet["pada"] <= 4
        assert isinstance(planet["retrograde"], bool)


ORDERED_SIGNS = [
    "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
    "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
]


def test_transits_rahu_ketu_opposite():
    result = calculate_transits(date.today().isoformat())
    rahu = next(p for p in result["planets"] if p["name"] == "Rahu")
    ketu = next(p for p in result["planets"] if p["name"] == "Ketu")
    rahu_idx = ORDERED_SIGNS.index(rahu["sign"])
    ketu_idx = ORDERED_SIGNS.index(ketu["sign"])
    diff = abs(rahu_idx - ketu_idx)
    assert diff == 6


def test_transits_returns_date():
    today = date.today().isoformat()
    result = calculate_transits(today)
    assert result["date"] == today


def test_transits_returns_dominant_element():
    result = calculate_transits(date.today().isoformat())
    assert result["dominant_element"] in ("Fire", "Earth", "Air", "Water")


def test_personal_transits_returns_aspects():
    natal_planets = [
        {"name": "Sun", "sign": "Mesha", "degree": 15, "house": 1},
        {"name": "Moon", "sign": "Vrishabha", "degree": 10, "house": 2},
        {"name": "Mars", "sign": "Kanya", "degree": 20, "house": 6},
        {"name": "Jupiter", "sign": "Dhanu", "degree": 5, "house": 9},
        {"name": "Saturn", "sign": "Makara", "degree": 25, "house": 10},
    ]
    result = calculate_personal_transits(
        natal_planets=natal_planets,
        moon_sign="Vrishabha",
        date_str=date.today().isoformat(),
    )
    assert "transit_aspects" in result
    assert "vedha_flags" in result
    assert "murthi_nirnaya" in result
    assert isinstance(result["transit_aspects"], list)


def test_personal_transits_murthi_nirnaya_valid():
    natal_planets = [
        {"name": "Moon", "sign": "Mesha", "degree": 10, "house": 1},
    ]
    result = calculate_personal_transits(
        natal_planets=natal_planets,
        moon_sign="Mesha",
        date_str=date.today().isoformat(),
    )
    assert result["murthi_nirnaya"] in ("Gold", "Silver", "Copper", "Iron")


def test_transits_for_specific_date():
    result = calculate_transits("2026-01-01")
    assert len(result["planets"]) == 9
    for p in result["planets"]:
        assert p["sign"] in VALID_SIGNS
