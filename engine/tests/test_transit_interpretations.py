from app.services.transit_interpretations import interpret_transit, interpret_all_transits, get_high_impact_summary


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


def test_high_impact_returns_alerts():
    interps = [
        {"planet": "Saturn", "sign": "Makara", "house": 7, "life_areas": ["Relationships", "Marriage"], "is_favorable": False, "tone": "challenging", "summary": "Saturn in 7th...", "detailed": "...", "retrograde_note": None, "dasha_connection": None},
        {"planet": "Jupiter", "sign": "Dhanu", "house": 9, "life_areas": ["Spirituality", "Luck"], "is_favorable": True, "tone": "supportive", "summary": "Jupiter in 9th...", "detailed": "...", "retrograde_note": None, "dasha_connection": None},
        {"planet": "Moon", "sign": "Mesha", "house": 1, "life_areas": ["Self", "Health"], "is_favorable": True, "tone": "supportive", "summary": "Moon in 1st...", "detailed": "...", "retrograde_note": None, "dasha_connection": None},
    ]
    life_summary = {"Relationships & Family": {"outlook": "challenging", "planets": [{"planet": "Saturn", "house": 7, "tone": "challenging", "summary": "..."}]}}

    result = get_high_impact_summary(interps, life_summary)
    assert "alerts" in result
    assert "life_scores" in result
    assert "timeline" in result
    assert len(result["alerts"]) <= 3
    assert len(result["alerts"]) >= 1
    # Saturn in 7th (challenging, high-impact house) should rank highest
    assert result["alerts"][0]["planet"] == "Saturn"


def test_high_impact_alerts_have_remedies():
    interps = [
        {"planet": "Saturn", "sign": "Makara", "house": 10, "life_areas": ["Career"], "is_favorable": False, "tone": "challenging", "summary": "...", "detailed": "...", "retrograde_note": None, "dasha_connection": None},
    ]
    result = get_high_impact_summary(interps, {})
    alert = result["alerts"][0]
    assert "remedy" in alert
    assert "mantra" in alert["remedy"]
    assert "practice" in alert["remedy"]
    assert alert["type"] == "attention"


def test_high_impact_timeline():
    interps = [
        {"planet": "Sun", "sign": "Mesha", "house": 1, "life_areas": ["Self"], "is_favorable": True, "tone": "supportive", "summary": "...", "detailed": "...", "retrograde_note": None, "dasha_connection": None},
    ]
    upcoming = [
        {"planet": "Venus", "start": "2026-06-01", "end": "2027-02-01"},
        {"planet": "Saturn", "start": "2027-02-01", "end": "2028-09-01"},
    ]
    result = get_high_impact_summary(interps, {}, upcoming_antardashas=upcoming)
    assert len(result["timeline"]) == 2
    assert result["timeline"][0]["planet"] == "Venus"
    assert result["timeline"][0]["nature"] == "favorable"
    assert result["timeline"][1]["nature"] == "challenging"


def test_high_impact_dasha_lord_boosted():
    interps = [
        {"planet": "Moon", "sign": "Tula", "house": 3, "life_areas": ["Communication"], "is_favorable": True, "tone": "supportive", "summary": "...", "detailed": "...", "retrograde_note": None, "dasha_connection": "Moon is your Dasha lord..."},
        {"planet": "Saturn", "sign": "Makara", "house": 10, "life_areas": ["Career"], "is_favorable": False, "tone": "challenging", "summary": "...", "detailed": "...", "retrograde_note": None, "dasha_connection": None},
    ]
    # Moon is dasha lord — even though it's in a less impactful house (3), the 1.8x boost should make it rank high
    result = get_high_impact_summary(interps, {}, dasha_lord="Moon")
    # Moon with dasha lord boost should compete with Saturn
    planets_in_alerts = [a["planet"] for a in result["alerts"]]
    assert "Moon" in planets_in_alerts
