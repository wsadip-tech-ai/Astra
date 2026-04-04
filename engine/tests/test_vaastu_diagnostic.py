from app.services.vaastu.diagnostic import run_vaastu_diagnostic


def _make_vedic_chart():
    return {
        "planets": [
            {"name": "Sun", "sign": "Mesha", "degree": 10, "house": 1},
            {"name": "Moon", "sign": "Tula", "degree": 10, "house": 7},
            {"name": "Mars", "sign": "Karka", "degree": 15, "house": 4},
            {"name": "Mercury", "sign": "Mesha", "degree": 25, "house": 1},
            {"name": "Jupiter", "sign": "Simha", "degree": 10, "house": 5},
            {"name": "Venus", "sign": "Mithuna", "degree": 20, "house": 3},
            {"name": "Saturn", "sign": "Makara", "degree": 5, "house": 10},
            {"name": "Rahu", "sign": "Vrishabha", "degree": 15, "house": 2},
            {"name": "Ketu", "sign": "Vrishchika", "degree": 15, "house": 8},
        ],
        "dasha": {
            "current_mahadasha": {"planet": "Moon", "start": "2022-01-01", "end": "2032-01-01"},
            "current_antardasha": {"planet": "Saturn", "start": "2025-06-01", "end": "2027-01-01"},
        },
    }


def test_diagnostic_returns_required_fields():
    result = run_vaastu_diagnostic(
        vedic_chart=_make_vedic_chart(),
        property={"length": 30, "breadth": 25, "entrance_direction": "N", "floor_level": "ground"},
        user_nakshatra="Ashwini",
    )
    assert "summary" in result
    assert "aayadi" in result
    assert "hits" in result
    assert "zone_map" in result
    assert "spatial_findings" in result
    assert "remedies" in result
    assert "disclaimer" in result


def test_diagnostic_zone_map_has_16_zones():
    result = run_vaastu_diagnostic(
        vedic_chart=_make_vedic_chart(),
        property={"length": 30, "breadth": 25, "entrance_direction": "N", "floor_level": "ground"},
        user_nakshatra="Ashwini",
    )
    assert len(result["zone_map"]) == 16


def test_diagnostic_zone_map_has_status():
    result = run_vaastu_diagnostic(
        vedic_chart=_make_vedic_chart(),
        property={"length": 30, "breadth": 25, "entrance_direction": "N", "floor_level": "ground"},
        user_nakshatra="Ashwini",
    )
    for zone in result["zone_map"]:
        assert "zone" in zone
        assert "status" in zone
        assert zone["status"] in ("clear", "afflicted", "warning", "positive")


def test_diagnostic_has_hits():
    result = run_vaastu_diagnostic(
        vedic_chart=_make_vedic_chart(),
        property={"length": 30, "breadth": 25, "entrance_direction": "N", "floor_level": "ground"},
        user_nakshatra="Ashwini",
    )
    # Sun at 10° and Moon at 190° → 180° killer hit
    assert len(result["hits"]["primary_hits"]) > 0


def test_diagnostic_has_aayadi():
    result = run_vaastu_diagnostic(
        vedic_chart=_make_vedic_chart(),
        property={"length": 30, "breadth": 25, "entrance_direction": "N", "floor_level": "ground"},
        user_nakshatra="Ashwini",
    )
    assert "aaya" in result["aayadi"]
    assert "vyaya" in result["aayadi"]


def test_diagnostic_remedies_for_afflicted_zones():
    result = run_vaastu_diagnostic(
        vedic_chart=_make_vedic_chart(),
        property={"length": 30, "breadth": 25, "entrance_direction": "N", "floor_level": "ground"},
        user_nakshatra="Ashwini",
    )
    if any(z["status"] == "afflicted" for z in result["zone_map"]):
        assert len(result["remedies"]) > 0
        for remedy in result["remedies"]:
            assert "zone" in remedy
            assert "remedy" in remedy
            assert "reason" in remedy


def test_diagnostic_with_room_details():
    result = run_vaastu_diagnostic(
        vedic_chart=_make_vedic_chart(),
        property={"length": 30, "breadth": 25, "entrance_direction": "N", "floor_level": "ground"},
        room_details={"kitchen_zone": "SE", "brahmasthan_status": "open"},
        user_nakshatra="Ashwini",
    )
    assert len(result["spatial_findings"]) > 0


def test_diagnostic_without_room_details():
    result = run_vaastu_diagnostic(
        vedic_chart=_make_vedic_chart(),
        property={"length": 30, "breadth": 25, "entrance_direction": "N", "floor_level": "ground"},
        user_nakshatra="Ashwini",
    )
    assert isinstance(result["spatial_findings"], list)


def test_diagnostic_disclaimer_present():
    result = run_vaastu_diagnostic(
        vedic_chart=_make_vedic_chart(),
        property={"length": 30, "breadth": 25, "entrance_direction": "N", "floor_level": "ground"},
        user_nakshatra="Ashwini",
    )
    assert "traditional" in result["disclaimer"].lower() or "not a substitute" in result["disclaimer"].lower()
