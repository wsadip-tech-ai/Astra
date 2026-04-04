from app.services.vaastu.aayadi import calculate_aayadi


def test_aayadi_returns_required_fields():
    result = calculate_aayadi(length_ft=30.0, breadth_ft=25.0, user_nakshatra="Ashwini")
    assert "aaya" in result
    assert "vyaya" in result
    assert "aaya_greater" in result
    assert "yoni" in result
    assert "footprint_effects" in result
    assert "overall_harmony" in result
    assert "description" in result

def test_aaya_formula():
    result = calculate_aayadi(length_ft=30.0, breadth_ft=25.0, user_nakshatra="Ashwini")
    assert result["aaya"] == (30 * 8) % 12

def test_vyaya_formula():
    result = calculate_aayadi(length_ft=30.0, breadth_ft=25.0, user_nakshatra="Ashwini")
    assert result["vyaya"] == (25 * 9) % 10

def test_aaya_greater_than_vyaya():
    result = calculate_aayadi(length_ft=40.0, breadth_ft=20.0, user_nakshatra="Ashwini")
    assert result["aaya"] == 8
    assert result["vyaya"] == 0
    assert result["aaya_greater"] is True
    assert result["overall_harmony"] == "favorable"

def test_aaya_less_than_vyaya():
    result = calculate_aayadi(length_ft=15.0, breadth_ft=33.0, user_nakshatra="Ashwini")
    assert result["aaya"] == 0
    assert result["vyaya"] == 7
    assert result["aaya_greater"] is False
    assert result["overall_harmony"] == "unfavorable"

def test_yoni_formula():
    result = calculate_aayadi(length_ft=30.0, breadth_ft=25.0, user_nakshatra="Ashwini")
    assert result["yoni"]["value"] == 2
    assert "type" in result["yoni"]
    assert "interpretation" in result["yoni"]

def test_yoni_types():
    result = calculate_aayadi(length_ft=30.0, breadth_ft=25.0, user_nakshatra="Ashwini")
    assert result["yoni"]["type"] in ("Dhwaja", "Dhooma", "Simha", "Shwana", "Vrishabha", "Khara", "Gaja", "Kaaka")

def test_footprint_30ft_lakshmi():
    result = calculate_aayadi(length_ft=30.0, breadth_ft=25.0, user_nakshatra="Ashwini")
    effects = [e["effect"] for e in result["footprint_effects"]]
    assert any("Lakshmi" in e for e in effects)

def test_footprint_34ft_loss():
    result = calculate_aayadi(length_ft=34.0, breadth_ft=25.0, user_nakshatra="Ashwini")
    effects = [e["effect"] for e in result["footprint_effects"]]
    assert any("Loss" in e for e in effects)

def test_description_is_meaningful():
    result = calculate_aayadi(length_ft=30.0, breadth_ft=25.0, user_nakshatra="Ashwini")
    assert isinstance(result["description"], str)
    assert len(result["description"]) > 20
