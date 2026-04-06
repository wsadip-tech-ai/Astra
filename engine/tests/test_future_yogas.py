from app.services.future_yogas import (
    predict_gaja_kesari_windows,
    predict_upcoming_yogas,
    predict_sade_sati,
    predict_jupiter_return,
    predict_saturn_return,
    predict_rahu_ketu_moon_transit,
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
    assert "timeline" in result
    assert "next_gaja_kesari" in result
    assert "sade_sati" in result
    assert "gaja_kesari" in result
    assert "jupiter_return" in result
    assert "saturn_return" in result
    assert "rahu_ketu_moon" in result
    assert isinstance(result["currently_active"], list)
    assert isinstance(result["timeline"], list)


def test_predict_upcoming_yogas_next_is_soonest():
    result = predict_upcoming_yogas("Karka", from_date="2026-04-06", years_ahead=5)
    gk = result["gaja_kesari"]
    if result["next_gaja_kesari"] and len(gk) > 1:
        # The "next" should be the first one
        assert result["next_gaja_kesari"]["start_date"] <= gk[1]["start_date"]


# ─── Sade Sati Tests ─────────────────────────────────────────────────────────────

def test_sade_sati_returns_structure():
    result = predict_sade_sati("Karka", "2026-04-06", years_ahead=10)
    assert "currently_active" in result
    assert "current_phase" in result
    assert "phase_details" in result
    assert "remedies" in result
    assert isinstance(result["currently_active"], bool)


def test_sade_sati_has_three_phases():
    result = predict_sade_sati("Karka", "2026-04-06", years_ahead=30)
    # Over 30 years, at least one Sade Sati should occur
    details = result["phase_details"]
    assert "rising" in details or "peak" in details or "setting" in details or result.get("next_sade_sati") is not None


def test_sade_sati_remedies():
    result = predict_sade_sati("Mesha", "2026-01-01", years_ahead=10)
    assert result["remedies"]["mantra"] == "Om Shanaischaraya Namah"
    assert "patience" in result["remedies"]["practice"].lower()


# ─── Jupiter Return Tests ────────────────────────────────────────────────────────

def test_jupiter_return_finds_windows():
    # Jupiter takes ~12 years per cycle, so 15 years should find at least 1 return
    windows = predict_jupiter_return("Vrishchika", "2026-01-01", years_ahead=15)
    assert isinstance(windows, list)
    assert len(windows) >= 1
    for w in windows:
        assert "start_date" in w
        assert "end_date" in w
        assert "description" in w


def test_jupiter_return_sign_matches():
    windows = predict_jupiter_return("Mithuna", "2026-01-01", years_ahead=15)
    for w in windows:
        assert w["sign"] == "Mithuna"


# ─── Saturn Return Tests ─────────────────────────────────────────────────────────

def test_saturn_return_finds_windows():
    # Saturn takes ~29 years, so 30 years should find at least 1
    windows = predict_saturn_return("Kumbha", "2026-01-01", years_ahead=30)
    assert isinstance(windows, list)
    assert len(windows) >= 1
    for w in windows:
        assert "start_date" in w
        assert "end_date" in w
        assert w["sign"] == "Kumbha"


# ─── Rahu-Ketu Moon Transit Tests ────────────────────────────────────────────────

def test_rahu_ketu_moon_transit():
    # Rahu takes ~18 months per sign, so in 5 years it should cross Moon's sign at least once
    windows = predict_rahu_ketu_moon_transit("Karka", "2026-01-01", years_ahead=5)
    assert isinstance(windows, list)
    for w in windows:
        assert "yoga" in w
        assert w["yoga"] in ("Rahu over Moon", "Ketu over Moon")
        assert "start_date" in w


def test_rahu_ketu_finds_at_least_one():
    # Rahu/Ketu cycle is ~18 years total, so 10 years guarantees at least one hit
    windows = predict_rahu_ketu_moon_transit("Mesha", "2026-01-01", years_ahead=10)
    assert len(windows) >= 1


# ─── Combined Predict with Natal Planets ─────────────────────────────────────────

def test_predict_upcoming_yogas_with_planets():
    natal_planets = [
        {"name": "Jupiter", "sign": "Vrishchika"},
        {"name": "Saturn", "sign": "Kumbha"},
    ]
    result = predict_upcoming_yogas("Karka", natal_planets=natal_planets, from_date="2026-04-06", years_ahead=5)
    assert "sade_sati" in result
    assert "jupiter_return" in result
    assert "saturn_return" in result
    assert "rahu_ketu_moon" in result
    assert "timeline" in result
    assert isinstance(result["timeline"], list)


def test_timeline_sorted_by_date():
    natal_planets = [
        {"name": "Jupiter", "sign": "Vrishchika"},
        {"name": "Saturn", "sign": "Kumbha"},
    ]
    result = predict_upcoming_yogas("Karka", natal_planets=natal_planets, from_date="2026-04-06", years_ahead=5)
    dates = [e["start_date"] for e in result["timeline"] if e.get("start_date")]
    assert dates == sorted(dates)
