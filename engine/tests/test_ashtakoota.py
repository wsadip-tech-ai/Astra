from app.services.ashtakoota import calculate_ashtakoota


def test_ashtakoota_returns_all_8_kootas():
    result = calculate_ashtakoota(
        user_moon_sign="Mesha", user_nakshatra="Ashwini", user_pada=1,
        partner_moon_sign="Simha", partner_nakshatra="Magha", partner_pada=1,
    )
    assert len(result["kootas"]) == 8
    names = [k["name"] for k in result["kootas"]]
    assert names == ["Varna", "Vashya", "Tara", "Yoni", "Graha Maitri", "Gana", "Bhakoot", "Nadi"]


def test_ashtakoota_max_score_is_36():
    result = calculate_ashtakoota(
        user_moon_sign="Mesha", user_nakshatra="Ashwini", user_pada=1,
        partner_moon_sign="Simha", partner_nakshatra="Magha", partner_pada=1,
    )
    assert result["max_score"] == 36


def test_ashtakoota_score_sums_kootas():
    result = calculate_ashtakoota(
        user_moon_sign="Mesha", user_nakshatra="Ashwini", user_pada=1,
        partner_moon_sign="Dhanu", partner_nakshatra="Mula", partner_pada=2,
    )
    koota_sum = sum(k["score"] for k in result["kootas"])
    assert result["score"] == koota_sum


def test_ashtakoota_kootas_have_required_fields():
    result = calculate_ashtakoota(
        user_moon_sign="Mesha", user_nakshatra="Ashwini", user_pada=1,
        partner_moon_sign="Simha", partner_nakshatra="Magha", partner_pada=1,
    )
    for koota in result["kootas"]:
        assert "name" in koota
        assert "score" in koota
        assert "max_score" in koota
        assert "description" in koota
        assert isinstance(koota["description"], str)
        assert len(koota["description"]) > 10
        assert koota["score"] <= koota["max_score"]


def test_varna_koota_higher_varna_scores_1():
    # Ashwini = Vaishya, Magha = Shudra → user higher → 1
    result = calculate_ashtakoota(
        user_moon_sign="Mesha", user_nakshatra="Ashwini", user_pada=1,
        partner_moon_sign="Simha", partner_nakshatra="Magha", partner_pada=1,
    )
    varna = next(k for k in result["kootas"] if k["name"] == "Varna")
    assert varna["score"] == 1
    assert varna["max_score"] == 1


def test_nadi_same_nadi_scores_0():
    # Ashwini = Aadi (Vata), Ardra = Aadi (Vata) → same → 0
    result = calculate_ashtakoota(
        user_moon_sign="Mesha", user_nakshatra="Ashwini", user_pada=1,
        partner_moon_sign="Mithuna", partner_nakshatra="Ardra", partner_pada=1,
    )
    nadi = next(k for k in result["kootas"] if k["name"] == "Nadi")
    assert nadi["score"] == 0
    assert nadi["max_score"] == 8


def test_nadi_different_nadi_scores_8():
    # Ashwini = Aadi, Bharani = Madhya → different → 8
    result = calculate_ashtakoota(
        user_moon_sign="Mesha", user_nakshatra="Ashwini", user_pada=1,
        partner_moon_sign="Mesha", partner_nakshatra="Bharani", partner_pada=1,
    )
    nadi = next(k for k in result["kootas"] if k["name"] == "Nadi")
    assert nadi["score"] == 8


def test_nadi_exception_same_nakshatra_different_pada():
    result = calculate_ashtakoota(
        user_moon_sign="Mesha", user_nakshatra="Ashwini", user_pada=1,
        partner_moon_sign="Mesha", partner_nakshatra="Ashwini", partner_pada=3,
    )
    nadi = next(k for k in result["kootas"] if k["name"] == "Nadi")
    assert nadi["score"] == 8


def test_gana_same_gana_scores_6():
    # Ashwini = Deva, Mrigashira = Deva → same → 6
    result = calculate_ashtakoota(
        user_moon_sign="Mesha", user_nakshatra="Ashwini", user_pada=1,
        partner_moon_sign="Vrishabha", partner_nakshatra="Mrigashira", partner_pada=1,
    )
    gana = next(k for k in result["kootas"] if k["name"] == "Gana")
    assert gana["score"] == 6


def test_gana_deva_rakshasa_scores_0():
    # Ashwini = Deva, Ashlesha = Rakshasa → 0
    result = calculate_ashtakoota(
        user_moon_sign="Mesha", user_nakshatra="Ashwini", user_pada=1,
        partner_moon_sign="Karka", partner_nakshatra="Ashlesha", partner_pada=1,
    )
    gana = next(k for k in result["kootas"] if k["name"] == "Gana")
    assert gana["score"] == 0


def test_rating_valid():
    result = calculate_ashtakoota(
        user_moon_sign="Mesha", user_nakshatra="Ashwini", user_pada=1,
        partner_moon_sign="Mesha", partner_nakshatra="Bharani", partner_pada=1,
    )
    assert result["rating"] in ("Excellent", "Good", "Average", "Not Recommended")


def test_rating_tiers_by_score():
    result = calculate_ashtakoota(
        user_moon_sign="Mesha", user_nakshatra="Ashwini", user_pada=1,
        partner_moon_sign="Simha", partner_nakshatra="Magha", partner_pada=1,
    )
    score = result["score"]
    rating = result["rating"]
    if score >= 31:
        assert rating == "Excellent"
    elif score >= 25:
        assert rating == "Good"
    elif score >= 18:
        assert rating == "Average"
    else:
        assert rating == "Not Recommended"


