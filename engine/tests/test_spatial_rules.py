from app.services.vaastu.spatial_rules import check_spatial_rules


def test_returns_required_fields():
    result = check_spatial_rules(entrance_direction="N", floor_level="ground")
    assert "findings" in result
    assert "plant_recommendations" in result
    assert "overall_status" in result

def test_entrance_north_favorable():
    result = check_spatial_rules(entrance_direction="N", floor_level="ground", user_name_initial="A")
    entrance_finding = next(f for f in result["findings"] if f["rule"] == "Main Entrance")
    assert entrance_finding["status"] == "favorable"

def test_entrance_sw_unfavorable():
    result = check_spatial_rules(entrance_direction="SW", floor_level="ground")
    entrance_finding = next(f for f in result["findings"] if f["rule"] == "Main Entrance")
    assert entrance_finding["status"] == "unfavorable"

def test_kitchen_se_favorable():
    result = check_spatial_rules(entrance_direction="N", floor_level="ground", kitchen_zone="SE")
    kitchen_finding = next(f for f in result["findings"] if f["rule"] == "Kitchen Placement")
    assert kitchen_finding["status"] == "favorable"

def test_kitchen_ne_unfavorable():
    result = check_spatial_rules(entrance_direction="N", floor_level="ground", kitchen_zone="NE")
    kitchen_finding = next(f for f in result["findings"] if f["rule"] == "Kitchen Placement")
    assert kitchen_finding["status"] == "unfavorable"

def test_toilet_ne_unfavorable():
    result = check_spatial_rules(entrance_direction="N", floor_level="ground", toilet_zones=["NE"])
    toilet_finding = next(f for f in result["findings"] if f["rule"] == "Toilet Placement")
    assert toilet_finding["status"] == "unfavorable"

def test_brahmasthan_open_favorable():
    result = check_spatial_rules(entrance_direction="N", floor_level="ground", brahmasthan_status="open")
    brahma_finding = next(f for f in result["findings"] if f["rule"] == "Brahmasthan")
    assert brahma_finding["status"] == "favorable"

def test_brahmasthan_walled_unfavorable():
    result = check_spatial_rules(entrance_direction="N", floor_level="ground", brahmasthan_status="walled")
    brahma_finding = next(f for f in result["findings"] if f["rule"] == "Brahmasthan")
    assert brahma_finding["status"] == "unfavorable"

def test_slope_ne_favorable():
    result = check_spatial_rules(entrance_direction="N", floor_level="ground", slope_direction="NE")
    slope_finding = next(f for f in result["findings"] if f["rule"] == "Plot Slope")
    assert slope_finding["status"] == "favorable"

def test_slope_sw_unfavorable():
    result = check_spatial_rules(entrance_direction="N", floor_level="ground", slope_direction="SW")
    slope_finding = next(f for f in result["findings"] if f["rule"] == "Plot Slope")
    assert slope_finding["status"] == "unfavorable"

def test_plant_recommendations_returned():
    result = check_spatial_rules(entrance_direction="N", floor_level="ground")
    assert isinstance(result["plant_recommendations"], list)
    for rec in result["plant_recommendations"]:
        assert "plant" in rec
        assert "zone" in rec
        assert "purpose" in rec

def test_overall_status_values():
    result = check_spatial_rules(entrance_direction="N", floor_level="ground")
    assert result["overall_status"] in ("favorable", "mostly_favorable", "needs_attention", "unfavorable")
