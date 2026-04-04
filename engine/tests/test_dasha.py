from app.services.dasha import calculate_vimshottari_dasha, DASHA_SEQUENCE, DASHA_YEARS
from datetime import date


def test_dasha_sequence_sums_to_120():
    total = sum(DASHA_YEARS[planet] for planet in DASHA_SEQUENCE)
    assert total == 120


def test_dasha_returns_9_mahadashas():
    # Moon at 40° sidereal (Rohini nakshatra, ruled by Moon)
    result = calculate_vimshottari_dasha(
        moon_longitude=40.0,
        date_of_birth="1990-05-15",
    )
    assert len(result["mahadashas"]) == 9


def test_dasha_mahadashas_cover_120_years():
    result = calculate_vimshottari_dasha(
        moon_longitude=40.0,
        date_of_birth="1990-05-15",
    )
    first_start = date.fromisoformat(result["mahadashas"][0]["start"])
    last_end = date.fromisoformat(result["mahadashas"][-1]["end"])
    total_days = (last_end - first_start).days
    # 120 years ~ 43800 days (allow some tolerance for leap years)
    assert 43700 < total_days < 43900


def test_dasha_current_period_identified():
    result = calculate_vimshottari_dasha(
        moon_longitude=40.0,
        date_of_birth="1990-05-15",
    )
    assert "current_mahadasha" in result
    assert "planet" in result["current_mahadasha"]
    assert "start" in result["current_mahadasha"]
    assert "end" in result["current_mahadasha"]


def test_dasha_antardashas_present():
    result = calculate_vimshottari_dasha(
        moon_longitude=40.0,
        date_of_birth="1990-05-15",
    )
    assert "current_antardasha" in result
    assert "planet" in result["current_antardasha"]
    assert "start" in result["current_antardasha"]
    assert "end" in result["current_antardasha"]


def test_dasha_upcoming_antardashas():
    result = calculate_vimshottari_dasha(
        moon_longitude=40.0,
        date_of_birth="1990-05-15",
    )
    assert "upcoming_antardashas" in result
    assert len(result["upcoming_antardashas"]) <= 3


def test_dasha_rohini_nakshatra_starts_with_moon():
    # Rohini (40° to 53.33°) is ruled by Moon
    result = calculate_vimshottari_dasha(
        moon_longitude=43.0,  # Start of Rohini
        date_of_birth="1990-01-01",
    )
    # First dasha should start with Moon's sequence position
    # Moon rules Rohini, so the birth dasha is Moon
    assert result["mahadashas"][0]["planet"] == "Moon"


def test_dasha_ashwini_nakshatra_starts_with_ketu():
    # Ashwini (0° to 13.33°) is ruled by Ketu
    result = calculate_vimshottari_dasha(
        moon_longitude=5.0,
        date_of_birth="2000-01-01",
    )
    assert result["mahadashas"][0]["planet"] == "Ketu"


def test_dasha_antardasha_count_in_mahadasha():
    result = calculate_vimshottari_dasha(
        moon_longitude=40.0,
        date_of_birth="1990-05-15",
    )
    # Each mahadasha should have exactly 9 antardashas
    for md in result["mahadashas"]:
        assert len(md["antardashas"]) == 9
