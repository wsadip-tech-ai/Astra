from app.services.vaastu.hit_calculator import (
    to_compound_degree, classify_angle, calculate_hits,
)


def test_compound_degree_aries_10():
    assert to_compound_degree("Mesha", 10) == 10.0

def test_compound_degree_taurus_10():
    assert to_compound_degree("Vrishabha", 10) == 40.0

def test_compound_degree_pisces_29():
    assert to_compound_degree("Meena", 29) == 359.0

def test_compound_degree_leo_15():
    assert to_compound_degree("Simha", 15) == 135.0

def test_classify_angle_killer():
    assert classify_angle(180.0) == "killer"
    assert classify_angle(175.0) == "killer"
    assert classify_angle(187.5) == "killer"

def test_classify_angle_dangerous():
    assert classify_angle(90.0) == "dangerous"
    assert classify_angle(86.0) == "dangerous"
    assert classify_angle(94.5) == "dangerous"

def test_classify_angle_obstacle():
    assert classify_angle(45.0) == "obstacle"
    assert classify_angle(42.5) == "obstacle"
    assert classify_angle(47.8) == "obstacle"

def test_classify_angle_best_support():
    assert classify_angle(120.0) == "best_support"
    assert classify_angle(116.0) == "best_support"
    assert classify_angle(124.5) == "best_support"

def test_classify_angle_friend():
    assert classify_angle(60.0) == "friend"
    assert classify_angle(57.5) == "friend"
    assert classify_angle(62.8) == "friend"

def test_classify_angle_positive():
    assert classify_angle(30.0) == "positive"
    assert classify_angle(27.5) == "positive"
    assert classify_angle(32.8) == "positive"

def test_classify_angle_none():
    assert classify_angle(15.0) is None
    assert classify_angle(70.0) is None
    assert classify_angle(150.0) is None

def test_calculate_hits_returns_structure():
    planets = [
        {"name": "Sun", "sign": "Mesha", "degree": 10},
        {"name": "Moon", "sign": "Tula", "degree": 10},
        {"name": "Mars", "sign": "Karka", "degree": 10},
        {"name": "Jupiter", "sign": "Simha", "degree": 10},
    ]
    result = calculate_hits(planets, "Sun")
    assert "primary_hits" in result
    assert "secondary_hits" in result
    assert "positive_hits" in result
    assert result["dasha_lord"] == "Sun"

def test_calculate_hits_sun_moon_opposition():
    planets = [
        {"name": "Sun", "sign": "Mesha", "degree": 10},    # 10°
        {"name": "Moon", "sign": "Tula", "degree": 10},     # 190° → diff=180° = killer
    ]
    result = calculate_hits(planets, "Sun")
    killer_hits = [h for h in result["primary_hits"] if h["type"] == "killer"]
    assert len(killer_hits) >= 1
    assert "direction" in killer_hits[0]

def test_calculate_hits_90_degree():
    planets = [
        {"name": "Sun", "sign": "Mesha", "degree": 10},    # 10°
        {"name": "Saturn", "sign": "Karka", "degree": 10},  # 100° → diff=90° = dangerous
    ]
    result = calculate_hits(planets, "Sun")
    dangerous = [h for h in result["primary_hits"] if h["type"] == "dangerous"]
    assert len(dangerous) >= 1

def test_calculate_hits_positive_120():
    planets = [
        {"name": "Sun", "sign": "Mesha", "degree": 10},     # 10°
        {"name": "Jupiter", "sign": "Simha", "degree": 10},  # 130° → diff=120° = best_support
    ]
    result = calculate_hits(planets, "Sun")
    positive = [h for h in result["positive_hits"] if h["type"] == "best_support"]
    assert len(positive) >= 1

def test_calculate_hits_dasha_lord_primary():
    planets = [
        {"name": "Moon", "sign": "Mesha", "degree": 10},
        {"name": "Saturn", "sign": "Tula", "degree": 10},   # 180° from Moon = killer
        {"name": "Sun", "sign": "Karka", "degree": 10},     # 90° from Moon = dangerous
    ]
    result = calculate_hits(planets, "Moon")
    for hit in result["primary_hits"]:
        assert "Moon" in (hit["attacker"], hit["victim"])

def test_calculate_hits_no_hits():
    planets = [
        {"name": "Sun", "sign": "Mesha", "degree": 10},
        {"name": "Moon", "sign": "Mesha", "degree": 25},     # diff=15° = no hit
    ]
    result = calculate_hits(planets, "Sun")
    assert len(result["primary_hits"]) == 0
    assert len(result["positive_hits"]) == 0
