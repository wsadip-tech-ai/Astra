from app.services.yogas import detect_yogas


def _make_planets(placements: dict[str, dict]) -> list[dict]:
    """Helper to create planet list from simplified placements."""
    planets = []
    for name, data in placements.items():
        planets.append({
            "name": name,
            "sign": data.get("sign", "Mesha"),
            "degree": data.get("degree", 15),
            "house": data.get("house", 1),
            "nakshatra": data.get("nakshatra", "Ashwini"),
            "retrograde": data.get("retrograde", False),
        })
    return planets


def test_gaja_kesari_yoga_present():
    planets = _make_planets({
        "Sun": {"house": 3, "sign": "Mithuna"},
        "Moon": {"house": 1, "sign": "Mesha"},
        "Mercury": {"house": 3, "sign": "Mithuna"},
        "Venus": {"house": 4, "sign": "Karka"},
        "Mars": {"house": 6, "sign": "Kanya"},
        "Jupiter": {"house": 1, "sign": "Mesha"},
        "Saturn": {"house": 8, "sign": "Vrishchika"},
        "Rahu": {"house": 2, "sign": "Vrishabha"},
        "Ketu": {"house": 8, "sign": "Vrishchika"},
    })
    result = detect_yogas(planets, "Mesha")
    names = [y["name"] for y in result]
    assert "Gaja Kesari Yoga" in names
    yoga = next(y for y in result if y["name"] == "Gaja Kesari Yoga")
    assert yoga["present"] is True


def test_gaja_kesari_yoga_absent():
    planets = _make_planets({
        "Sun": {"house": 3, "sign": "Mithuna"},
        "Moon": {"house": 1, "sign": "Mesha"},
        "Mercury": {"house": 3, "sign": "Mithuna"},
        "Venus": {"house": 4, "sign": "Karka"},
        "Mars": {"house": 6, "sign": "Kanya"},
        "Jupiter": {"house": 3, "sign": "Mithuna"},
        "Saturn": {"house": 8, "sign": "Vrishchika"},
        "Rahu": {"house": 2, "sign": "Vrishabha"},
        "Ketu": {"house": 8, "sign": "Vrishchika"},
    })
    result = detect_yogas(planets, "Mesha")
    yoga = next(y for y in result if y["name"] == "Gaja Kesari Yoga")
    assert yoga["present"] is False


def test_budhaditya_yoga_present():
    planets = _make_planets({
        "Sun": {"house": 3, "sign": "Mithuna"},
        "Moon": {"house": 1, "sign": "Mesha"},
        "Mercury": {"house": 3, "sign": "Mithuna"},
        "Venus": {"house": 4, "sign": "Karka"},
        "Mars": {"house": 6, "sign": "Kanya"},
        "Jupiter": {"house": 1, "sign": "Mesha"},
        "Saturn": {"house": 8, "sign": "Vrishchika"},
        "Rahu": {"house": 2, "sign": "Vrishabha"},
        "Ketu": {"house": 8, "sign": "Vrishchika"},
    })
    result = detect_yogas(planets, "Mesha")
    yoga = next(y for y in result if y["name"] == "Budhaditya Yoga")
    assert yoga["present"] is True


def test_chandra_mangal_yoga():
    planets = _make_planets({
        "Sun": {"house": 3, "sign": "Mithuna"},
        "Moon": {"house": 6, "sign": "Kanya"},
        "Mercury": {"house": 3, "sign": "Mithuna"},
        "Venus": {"house": 4, "sign": "Karka"},
        "Mars": {"house": 6, "sign": "Kanya"},
        "Jupiter": {"house": 3, "sign": "Mithuna"},
        "Saturn": {"house": 8, "sign": "Vrishchika"},
        "Rahu": {"house": 2, "sign": "Vrishabha"},
        "Ketu": {"house": 8, "sign": "Vrishchika"},
    })
    result = detect_yogas(planets, "Mesha")
    yoga = next(y for y in result if y["name"] == "Chandra-Mangal Yoga")
    assert yoga["present"] is True


def test_mangal_dosha_mars_in_7th():
    planets = _make_planets({
        "Sun": {"house": 3, "sign": "Mithuna"},
        "Moon": {"house": 1, "sign": "Mesha"},
        "Mercury": {"house": 3, "sign": "Mithuna"},
        "Venus": {"house": 4, "sign": "Karka"},
        "Mars": {"house": 7, "sign": "Tula"},
        "Jupiter": {"house": 3, "sign": "Mithuna"},
        "Saturn": {"house": 8, "sign": "Vrishchika"},
        "Rahu": {"house": 2, "sign": "Vrishabha"},
        "Ketu": {"house": 8, "sign": "Vrishchika"},
    })
    result = detect_yogas(planets, "Mesha")
    yoga = next(y for y in result if y["name"] == "Mangal Dosha")
    assert yoga["present"] is True


def test_mangal_dosha_mars_in_5th_absent():
    planets = _make_planets({
        "Sun": {"house": 3, "sign": "Mithuna"},
        "Moon": {"house": 1, "sign": "Mesha"},
        "Mercury": {"house": 3, "sign": "Mithuna"},
        "Venus": {"house": 4, "sign": "Karka"},
        "Mars": {"house": 5, "sign": "Simha"},
        "Jupiter": {"house": 3, "sign": "Mithuna"},
        "Saturn": {"house": 8, "sign": "Vrishchika"},
        "Rahu": {"house": 2, "sign": "Vrishabha"},
        "Ketu": {"house": 8, "sign": "Vrishchika"},
    })
    result = detect_yogas(planets, "Mesha")
    yoga = next(y for y in result if y["name"] == "Mangal Dosha")
    assert yoga["present"] is False


def test_detect_yogas_returns_all_6_yogas():
    planets = _make_planets({
        "Sun": {"house": 1, "sign": "Mesha"},
        "Moon": {"house": 1, "sign": "Mesha"},
        "Mercury": {"house": 2, "sign": "Vrishabha"},
        "Venus": {"house": 4, "sign": "Karka"},
        "Mars": {"house": 6, "sign": "Kanya"},
        "Jupiter": {"house": 9, "sign": "Dhanu"},
        "Saturn": {"house": 10, "sign": "Makara"},
        "Rahu": {"house": 3, "sign": "Mithuna"},
        "Ketu": {"house": 9, "sign": "Dhanu"},
    })
    result = detect_yogas(planets, "Mesha")
    names = [y["name"] for y in result]
    assert "Gaja Kesari Yoga" in names
    assert "Lakshmi Yoga" in names
    assert "Vasumati Yoga" in names
    assert "Budhaditya Yoga" in names
    assert "Chandra-Mangal Yoga" in names
    assert "Mangal Dosha" in names


def test_yoga_has_required_fields():
    planets = _make_planets({
        "Sun": {"house": 1, "sign": "Mesha"},
        "Moon": {"house": 1, "sign": "Mesha"},
        "Mercury": {"house": 2, "sign": "Vrishabha"},
        "Venus": {"house": 4, "sign": "Karka"},
        "Mars": {"house": 6, "sign": "Kanya"},
        "Jupiter": {"house": 1, "sign": "Mesha"},
        "Saturn": {"house": 10, "sign": "Makara"},
        "Rahu": {"house": 3, "sign": "Mithuna"},
        "Ketu": {"house": 9, "sign": "Dhanu"},
    })
    result = detect_yogas(planets, "Mesha")
    for yoga in result:
        assert "name" in yoga
        assert "present" in yoga
        assert "strength" in yoga
        assert "interpretation" in yoga
        assert yoga["strength"] in ("strong", "moderate", "mild", "none")
