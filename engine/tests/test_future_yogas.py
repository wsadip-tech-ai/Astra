from app.services.future_yogas import (
    predict_gaja_kesari_windows,
    predict_upcoming_yogas,
    _get_jupiter_sign_on_date,
    _sign_distance,
)
from datetime import date


def test_sign_distance():
    assert _sign_distance("Karka", "Karka") == 0  # Same sign
    assert _sign_distance("Karka", "Tula") == 3    # 4th from Karka
    assert _sign_distance("Karka", "Makara") == 6  # 7th from Karka
    assert _sign_distance("Karka", "Mesha") == 9   # 10th from Karka


def test_get_jupiter_sign_returns_valid():
    sign, degree = _get_jupiter_sign_on_date(date(2026, 4, 6))
    signs = ["Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
             "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena"]
    assert sign in signs
    assert 0 <= degree <= 29


def test_predict_gaja_kesari_returns_list():
    windows = predict_gaja_kesari_windows("Karka", "2026-04-06", years_ahead=3)
    assert isinstance(windows, list)


def test_predict_gaja_kesari_has_required_fields():
    windows = predict_gaja_kesari_windows("Karka", "2026-04-06", years_ahead=3)
    if len(windows) > 0:
        w = windows[0]
        assert "yoga" in w
        assert "start_date" in w
        assert "end_date" in w
        assert "jupiter_sign" in w
        assert "kendra_house" in w
        assert "description" in w
        assert "strength" in w
        assert w["yoga"] == "Gaja Kesari"


def test_predict_gaja_kesari_karka_finds_windows():
    # For Moon in Karka, Jupiter should enter Karka, Tula, Makara, or Mesha within 5 years
    windows = predict_gaja_kesari_windows("Karka", "2026-01-01", years_ahead=5)
    assert len(windows) >= 1  # Jupiter transits at least one Kendra sign in 5 years
    for w in windows:
        assert w["kendra_house"] in [1, 4, 7, 10]


def test_predict_gaja_kesari_kendra_signs_correct():
    # Jupiter in Karka = 1st from Karka (conjunction)
    # Jupiter in Tula = 4th from Karka
    # Jupiter in Makara = 7th from Karka
    # Jupiter in Mesha = 10th from Karka
    windows = predict_gaja_kesari_windows("Karka", "2026-01-01", years_ahead=12)
    kendra_signs_found = {w["jupiter_sign"] for w in windows}
    # Over 12 years (Jupiter's full cycle), all 4 Kendra signs should appear
    expected = {"Karka", "Tula", "Makara", "Mesha"}
    assert kendra_signs_found == expected


def test_predict_upcoming_yogas_structure():
    result = predict_upcoming_yogas("Karka", from_date="2026-04-06", years_ahead=3)
    assert "currently_active" in result
    assert "upcoming" in result
    assert "next_gaja_kesari" in result
    assert isinstance(result["currently_active"], list)
    assert isinstance(result["upcoming"], list)


def test_predict_upcoming_yogas_next_is_soonest():
    result = predict_upcoming_yogas("Karka", from_date="2026-04-06", years_ahead=5)
    if result["next_gaja_kesari"] and len(result["upcoming"]) > 1:
        # The "next" should be the soonest upcoming
        assert result["next_gaja_kesari"]["start_date"] <= result["upcoming"][1]["start_date"]
