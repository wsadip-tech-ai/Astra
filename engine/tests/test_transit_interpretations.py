from app.services.transit_interpretations import interpret_transit, interpret_all_transits


def test_interpret_transit_favorable():
    result = interpret_transit("Jupiter", "Dhanu", 9, False)
    assert result["planet"] == "Jupiter"
    assert result["house"] == 9
    assert result["is_favorable"] is True
    assert result["tone"] == "supportive"
    assert len(result["summary"]) > 20
    assert len(result["life_areas"]) > 0


def test_interpret_transit_challenging():
    result = interpret_transit("Saturn", "Makara", 1, False)
    assert result["is_favorable"] is False
    assert result["tone"] == "challenging"


def test_interpret_transit_retrograde():
    result = interpret_transit("Mercury", "Kumbha", 3, True)
    assert result["retrograde_note"] is not None
    assert "retrograde" in result["retrograde_note"].lower()


def test_interpret_transit_no_retrograde():
    result = interpret_transit("Sun", "Mesha", 10, False)
    assert result["retrograde_note"] is None


def test_interpret_transit_dasha_connection():
    result = interpret_transit("Moon", "Tula", 7, False, dasha_lord="Moon")
    assert result["dasha_connection"] is not None
    assert "Dasha lord" in result["dasha_connection"]


def test_interpret_transit_no_dasha_connection():
    result = interpret_transit("Moon", "Tula", 7, False, dasha_lord="Saturn")
    assert result["dasha_connection"] is None


def test_interpret_all_transits_returns_structure():
    transit_houses = {"Sun": 10, "Moon": 7, "Jupiter": 9, "Saturn": 1, "Mars": 6}
    transit_planets = [
        {"name": "Sun", "sign": "Mesha", "retrograde": False},
        {"name": "Moon", "sign": "Tula", "retrograde": False},
        {"name": "Jupiter", "sign": "Dhanu", "retrograde": False},
        {"name": "Saturn", "sign": "Makara", "retrograde": False},
        {"name": "Mars", "sign": "Kanya", "retrograde": False},
    ]
    result = interpret_all_transits(transit_houses, transit_planets, "Moon")
    assert "planet_interpretations" in result
    assert "life_area_summary" in result
    assert "favorable_count" in result
    assert "challenging_count" in result
    assert "overall_outlook" in result
    assert len(result["planet_interpretations"]) == 5


def test_interpret_all_transits_life_areas():
    transit_houses = {"Jupiter": 2, "Venus": 7, "Saturn": 10}
    transit_planets = [
        {"name": "Jupiter", "sign": "Vrishabha", "retrograde": False},
        {"name": "Venus", "sign": "Tula", "retrograde": False},
        {"name": "Saturn", "sign": "Makara", "retrograde": False},
    ]
    result = interpret_all_transits(transit_houses, transit_planets)
    assert "Finance & Career" in result["life_area_summary"]
    assert "Relationships & Family" in result["life_area_summary"]


def test_interpret_all_transits_counts():
    transit_houses = {"Sun": 3, "Moon": 1, "Saturn": 8}
    transit_planets = [
        {"name": "Sun", "sign": "Mithuna", "retrograde": False},
        {"name": "Moon", "sign": "Mesha", "retrograde": False},
        {"name": "Saturn", "sign": "Vrishchika", "retrograde": False},
    ]
    result = interpret_all_transits(transit_houses, transit_planets)
    assert result["favorable_count"] + result["challenging_count"] == 3