def test_mangal_dosha_present():
    result = calculate_ashtakoota(
        user_moon_sign="Mesha", user_nakshatra="Ashwini", user_pada=1,
        partner_moon_sign="Simha", partner_nakshatra="Magha", partner_pada=1,
        user_mars_house=7, partner_mars_house=3,
    )
    assert result["mangal_dosha_user"] is True
    assert result["mangal_dosha_partner"] is False
    assert len(result["doshas"]) >= 1
    dosha = result["doshas"][0]
    assert dosha["type"] == "Mangal Dosha"
    assert dosha["person"] == "user"
    assert dosha["canceled"] is False
    assert "severity" in dosha
    assert "remedy" in dosha


def test_mangal_dosha_mutual_cancellation():
    result = calculate_ashtakoota(
        user_moon_sign="Mesha", user_nakshatra="Ashwini", user_pada=1,
        partner_moon_sign="Simha", partner_nakshatra="Magha", partner_pada=1,
        user_mars_house=7, partner_mars_house=8,
    )
    assert result["mangal_dosha_user"] is True
    assert result["mangal_dosha_partner"] is True
    for dosha in result["doshas"]:
        if dosha["type"] == "Mangal Dosha":
            assert dosha["canceled"] is True


def test_mangal_dosha_absent():
    result = calculate_ashtakoota(
        user_moon_sign="Mesha", user_nakshatra="Ashwini", user_pada=1,
        partner_moon_sign="Simha", partner_nakshatra="Magha", partner_pada=1,
        user_mars_house=3, partner_mars_house=5,
    )
    assert result["mangal_dosha_user"] is False
    assert result["mangal_dosha_partner"] is False
    mangal_doshas = [d for d in result["doshas"] if d["type"] == "Mangal Dosha"]
    assert len(mangal_doshas) == 0


def test_mangal_dosha_none_when_houses_not_provided():
    result = calculate_ashtakoota(
        user_moon_sign="Mesha", user_nakshatra="Ashwini", user_pada=1,
        partner_moon_sign="Simha", partner_nakshatra="Magha", partner_pada=1,
    )
    assert result["mangal_dosha_user"] is False
    assert result["mangal_dosha_partner"] is False


def test_bhakoot_unfavorable_5_9_scores_0():
    # Mesha to Simha = 5th sign → 5/9 pair → 0
    result = calculate_ashtakoota(
        user_moon_sign="Mesha", user_nakshatra="Ashwini", user_pada=1,
        partner_moon_sign="Simha", partner_nakshatra="Magha", partner_pada=1,
    )
    bhakoot = next(k for k in result["kootas"] if k["name"] == "Bhakoot")
    assert bhakoot["score"] == 0
    assert bhakoot["max_score"] == 7


def test_bhakoot_unfavorable_6_8():
    # Mesha to Kanya = 6th → 6/8 pair → 0
    result = calculate_ashtakoota(
        user_moon_sign="Mesha", user_nakshatra="Ashwini", user_pada=1,
        partner_moon_sign="Kanya", partner_nakshatra="Hasta", partner_pada=1,
    )
    bhakoot = next(k for k in result["kootas"] if k["name"] == "Bhakoot")
    assert bhakoot["score"] == 0


def test_bhakoot_neutral_scores_7():
    # Mesha to Mithuna = 3rd → not unfavorable → 7
    result = calculate_ashtakoota(
        user_moon_sign="Mesha", user_nakshatra="Ashwini", user_pada=1,
        partner_moon_sign="Mithuna", partner_nakshatra="Mrigashira", partner_pada=3,
    )
    bhakoot = next(k for k in result["kootas"] if k["name"] == "Bhakoot")
    assert bhakoot["score"] == 7


def test_yoni_same_animal_scores_4():
    # Ashwini = Horse, Shatabhisha = Horse → same → 4
    result = calculate_ashtakoota(
        user_moon_sign="Mesha", user_nakshatra="Ashwini", user_pada=1,
        partner_moon_sign="Kumbha", partner_nakshatra="Shatabhisha", partner_pada=1,
    )
    yoni = next(k for k in result["kootas"] if k["name"] == "Yoni")
    assert yoni["score"] == 4


def test_graha_maitri_same_lord_scores_5():
    # Ashwini lord = Ketu, Magha lord = Ketu → same → 5
    result = calculate_ashtakoota(
        user_moon_sign="Mesha", user_nakshatra="Ashwini", user_pada=1,
        partner_moon_sign="Simha", partner_nakshatra="Magha", partner_pada=1,
    )
    maitri = next(k for k in result["kootas"] if k["name"] == "Graha Maitri")
    assert maitri["score"] == 5


def test_tara_favorable_scores_3():
    # Ashwini(0) to Bharani(1) → count=2 → mod 9=2 → favorable → 3
    result = calculate_ashtakoota(
        user_moon_sign="Mesha", user_nakshatra="Ashwini", user_pada=1,
        partner_moon_sign="Mesha", partner_nakshatra="Bharani", partner_pada=1,
    )
    tara = next(k for k in result["kootas"] if k["name"] == "Tara")
    assert tara["score"] == 3
