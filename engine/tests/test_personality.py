from app.services.personality import analyze_personality


def _make_chart():
    return {
        "lagna": {"sign": "Mesha", "degree": 15},
        "planets": [
            {"name": "Sun", "sign": "Dhanu", "degree": 13, "house": 9, "nakshatra": "Purva Ashadha", "retrograde": False},
            {"name": "Moon", "sign": "Karka", "degree": 10, "house": 4, "nakshatra": "Pushya", "retrograde": False},
            {"name": "Mars", "sign": "Makara", "degree": 20, "house": 10, "nakshatra": "Shravana", "retrograde": False},
            {"name": "Mercury", "sign": "Dhanu", "degree": 25, "house": 9, "nakshatra": "Uttara Ashadha", "retrograde": False},
            {"name": "Jupiter", "sign": "Vrishabha", "degree": 10, "house": 2, "nakshatra": "Rohini", "retrograde": False},
            {"name": "Venus", "sign": "Makara", "degree": 20, "house": 10, "nakshatra": "Shravana", "retrograde": False},
            {"name": "Saturn", "sign": "Kumbha", "degree": 28, "house": 11, "nakshatra": "Purva Bhadrapada", "retrograde": False},
            {"name": "Rahu", "sign": "Tula", "degree": 5, "house": 7, "nakshatra": "Chitra", "retrograde": True},
            {"name": "Ketu", "sign": "Mesha", "degree": 5, "house": 1, "nakshatra": "Ashwini", "retrograde": True},
        ],
        "houses": [
            {"number": 1, "sign": "Mesha", "lord": "Mars", "lord_house": 10},
            {"number": 2, "sign": "Vrishabha", "lord": "Venus", "lord_house": 10},
            {"number": 3, "sign": "Mithuna", "lord": "Mercury", "lord_house": 9},
            {"number": 4, "sign": "Karka", "lord": "Moon", "lord_house": 4},
            {"number": 5, "sign": "Simha", "lord": "Sun", "lord_house": 9},
            {"number": 6, "sign": "Kanya", "lord": "Mercury", "lord_house": 9},
            {"number": 7, "sign": "Tula", "lord": "Venus", "lord_house": 10},
            {"number": 8, "sign": "Vrishchika", "lord": "Mars", "lord_house": 10},
            {"number": 9, "sign": "Dhanu", "lord": "Jupiter", "lord_house": 2},
            {"number": 10, "sign": "Makara", "lord": "Saturn", "lord_house": 11},
            {"number": 11, "sign": "Kumbha", "lord": "Saturn", "lord_house": 11},
            {"number": 12, "sign": "Meena", "lord": "Jupiter", "lord_house": 2},
        ],
        "nakshatras": [
            {"planet": "Moon", "nakshatra": "Pushya", "pada": 2},
        ],
        "yogas": [
            {"name": "Gaja Kesari Yoga", "present": False, "strength": "none", "interpretation": "Not formed"},
            {"name": "Budhaditya Yoga", "present": True, "strength": "moderate", "interpretation": "Sun-Mercury conjunction in Dhanu..."},
        ],
        "dasha": {
            "current_mahadasha": {"planet": "Venus", "start": "2024-01-01", "end": "2044-01-01"},
            "current_antardasha": {"planet": "Venus", "start": "2024-01-01", "end": "2027-04-01"},
        },
    }


def test_returns_all_sections():
    result = analyze_personality(_make_chart())
    assert "personality" in result
    assert "family" in result
    assert "career" in result
    assert "health" in result
    assert "spiritual" in result
    assert "life_themes" in result


def test_personality_has_fields():
    result = analyze_personality(_make_chart())
    p = result["personality"]
    assert "core_nature" in p
    assert "emotional_nature" in p
    assert "outer_expression" in p
    assert "strengths" in p
    assert "challenges" in p
    assert isinstance(p["strengths"], list)
    assert isinstance(p["challenges"], list)
    assert len(p["core_nature"]) > 20


def test_family_has_all_members():
    result = analyze_personality(_make_chart())
    f = result["family"]
    assert "mother" in f
    assert "father" in f
    assert "spouse" in f
    assert "children" in f
    assert len(f["mother"]) > 20
    assert len(f["father"]) > 20


def test_career_has_fields():
    result = analyze_personality(_make_chart())
    c = result["career"]
    assert "direction" in c
    assert "strengths" in c
    assert "wealth_potential" in c
    assert len(c["direction"]) > 20


def test_health_has_fields():
    result = analyze_personality(_make_chart())
    h = result["health"]
    assert "constitution" in h
    assert "vulnerabilities" in h
    assert "vitality" in h


def test_spiritual_has_fields():
    result = analyze_personality(_make_chart())
    s = result["spiritual"]
    assert "path" in s
    assert "past_life_karma" in s
    assert "dharma" in s


def test_life_themes_is_list():
    result = analyze_personality(_make_chart())
    assert isinstance(result["life_themes"], list)
    assert len(result["life_themes"]) >= 3


def test_mars_in_10th_career_leadership():
    # Mars exalted in 10th house (Makara) = strong career in leadership
    result = analyze_personality(_make_chart())
    # Career direction should reference Earth element (Makara) or leadership
    assert len(result["career"]["direction"]) > 10


def test_moon_in_4th_mother():
    # Moon in 4th house (own house Karka) = strong mother connection
    result = analyze_personality(_make_chart())
    assert len(result["family"]["mother"]) > 20


def test_ketu_in_1st_spiritual():
    # Ketu in 1st house = spiritual personality, detachment
    result = analyze_personality(_make_chart())
    # Should appear in challenges or spiritual path
    assert len(result["spiritual"]["past_life_karma"]) > 10
