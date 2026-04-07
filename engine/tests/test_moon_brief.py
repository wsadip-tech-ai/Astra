from app.services.moon_brief import get_moon_brief, MOON_SIGN_BRIEFS, DAY_REMEDIES


def test_moon_brief_returns_all_fields():
    result = get_moon_brief("Karka", "Pushya", "Monday")
    assert "mood" in result
    assert "best_for" in result
    assert "avoid" in result
    assert "daily_mantra" in result
    assert "daily_remedy" in result
    assert result["moon_sign"] == "Karka"


def test_all_signs_have_briefs():
    signs = ["Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
             "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena"]
    for sign in signs:
        brief = MOON_SIGN_BRIEFS[sign]
        assert "mood" in brief
        assert "best_for" in brief
        assert "avoid" in brief
        assert "mantra" in brief


def test_all_days_have_remedies():
    for day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]:
        assert day in DAY_REMEDIES
        assert "planet" in DAY_REMEDIES[day]
        assert "remedy" in DAY_REMEDIES[day]
        assert "mantra" in DAY_REMEDIES[day]


def test_moon_brief_different_signs():
    karka = get_moon_brief("Karka", "Pushya", "Monday")
    mesha = get_moon_brief("Mesha", "Ashwini", "Monday")
    assert karka["mood"] != mesha["mood"]


def test_moon_brief_fallback_unknown_sign():
    result = get_moon_brief("Unknown", "Unknown", "Monday")
    assert result["mood"] == "Bold and impulsive"  # Falls back to Mesha


def test_moon_brief_fallback_unknown_day():
    result = get_moon_brief("Karka", "Pushya", "Funday")
    assert result["daily_remedy"]["planet"] == "Moon"  # Falls back to Monday
