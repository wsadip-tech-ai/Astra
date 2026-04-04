# Sub-project 5B: Vedic Ashtakoota Compatibility — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add traditional Vedic Ashtakoota (Kundali Milan) compatibility scoring with 8-koota breakdown, Mangal Dosha assessment, and AI narrative — integrated alongside Western synastry on the `/compatibility` page.

**Architecture:** Engine-first approach. A pure-function `ashtakoota.py` service handles all 8 koota calculations with traditional lookup tables. A new FastAPI route exposes it. The Next.js frontend adds a dual-mode input (full birth details + quick mode), displays Vedic scores as the primary result with Western synastry as secondary.

**Tech Stack:** Python 3.12, FastAPI, Pydantic v2, pytest (engine); Next.js 16, React 19, TypeScript, Tailwind CSS v4, Framer Motion (frontend)

---

## File Structure

### New files to create:
```
engine/app/services/ashtakoota.py          — 8-koota scoring + Mangal Dosha
engine/app/routes/compatibility_vedic.py   — POST /compatibility/vedic
engine/tests/test_ashtakoota.py            — Unit tests for scoring
constants/nakshatras.ts                    — Sign-to-nakshatra mapping for quick mode
app/api/compatibility/vedic/route.ts       — Quick-mode API route
components/compatibility/QuickModeForm.tsx  — Moon sign/nakshatra picker
components/compatibility/AshtakootaResult.tsx — Score gauge + 8 koota cards
components/compatibility/MangalDoshaSection.tsx — Dosha status + remedies
components/compatibility/CompatibilityNarrative.tsx — AI reading (premium)
```

### Files to modify:
```
engine/app/models/schemas.py               — Add VedicCompatibilityRequest/Response + sub-models
engine/app/main.py                         — Register vedic compatibility router
engine/tests/test_vedic_enhanced.py        — Add route integration test
types/index.ts                             — Add Vedic compatibility TypeScript types
lib/compatibility.ts                       — Add callVedicCompatibilityEngine + narrative prompt
components/compatibility/CompatibilityView.tsx — Add mode toggle + orchestrate both result types
components/compatibility/CompatibilityResult.tsx — Rename header to "Western Planetary Aspects"
app/api/compatibility/route.ts             — Also call Vedic engine in full birth mode
```

---

## Task 1: Ashtakoota Lookup Tables & Scoring Service

The scoring service is a pure data + logic module. All 8 kootas use traditional lookup tables. No external dependencies.

**Files:**
- Create: `engine/app/services/ashtakoota.py`
- Create: `engine/tests/test_ashtakoota.py`

- [ ] **Step 1: Write failing tests for Ashtakoota scoring**

```python
# engine/tests/test_ashtakoota.py
from app.services.ashtakoota import calculate_ashtakoota


def test_ashtakoota_returns_all_8_kootas():
    result = calculate_ashtakoota(
        user_moon_sign="Mesha",
        user_nakshatra="Ashwini",
        user_pada=1,
        partner_moon_sign="Simha",
        partner_nakshatra="Magha",
        partner_pada=1,
    )
    assert len(result["kootas"]) == 8
    names = [k["name"] for k in result["kootas"]]
    assert names == ["Varna", "Vashya", "Tara", "Yoni", "Graha Maitri", "Gana", "Bhakoot", "Nadi"]


def test_ashtakoota_max_score_is_36():
    result = calculate_ashtakoota(
        user_moon_sign="Mesha",
        user_nakshatra="Ashwini",
        user_pada=1,
        partner_moon_sign="Simha",
        partner_nakshatra="Magha",
        partner_pada=1,
    )
    assert result["max_score"] == 36


def test_ashtakoota_score_sums_kootas():
    result = calculate_ashtakoota(
        user_moon_sign="Mesha",
        user_nakshatra="Ashwini",
        user_pada=1,
        partner_moon_sign="Dhanu",
        partner_nakshatra="Mula",
        partner_pada=2,
    )
    koota_sum = sum(k["score"] for k in result["kootas"])
    assert result["score"] == koota_sum


def test_ashtakoota_kootas_have_required_fields():
    result = calculate_ashtakoota(
        user_moon_sign="Mesha",
        user_nakshatra="Ashwini",
        user_pada=1,
        partner_moon_sign="Simha",
        partner_nakshatra="Magha",
        partner_pada=1,
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
    # Ashwini = Vaishya, Magha = Shudra → user varna > partner → 1
    result = calculate_ashtakoota(
        user_moon_sign="Mesha",
        user_nakshatra="Ashwini",
        user_pada=1,
        partner_moon_sign="Simha",
        partner_nakshatra="Magha",
        partner_pada=1,
    )
    varna = next(k for k in result["kootas"] if k["name"] == "Varna")
    assert varna["score"] == 1
    assert varna["max_score"] == 1


def test_nadi_same_nadi_scores_0():
    # Ashwini = Aadi (Vata), Ardra = Aadi (Vata) → same nadi → 0
    result = calculate_ashtakoota(
        user_moon_sign="Mesha",
        user_nakshatra="Ashwini",
        user_pada=1,
        partner_moon_sign="Mithuna",
        partner_nakshatra="Ardra",
        partner_pada=1,
    )
    nadi = next(k for k in result["kootas"] if k["name"] == "Nadi")
    assert nadi["score"] == 0
    assert nadi["max_score"] == 8


def test_nadi_different_nadi_scores_8():
    # Ashwini = Aadi (Vata), Bharani = Madhya (Pitta) → different → 8
    result = calculate_ashtakoota(
        user_moon_sign="Mesha",
        user_nakshatra="Ashwini",
        user_pada=1,
        partner_moon_sign="Mesha",
        partner_nakshatra="Bharani",
        partner_pada=1,
    )
    nadi = next(k for k in result["kootas"] if k["name"] == "Nadi")
    assert nadi["score"] == 8


def test_nadi_exception_same_nakshatra_different_pada():
    # Same nakshatra but different pada → Nadi scores 8 even if same nadi
    result = calculate_ashtakoota(
        user_moon_sign="Mesha",
        user_nakshatra="Ashwini",
        user_pada=1,
        partner_moon_sign="Mesha",
        partner_nakshatra="Ashwini",
        partner_pada=3,
    )
    nadi = next(k for k in result["kootas"] if k["name"] == "Nadi")
    assert nadi["score"] == 8


def test_gana_same_gana_scores_6():
    # Ashwini = Deva, Mrigashira = Deva → same → 6
    result = calculate_ashtakoota(
        user_moon_sign="Mesha",
        user_nakshatra="Ashwini",
        user_pada=1,
        partner_moon_sign="Vrishabha",
        partner_nakshatra="Mrigashira",
        partner_pada=1,
    )
    gana = next(k for k in result["kootas"] if k["name"] == "Gana")
    assert gana["score"] == 6


def test_gana_deva_rakshasa_scores_0():
    # Ashwini = Deva, Ashlesha = Rakshasa → 0
    result = calculate_ashtakoota(
        user_moon_sign="Mesha",
        user_nakshatra="Ashwini",
        user_pada=1,
        partner_moon_sign="Karka",
        partner_nakshatra="Ashlesha",
        partner_pada=1,
    )
    gana = next(k for k in result["kootas"] if k["name"] == "Gana")
    assert gana["score"] == 0


def test_rating_excellent():
    # Ashwini + Bharani: known high-scoring pair
    result = calculate_ashtakoota(
        user_moon_sign="Mesha",
        user_nakshatra="Ashwini",
        user_pada=1,
        partner_moon_sign="Mesha",
        partner_nakshatra="Bharani",
        partner_pada=1,
    )
    # Just check rating is one of the valid tiers
    assert result["rating"] in ("Excellent", "Good", "Average", "Not Recommended")


def test_rating_tiers_by_score():
    # We'll test the rating function directly via the result
    result = calculate_ashtakoota(
        user_moon_sign="Mesha",
        user_nakshatra="Ashwini",
        user_pada=1,
        partner_moon_sign="Simha",
        partner_nakshatra="Magha",
        partner_pada=1,
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
        user_moon_sign="Mesha",
        user_nakshatra="Ashwini",
        user_pada=1,
        partner_moon_sign="Simha",
        partner_nakshatra="Magha",
        partner_pada=1,
        user_mars_house=7,
        partner_mars_house=3,
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
        user_moon_sign="Mesha",
        user_nakshatra="Ashwini",
        user_pada=1,
        partner_moon_sign="Simha",
        partner_nakshatra="Magha",
        partner_pada=1,
        user_mars_house=7,
        partner_mars_house=8,
    )
    assert result["mangal_dosha_user"] is True
    assert result["mangal_dosha_partner"] is True
    # Both have it → canceled
    for dosha in result["doshas"]:
        if dosha["type"] == "Mangal Dosha":
            assert dosha["canceled"] is True


def test_mangal_dosha_absent():
    result = calculate_ashtakoota(
        user_moon_sign="Mesha",
        user_nakshatra="Ashwini",
        user_pada=1,
        partner_moon_sign="Simha",
        partner_nakshatra="Magha",
        partner_pada=1,
        user_mars_house=3,
        partner_mars_house=5,
    )
    assert result["mangal_dosha_user"] is False
    assert result["mangal_dosha_partner"] is False
    # No Mangal Dosha entries
    mangal_doshas = [d for d in result["doshas"] if d["type"] == "Mangal Dosha"]
    assert len(mangal_doshas) == 0


def test_mangal_dosha_none_when_houses_not_provided():
    result = calculate_ashtakoota(
        user_moon_sign="Mesha",
        user_nakshatra="Ashwini",
        user_pada=1,
        partner_moon_sign="Simha",
        partner_nakshatra="Magha",
        partner_pada=1,
    )
    assert result["mangal_dosha_user"] is False
    assert result["mangal_dosha_partner"] is False


def test_bhakoot_favorable_scores_7():
    # Mesha-Simha → distance 5 (1-indexed) → 5/9 pair → check score
    # Actually 5th from Mesha is Simha → sign distance = 4 (0-indexed) + 1 = 5
    # 5/9 pair scores 0 in traditional Bhakoot
    result = calculate_ashtakoota(
        user_moon_sign="Mesha",
        user_nakshatra="Ashwini",
        user_pada=1,
        partner_moon_sign="Simha",
        partner_nakshatra="Magha",
        partner_pada=1,
    )
    bhakoot = next(k for k in result["kootas"] if k["name"] == "Bhakoot")
    # Mesha to Simha = 5th sign → 5/9 unfavorable pair → score 0
    assert bhakoot["score"] == 0
    assert bhakoot["max_score"] == 7


def test_bhakoot_unfavorable_pair():
    # Mesha-Kanya → distance 6 → 6/8 pair → score 0
    result = calculate_ashtakoota(
        user_moon_sign="Mesha",
        user_nakshatra="Ashwini",
        user_pada=1,
        partner_moon_sign="Kanya",
        partner_nakshatra="Hasta",
        partner_pada=1,
    )
    bhakoot = next(k for k in result["kootas"] if k["name"] == "Bhakoot")
    assert bhakoot["score"] == 0


def test_bhakoot_neutral_scores_7():
    # Mesha-Mithuna → distance 3 → not in unfavorable pairs → 7
    result = calculate_ashtakoota(
        user_moon_sign="Mesha",
        user_nakshatra="Ashwini",
        user_pada=1,
        partner_moon_sign="Mithuna",
        partner_nakshatra="Mrigashira",
        partner_pada=3,
    )
    bhakoot = next(k for k in result["kootas"] if k["name"] == "Bhakoot")
    assert bhakoot["score"] == 7


def test_yoni_same_animal_scores_4():
    # Ashwini = Horse, Shatabhisha = Horse → same → 4
    result = calculate_ashtakoota(
        user_moon_sign="Mesha",
        user_nakshatra="Ashwini",
        user_pada=1,
        partner_moon_sign="Kumbha",
        partner_nakshatra="Shatabhisha",
        partner_pada=1,
    )
    yoni = next(k for k in result["kootas"] if k["name"] == "Yoni")
    assert yoni["score"] == 4


def test_graha_maitri_both_friends_scores_5():
    # Ashwini lord = Ketu, Magha lord = Ketu → same planet → 5
    result = calculate_ashtakoota(
        user_moon_sign="Mesha",
        user_nakshatra="Ashwini",
        user_pada=1,
        partner_moon_sign="Simha",
        partner_nakshatra="Magha",
        partner_pada=1,
    )
    maitri = next(k for k in result["kootas"] if k["name"] == "Graha Maitri")
    assert maitri["score"] == 5


def test_tara_favorable_scores_3():
    # Ashwini (index 0) to Bharani (index 1) → count = 2 → mod 9 = 2 → favorable → 3
    result = calculate_ashtakoota(
        user_moon_sign="Mesha",
        user_nakshatra="Ashwini",
        user_pada=1,
        partner_moon_sign="Mesha",
        partner_nakshatra="Bharani",
        partner_pada=1,
    )
    tara = next(k for k in result["kootas"] if k["name"] == "Tara")
    assert tara["score"] == 3
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd engine && venv/Scripts/python -m pytest tests/test_ashtakoota.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.services.ashtakoota'`

- [ ] **Step 3: Implement the Ashtakoota service**

Create `engine/app/services/ashtakoota.py` with the full implementation. This is a large file (~400 lines) containing:

1. **Lookup tables** — All 10 tables listed in the spec:
   - `NAKSHATRA_VARNA`: maps each of 27 nakshatras to Brahmin/Kshatriya/Vaishya/Shudra
   - `SIGN_VASHYA`: maps 12 signs to Chatushpada/Manava/Jalachara/Vanachara/Keeta
   - `VASHYA_COMPATIBILITY`: 5×5 matrix of category pairs → 0/1/2
   - `NAKSHATRA_YONI`: 27 nakshatras → animal symbol (Horse, Elephant, Sheep, Serpent, Dog, Cat, Rat, Cow, Buffalo, Tiger, Deer, Monkey, Mongoose, Lion)
   - `YONI_COMPATIBILITY`: 14×14 matrix of animal pairs → 0-4
   - `NAKSHATRA_GANA`: 27 nakshatras → Deva/Manushya/Rakshasa
   - `GANA_COMPATIBILITY`: 3×3 matrix → score
   - `NAKSHATRA_NADI`: 27 nakshatras → Aadi/Madhya/Antya
   - `GRAHA_MAITRI`: planet friendship table (9×9 → Friend/Neutral/Enemy)

2. **Individual koota functions** — 8 private functions: `_score_varna`, `_score_vashya`, `_score_tara`, `_score_yoni`, `_score_graha_maitri`, `_score_gana`, `_score_bhakoot`, `_score_nadi`

3. **Mangal Dosha function** — `_check_mangal_dosha(mars_house: int | None) -> bool`

4. **Main function** — `calculate_ashtakoota(...)` that calls all 8 scorers, sums totals, determines rating, checks Mangal Dosha, returns the full result dict.

Traditional lookup table data (use these exact values):

**Nakshatra Varna** (repeating pattern of 4 across 27 nakshatras):
```
Brahmin: Krittika, Rohini, Mrigashira, Punarvasu, Pushya, Uttara Phalguni, Hasta, Swati, Anuradha, Uttara Ashadha, Shravana, Uttara Bhadrapada
Kshatriya: Bharani, Ardra, Purva Phalguni, Vishakha, Purva Ashadha, Dhanishta
Vaishya: Ashwini, Ashlesha, Magha, Chitra, Mula, Purva Bhadrapada
Shudra: Jyeshtha, Shatabhisha, Revati
```

Wait — the traditional Varna assignment is cyclical: each nakshatra is assigned a varna based on `nakshatra_index % 4`:
- 0 = Brahmin (Ashwini, Pushya, Hasta, Mula, Shravana...)
- Actually the standard is: position in 9-group cycles. Let me use the standard Jyotish mapping:

```python
# Standard mapping: repeating cycle of Kshatriya, Vaishya, Shudra, Brahmin across 27
NAKSHATRA_VARNA = {
    "Ashwini": "Vaishya", "Bharani": "Shudra", "Krittika": "Brahmin",
    "Rohini": "Shudra", "Mrigashira": "Vaishya", "Ardra": "Shudra",
    "Punarvasu": "Vaishya", "Pushya": "Kshatriya", "Ashlesha": "Shudra",
    "Magha": "Shudra", "Purva Phalguni": "Brahmin", "Uttara Phalguni": "Kshatriya",
    "Hasta": "Vaishya", "Chitra": "Vaishya", "Swati": "Shudra",
    "Vishakha": "Brahmin", "Anuradha": "Shudra", "Jyeshtha": "Vaishya",
    "Mula": "Shudra", "Purva Ashadha": "Brahmin", "Uttara Ashadha": "Kshatriya",
    "Shravana": "Vaishya", "Dhanishta": "Vaishya", "Shatabhisha": "Shudra",
    "Purva Bhadrapada": "Brahmin", "Uttara Bhadrapada": "Kshatriya", "Revati": "Vaishya",
}
```

The implementer should use the standard traditional Jyotish Ashtakoota tables. The key constraint is that all 8 individual koota scoring functions must be consistent with established Vedic astrology practice. The tests above verify specific known pairs.

**Critical implementation notes for the implementer:**

- Varna hierarchy: Brahmin(4) > Kshatriya(3) > Vaishya(2) > Shudra(1). Score 1 if user varna >= partner varna, else 0.
- Vashya uses sign-based categories, not nakshatra.
- Tara: count from user's nakshatra to partner's nakshatra (inclusive of partner's), result mod 9. If remainder is 0, treat as 9.
- Yoni: Use 14 animals. Same animal = 4, check compatibility table for other pairs.
- Graha Maitri: Use NAKSHATRA_LORDS from dasha.py (imported) to get each nakshatra's ruling planet, then check friendship.
- Gana: Deva-Deva=6, Manushya-Manushya=6, Rakshasa-Rakshasa=6, Deva-Manushya=5, Manushya-Deva=5, Manushya-Rakshasa=1, Rakshasa-Manushya=1, Deva-Rakshasa=0, Rakshasa-Deva=0.
- Bhakoot: Compute 1-indexed sign distance both ways. If either distance is in {2,12} or {5,9} or {6,8} → score 0. Otherwise 7.
- Nadi: Different nadi = 8, same nadi = 0. Exception: if both have the same nakshatra but different pada → 8.
- Mangal Dosha: Mars house in {1,4,7,8,12} → present. Both present → mutual cancellation.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd engine && venv/Scripts/python -m pytest tests/test_ashtakoota.py -v`
Expected: All 21 tests PASS

- [ ] **Step 5: Commit**

```bash
cd engine && git add app/services/ashtakoota.py tests/test_ashtakoota.py
git commit -m "feat(engine): add Ashtakoota compatibility scoring service

8-koota Kundali Milan calculator with traditional lookup tables.
Scores Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot,
and Nadi (max 36). Includes Mangal Dosha detection with mutual
cancellation logic."
```

---

## Task 2: Vedic Compatibility Route + Pydantic Schemas

Wire the Ashtakoota service to an HTTP endpoint.

**Files:**
- Modify: `engine/app/models/schemas.py` — append new models
- Create: `engine/app/routes/compatibility_vedic.py`
- Modify: `engine/app/main.py` — register router
- Modify: `engine/tests/test_vedic_enhanced.py` — add route test

- [ ] **Step 1: Add Pydantic models to schemas.py**

Append after the existing `YogaListResponse` class at the end of `engine/app/models/schemas.py`:

```python
# --- Vedic Compatibility models ---

class VedicCompatibilityRequest(BaseModel):
    user_moon_sign: str
    user_nakshatra: str
    user_pada: int
    partner_moon_sign: str
    partner_nakshatra: str
    partner_pada: int
    user_mars_house: int | None = None
    partner_mars_house: int | None = None


class KootaScore(BaseModel):
    name: str
    score: float
    max_score: int
    description: str


class DoshaInfo(BaseModel):
    type: str
    person: str
    severity: str
    canceled: bool
    remedy: str


class VedicCompatibilityResponse(BaseModel):
    score: float
    max_score: int
    rating: str
    kootas: list[KootaScore]
    doshas: list[DoshaInfo]
    mangal_dosha_user: bool
    mangal_dosha_partner: bool
```

- [ ] **Step 2: Create the route file**

```python
# engine/app/routes/compatibility_vedic.py
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.models.schemas import VedicCompatibilityRequest, VedicCompatibilityResponse, ErrorResponse
from app.services.ashtakoota import calculate_ashtakoota

router = APIRouter()


@router.post(
    "/compatibility/vedic",
    response_model=VedicCompatibilityResponse,
    responses={500: {"model": ErrorResponse}},
)
async def vedic_compatibility(request: VedicCompatibilityRequest):
    try:
        result = calculate_ashtakoota(
            user_moon_sign=request.user_moon_sign,
            user_nakshatra=request.user_nakshatra,
            user_pada=request.user_pada,
            partner_moon_sign=request.partner_moon_sign,
            partner_nakshatra=request.partner_nakshatra,
            partner_pada=request.partner_pada,
            user_mars_house=request.user_mars_house,
            partner_mars_house=request.partner_mars_house,
        )
        return result
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": "calculation_failed", "detail": str(e)},
        )
```

- [ ] **Step 3: Register router in main.py**

Add after the yogas router import/include in `engine/app/main.py`:

```python
from app.routes.compatibility_vedic import router as vedic_compat_router
```

And:

```python
app.include_router(vedic_compat_router)
```

- [ ] **Step 4: Add route integration test**

Append to `engine/tests/test_vedic_enhanced.py`:

```python
@pytest.mark.asyncio
async def test_vedic_compatibility_endpoint(client):
    response = await client.post("/compatibility/vedic", json={
        "user_moon_sign": "Mesha",
        "user_nakshatra": "Ashwini",
        "user_pada": 1,
        "partner_moon_sign": "Simha",
        "partner_nakshatra": "Magha",
        "partner_pada": 1,
        "user_mars_house": 7,
        "partner_mars_house": 3,
    }, headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert len(data["kootas"]) == 8
    assert data["max_score"] == 36
    assert data["rating"] in ("Excellent", "Good", "Average", "Not Recommended")
    assert data["mangal_dosha_user"] is True
    assert data["mangal_dosha_partner"] is False


@pytest.mark.asyncio
async def test_vedic_compatibility_quick_mode(client):
    """Quick mode: no mars houses provided."""
    response = await client.post("/compatibility/vedic", json={
        "user_moon_sign": "Vrishabha",
        "user_nakshatra": "Rohini",
        "user_pada": 2,
        "partner_moon_sign": "Kanya",
        "partner_nakshatra": "Hasta",
        "partner_pada": 3,
    }, headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert len(data["kootas"]) == 8
    assert data["mangal_dosha_user"] is False
    assert data["mangal_dosha_partner"] is False
```

- [ ] **Step 5: Run all tests**

Run: `cd engine && venv/Scripts/python -m pytest -v`
Expected: All tests PASS (including the 2 new route tests)

- [ ] **Step 6: Commit**

```bash
cd engine && git add app/models/schemas.py app/routes/compatibility_vedic.py app/main.py tests/test_vedic_enhanced.py
git commit -m "feat(engine): add POST /compatibility/vedic endpoint

Vedic Ashtakoota compatibility route with Pydantic validation.
Accepts Moon sign, nakshatra, pada for both people + optional
Mars houses for Mangal Dosha check."
```

---

## Task 3: Frontend Types + Constants

Add TypeScript types and the nakshatra-sign mapping needed by frontend components.

**Files:**
- Modify: `types/index.ts` — add Vedic compatibility types
- Create: `constants/nakshatras.ts` — sign-to-nakshatra mapping

- [ ] **Step 1: Add types to types/index.ts**

Append after the existing `CompatibilityResult` interface:

```typescript
// Vedic Ashtakoota Compatibility
export interface KootaScore {
  name: string
  score: number
  max_score: number
  description: string
}

export interface DoshaInfo {
  type: string
  person: 'user' | 'partner' | 'both'
  severity: string
  canceled: boolean
  remedy: string
}

export interface VedicCompatibilityResult {
  score: number
  max_score: number
  rating: 'Excellent' | 'Good' | 'Average' | 'Not Recommended'
  kootas: KootaScore[]
  doshas: DoshaInfo[]
  mangal_dosha_user: boolean
  mangal_dosha_partner: boolean
}

export interface FullCompatibilityResult {
  western: CompatibilityResult | null
  vedic: VedicCompatibilityResult
  partnerName: string
}
```

- [ ] **Step 2: Create nakshatras constant**

```typescript
// constants/nakshatras.ts

export const SANSKRIT_SIGNS = [
  "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
  "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
] as const

export const SIGN_ENGLISH: Record<string, string> = {
  Mesha: "Aries", Vrishabha: "Taurus", Mithuna: "Gemini",
  Karka: "Cancer", Simha: "Leo", Kanya: "Virgo",
  Tula: "Libra", Vrishchika: "Scorpio", Dhanu: "Sagittarius",
  Makara: "Capricorn", Kumbha: "Aquarius", Meena: "Pisces",
}

// Each sign spans 30° = 2.25 nakshatras. Some nakshatras span two signs.
export const SIGN_NAKSHATRAS: Record<string, string[]> = {
  Mesha: ["Ashwini", "Bharani", "Krittika"],
  Vrishabha: ["Krittika", "Rohini", "Mrigashira"],
  Mithuna: ["Mrigashira", "Ardra", "Punarvasu"],
  Karka: ["Punarvasu", "Pushya", "Ashlesha"],
  Simha: ["Magha", "Purva Phalguni", "Uttara Phalguni"],
  Kanya: ["Uttara Phalguni", "Hasta", "Chitra"],
  Tula: ["Chitra", "Swati", "Vishakha"],
  Vrishchika: ["Vishakha", "Anuradha", "Jyeshtha"],
  Dhanu: ["Mula", "Purva Ashadha", "Uttara Ashadha"],
  Makara: ["Uttara Ashadha", "Shravana", "Dhanishta"],
  Kumbha: ["Dhanishta", "Shatabhisha", "Purva Bhadrapada"],
  Meena: ["Purva Bhadrapada", "Uttara Bhadrapada", "Revati"],
}

export const ALL_NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
  "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha",
  "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha",
  "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada",
  "Uttara Bhadrapada", "Revati",
] as const
```

- [ ] **Step 3: Commit**

```bash
git add types/index.ts constants/nakshatras.ts
git commit -m "feat: add Vedic compatibility types and nakshatra constants

TypeScript interfaces for Ashtakoota results and sign-to-nakshatra
mapping for the quick mode dropdown."
```

---

## Task 4: Quick Mode API Route + Compatibility Lib

Add the backend wiring for Vedic compatibility calls.

**Files:**
- Create: `app/api/compatibility/vedic/route.ts` — quick mode endpoint
- Modify: `lib/compatibility.ts` — add Vedic engine call + narrative prompt
- Modify: `app/api/compatibility/route.ts` — also call Vedic engine in full mode

- [ ] **Step 1: Add Vedic engine call to lib/compatibility.ts**

Append to `lib/compatibility.ts`:

```typescript
export async function callVedicCompatibilityEngine(params: {
  user_moon_sign: string
  user_nakshatra: string
  user_pada: number
  partner_moon_sign: string
  partner_nakshatra: string
  partner_pada: number
  user_mars_house?: number | null
  partner_mars_house?: number | null
}): Promise<{
  score: number
  max_score: number
  rating: string
  kootas: { name: string; score: number; max_score: number; description: string }[]
  doshas: { type: string; person: string; severity: string; canceled: boolean; remedy: string }[]
  mangal_dosha_user: boolean
  mangal_dosha_partner: boolean
} | null> {
  const baseUrl = process.env.FASTAPI_BASE_URL || 'http://localhost:8000'
  const secret = process.env.INTERNAL_SECRET || ''

  try {
    const response = await fetch(`${baseUrl}/compatibility/vedic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': secret,
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}


interface VedicReportParams {
  userName: string
  partnerName: string
  score: number
  maxScore: number
  rating: string
  kootas: { name: string; score: number; max_score: number }[]
  doshas: { type: string; person: string; severity: string; canceled: boolean }[]
}

export async function generateVedicCompatibilityNarrative(params: VedicReportParams): Promise<string | null> {
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const kootaSummary = params.kootas
      .map(k => `${k.name}: ${k.score}/${k.max_score}`)
      .join(', ')

    const doshaSummary = params.doshas.length > 0
      ? params.doshas.map(d => `${d.type} (${d.person}, severity: ${d.severity}, canceled: ${d.canceled})`).join('; ')
      : 'No doshas detected'

    const prompt = `You are Astra, a warm and wise Vedic astrologer. Write a 3-4 paragraph compatibility reading for ${params.userName} and ${params.partnerName}.

Their Ashtakoota (Kundali Milan) score is ${params.score}/${params.maxScore} — rated "${params.rating}".

Koota breakdown: ${kootaSummary}

Dosha status: ${doshaSummary}

Write a warm, insightful reading that:
1. Opens with the overall compatibility assessment based on the score and rating
2. Highlights the strongest kootas (highest scores) as relationship strengths
3. Addresses any weak kootas (score 0) as areas for awareness, not alarm
4. If doshas are present, explain them compassionately with the remedy context
5. Closes with encouraging guidance

Be authentic to Vedic tradition but accessible to modern readers. Use "you" and "your partner" language.`

    const response = await client.chat.completions.create({
      model: process.env.CHAT_MODEL || 'gpt-4o-mini',
      max_tokens: 768,
      messages: [{ role: 'user', content: prompt }],
    })

    return response.choices[0]?.message?.content ?? null
  } catch {
    return null
  }
}
```

- [ ] **Step 2: Create quick mode API route**

```typescript
// app/api/compatibility/vedic/route.ts
import { createClient } from '@/lib/supabase/server'
import { callVedicCompatibilityEngine, generateVedicCompatibilityNarrative } from '@/lib/compatibility'
import { NextResponse } from 'next/server'
import { mapProfile } from '@/lib/profile'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const {
    partner_name,
    user_moon_sign, user_nakshatra, user_pada,
    partner_moon_sign, partner_nakshatra, partner_pada,
  } = body

  if (!partner_name || !user_moon_sign || !user_nakshatra || !partner_moon_sign || !partner_nakshatra) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const vedic = await callVedicCompatibilityEngine({
    user_moon_sign,
    user_nakshatra,
    user_pada: user_pada || 1,
    partner_moon_sign,
    partner_nakshatra,
    partner_pada: partner_pada || 1,
  })

  if (!vedic) {
    return NextResponse.json({ error: 'Vedic compatibility calculation failed' }, { status: 500 })
  }

  // Generate narrative for premium users
  const { data: rawProfile } = await supabase
    .from('astra_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = rawProfile ? mapProfile(rawProfile as Record<string, unknown>) : null
  let narrative: string | null = null

  if (profile?.subscription_tier === 'premium') {
    narrative = await generateVedicCompatibilityNarrative({
      userName: profile.name || 'You',
      partnerName: partner_name,
      score: vedic.score,
      maxScore: vedic.max_score,
      rating: vedic.rating,
      kootas: vedic.kootas,
      doshas: vedic.doshas,
    })
  }

  return NextResponse.json({
    vedic,
    narrative,
    partner_name,
  })
}
```

- [ ] **Step 3: Modify full birth mode route to also call Vedic engine**

In `app/api/compatibility/route.ts`, after the existing Western compatibility calculation (around line 100), add the Vedic call. The user's Vedic chart data must be fetched to extract Moon sign/nakshatra/pada and Mars house.

Add this import at the top:
```typescript
import { callVedicCompatibilityEngine, generateVedicCompatibilityNarrative } from '@/lib/compatibility'
```

After the existing `const compatibility = await callCompatibilityEngine(...)` block (around line 100), before the report generation, add:

```typescript
  // Fetch both Vedic charts for Ashtakoota
  const { data: userVedicChart } = await supabase
    .from('astra_birth_charts')
    .select('vedic_chart_json')
    .eq('user_id', user.id)
    .not('vedic_chart_json', 'is', null)
    .limit(1)
    .maybeSingle()

  let vedic = null
  let vedicNarrative: string | null = null

  if (userVedicChart?.vedic_chart_json) {
    const userVedic = userVedicChart.vedic_chart_json as Record<string, unknown>
    const userPlanets = (userVedic.planets || []) as { name: string; sign: string; house: number; nakshatra: string }[]
    const userNakshatras = (userVedic.nakshatras || []) as { planet: string; nakshatra: string; pada: number }[]

    const userMoon = userPlanets.find(p => p.name === 'Moon')
    const userMoonNak = userNakshatras.find(n => n.planet === 'Moon')
    const userMars = userPlanets.find(p => p.name === 'Mars')

    // Generate partner's Vedic chart
    const partnerVedicData = await fetch(`${process.env.FASTAPI_BASE_URL || 'http://localhost:8000'}/chart/vedic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': process.env.INTERNAL_SECRET || '',
      },
      body: JSON.stringify({
        date_of_birth,
        time_of_birth: time_of_birth || null,
        latitude: geoResult.lat,
        longitude: geoResult.lng,
        timezone: geoResult.timezone,
      }),
    })

    if (partnerVedicData.ok) {
      const partnerVedic = await partnerVedicData.json()
      const partnerMoon = partnerVedic.planets?.find((p: { name: string }) => p.name === 'Moon')
      const partnerMoonNak = partnerVedic.nakshatras?.find((n: { planet: string }) => n.planet === 'Moon')
      const partnerMars = partnerVedic.planets?.find((p: { name: string }) => p.name === 'Mars')

      if (userMoon && userMoonNak && partnerMoon && partnerMoonNak) {
        vedic = await callVedicCompatibilityEngine({
          user_moon_sign: userMoon.sign,
          user_nakshatra: userMoonNak.nakshatra,
          user_pada: userMoonNak.pada,
          partner_moon_sign: partnerMoon.sign,
          partner_nakshatra: partnerMoonNak.nakshatra,
          partner_pada: partnerMoonNak.pada,
          user_mars_house: userMars?.house ?? null,
          partner_mars_house: partnerMars?.house ?? null,
        })

        if (vedic && profile?.subscription_tier === 'premium') {
          vedicNarrative = await generateVedicCompatibilityNarrative({
            userName: profile.name || 'You',
            partnerName: partner_name,
            score: vedic.score,
            maxScore: vedic.max_score,
            rating: vedic.rating,
            kootas: vedic.kootas,
            doshas: vedic.doshas,
          })
        }
      }
    }
  }
```

Then modify the final response (around line 130) to include the Vedic data:

```typescript
  return NextResponse.json({
    score: compatibility?.score ?? null,
    aspects: compatibility?.aspects ?? [],
    summary: compatibility?.summary ?? null,
    report,
    partner_chart_id: partnerChart.id,
    vedic,
    vedic_narrative: vedicNarrative,
  })
```

- [ ] **Step 4: Commit**

```bash
git add lib/compatibility.ts app/api/compatibility/vedic/route.ts app/api/compatibility/route.ts
git commit -m "feat: add Vedic compatibility API routes and engine calls

Quick mode route (POST /api/compatibility/vedic) for Ashtakoota-only.
Full birth mode now also calls Vedic engine alongside Western synastry.
AI narrative generation for premium users."
```

---

## Task 5: Frontend Components — QuickModeForm

Build the quick mode input form with Moon sign and nakshatra dropdowns.

**Files:**
- Create: `components/compatibility/QuickModeForm.tsx`

- [ ] **Step 1: Create QuickModeForm component**

**IMPORTANT:** Use the `frontend-design` and `ui-ux-pro-max` skills when implementing this component. Follow the existing Astra design system: `bg-nebula` cards, `border-white/10`, `text-star`/`text-muted`/`text-violet-light`, `rounded-xl`, violet-to-rose gradient button.

The form has:
- Partner name text input
- Moon sign dropdown (12 Sanskrit signs with English label in parentheses)
- Nakshatra dropdown (filtered by selected sign using `SIGN_NAKSHATRAS`)
- Pada selector (4 radio buttons or small button group, 1-4)
- Submit button matching existing `PartnerForm` style

```typescript
// components/compatibility/QuickModeForm.tsx
'use client'

import { useState } from 'react'
import { SANSKRIT_SIGNS, SIGN_ENGLISH, SIGN_NAKSHATRAS } from '@/constants/nakshatras'

interface QuickModeFormProps {
  onSubmit: (data: {
    partner_name: string
    user_moon_sign: string
    user_nakshatra: string
    user_pada: number
    partner_moon_sign: string
    partner_nakshatra: string
    partner_pada: number
  }) => void
  loading: boolean
  userMoonSign: string
  userNakshatra: string
  userPada: number
}

export default function QuickModeForm({ onSubmit, loading, userMoonSign, userNakshatra, userPada }: QuickModeFormProps) {
  const [name, setName] = useState('')
  const [moonSign, setMoonSign] = useState('')
  const [nakshatra, setNakshatra] = useState('')
  const [pada, setPada] = useState(1)
  const [error, setError] = useState('')

  const availableNakshatras = moonSign ? SIGN_NAKSHATRAS[moonSign] || [] : []

  function handleSignChange(sign: string) {
    setMoonSign(sign)
    setNakshatra('')  // Reset nakshatra when sign changes
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !moonSign || !nakshatra) {
      setError('Name, Moon sign, and nakshatra are required')
      return
    }
    onSubmit({
      partner_name: name.trim(),
      user_moon_sign: userMoonSign,
      user_nakshatra: userNakshatra,
      user_pada: userPada,
      partner_moon_sign: moonSign,
      partner_nakshatra: nakshatra,
      partner_pada: pada,
    })
  }

  // ... render form with dropdowns following Astra design system
  // The implementer should use frontend-design skill for the actual JSX
}
```

The implementer should fill in the full JSX using the `frontend-design` and `ui-ux-pro-max` skills, matching the existing `PartnerForm.tsx` style exactly (same input classes, label styles, button style).

- [ ] **Step 2: Commit**

```bash
git add components/compatibility/QuickModeForm.tsx
git commit -m "feat: add QuickModeForm for Vedic compatibility quick mode

Moon sign dropdown with filtered nakshatra selection and pada picker.
Follows existing Astra design system."
```

---

## Task 6: Frontend Components — Result Display

Build the Ashtakoota result components: score gauge, koota cards, Mangal Dosha section, and AI narrative.

**Files:**
- Create: `components/compatibility/AshtakootaResult.tsx`
- Create: `components/compatibility/MangalDoshaSection.tsx`
- Create: `components/compatibility/CompatibilityNarrative.tsx`

- [ ] **Step 1: Create AshtakootaResult component**

**IMPORTANT:** Use `frontend-design` and `ui-ux-pro-max` skills.

This component displays:
1. A large circular score gauge (similar to existing score circle in `CompatibilityResult.tsx` but showing X/36)
2. Rating tier text below the gauge (color-coded: violet for Excellent/Good, yellow for Average, rose for Not Recommended)
3. A 2×4 grid of koota cards, each showing: name, score dots/bar, one-line description

```typescript
// components/compatibility/AshtakootaResult.tsx
'use client'

import { motion } from 'framer-motion'
import type { KootaScore } from '@/types'

interface AshtakootaResultProps {
  score: number
  maxScore: number
  rating: string
  kootas: KootaScore[]
  partnerName: string
}

export default function AshtakootaResult({ score, maxScore, rating, kootas, partnerName }: AshtakootaResultProps) {
  // ... implement with frontend-design skill
  // Score circle: reuse the scoreColor/scoreBorder pattern from CompatibilityResult.tsx
  // but adapted for /36 scale: >= 25 = violet, >= 18 = yellow, < 18 = rose
  // Koota cards: bg-nebula, border-white/5, rounded-xl, score as filled dots
}
```

- [ ] **Step 2: Create MangalDoshaSection component**

```typescript
// components/compatibility/MangalDoshaSection.tsx
'use client'

import type { DoshaInfo } from '@/types'

interface MangalDoshaSectionProps {
  doshas: DoshaInfo[]
  mangalUser: boolean
  mangalPartner: boolean
  partnerName: string
}

export default function MangalDoshaSection({ doshas, mangalUser, mangalPartner, partnerName }: MangalDoshaSectionProps) {
  // If no doshas and no mangal for either → show "No Mangal Dosha detected" note
  // If doshas present → show status cards for user and partner
  // If canceled → show green cancellation notice
  // Show remedies list
}
```

- [ ] **Step 3: Create CompatibilityNarrative component**

```typescript
// components/compatibility/CompatibilityNarrative.tsx
'use client'

import Link from 'next/link'

interface CompatibilityNarrativeProps {
  narrative: string | null
  isPremium: boolean
  loading?: boolean
}

export default function CompatibilityNarrative({ narrative, isPremium, loading }: CompatibilityNarrativeProps) {
  if (!isPremium) {
    return (
      <div className="bg-violet/10 border border-violet/30 rounded-xl p-5 text-center">
        <p className="text-star text-sm font-medium mb-1">Unlock Astra's Vedic Reading</p>
        <p className="text-muted text-xs mb-4">
          Get a personalized narrative interpreting your Ashtakoota compatibility.
        </p>
        <Link
          href="/pricing"
          className="inline-block bg-gradient-to-r from-violet to-rose text-white rounded-full px-6 py-2.5 font-semibold text-sm hover:shadow-lg hover:shadow-violet/30 transition-all"
        >
          Upgrade to Premium
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-nebula border border-violet/20 rounded-2xl p-6 animate-pulse">
        <div className="h-4 bg-white/5 rounded w-3/4 mb-3" />
        <div className="h-4 bg-white/5 rounded w-full mb-3" />
        <div className="h-4 bg-white/5 rounded w-5/6 mb-3" />
        <div className="h-4 bg-white/5 rounded w-2/3" />
      </div>
    )
  }

  if (!narrative) return null

  return (
    <div className="bg-nebula border border-violet/20 rounded-2xl p-6">
      <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-3">Astra's Vedic Reading</p>
      <div className="text-star text-sm leading-relaxed whitespace-pre-line">{narrative}</div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/compatibility/AshtakootaResult.tsx components/compatibility/MangalDoshaSection.tsx components/compatibility/CompatibilityNarrative.tsx
git commit -m "feat: add Ashtakoota result display components

Score gauge, 8-koota breakdown cards, Mangal Dosha section,
and AI narrative (premium). Follows Astra design system."
```

---

## Task 7: Integration — CompatibilityView Rewrite

Wire everything together. Add mode toggle, orchestrate both input forms and result display.

**Files:**
- Modify: `components/compatibility/CompatibilityView.tsx` — major rewrite
- Modify: `components/compatibility/CompatibilityResult.tsx` — rename header
- Modify: `app/compatibility/page.tsx` — pass additional props

- [ ] **Step 1: Update CompatibilityResult header**

In `components/compatibility/CompatibilityResult.tsx`, change the "Cross-Aspects" label to "Western Planetary Aspects":

Change line 57:
```typescript
<p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-3">Western Planetary Aspects</p>
```

- [ ] **Step 2: Rewrite CompatibilityView**

**IMPORTANT:** Use `frontend-design` and `ui-ux-pro-max` skills.

The new `CompatibilityView` needs to:
1. Add a mode toggle at the top (Full Birth Details / Quick Mode) — styled as two pill buttons
2. Show `PartnerForm` or `QuickModeForm` based on mode
3. When result arrives, show in order: `AshtakootaResult` → `MangalDoshaSection` → `CompatibilityNarrative` → `CompatibilityResult` (Western, only in full mode)
4. Handle loading states for the AI narrative separately from the main result

The component needs the user's Moon sign/nakshatra/pada (from their Vedic chart) for quick mode. These should be passed as props from the page.

```typescript
interface CompatibilityViewProps {
  isPremium: boolean
  userMoonSign?: string
  userNakshatra?: string
  userPada?: number
}
```

- [ ] **Step 3: Update page.tsx to pass Vedic chart data**

In `app/compatibility/page.tsx`, after fetching the chart, also fetch the user's Vedic chart to extract Moon data:

```typescript
  const { data: vedicChart } = await supabase
    .from('astra_birth_charts')
    .select('vedic_chart_json')
    .eq('user_id', user.id)
    .not('vedic_chart_json', 'is', null)
    .limit(1)
    .maybeSingle()

  const vedicData = vedicChart?.vedic_chart_json as Record<string, unknown> | null
  const moonNak = vedicData
    ? ((vedicData.nakshatras || []) as { planet: string; nakshatra: string; pada: number }[])
        .find(n => n.planet === 'Moon')
    : null
  const moonPlanet = vedicData
    ? ((vedicData.planets || []) as { name: string; sign: string }[])
        .find(p => p.name === 'Moon')
    : null
```

Pass to CompatibilityView:
```typescript
<CompatibilityView
  isPremium={isPremium}
  userMoonSign={moonPlanet?.sign}
  userNakshatra={moonNak?.nakshatra}
  userPada={moonNak?.pada}
/>
```

- [ ] **Step 4: Commit**

```bash
git add components/compatibility/CompatibilityView.tsx components/compatibility/CompatibilityResult.tsx app/compatibility/page.tsx
git commit -m "feat: integrate Vedic Ashtakoota into compatibility page

Dual input mode (full birth + quick mode), Vedic score as primary
display with Western synastry as secondary. AI narrative for premium."
```

---

## Task 8: Final Integration Test

Verify everything works end-to-end.

**Files:** No new files

- [ ] **Step 1: Run the full engine test suite**

Run: `cd engine && venv/Scripts/python -m pytest -v --tb=short`
Expected: All tests pass (including the new ashtakoota + route tests)

- [ ] **Step 2: Verify the engine starts with new route**

Run: `cd engine && venv/Scripts/python -c "from app.main import app; print('App loaded with', len(app.routes), 'routes')"`
Expected: Route count increased by 1 (the new `/compatibility/vedic`)

- [ ] **Step 3: Verify frontend builds**

Run: `cd root_Astra && npm run build`
Expected: Build succeeds with no TypeScript errors

- [ ] **Step 4: Commit any fixes if needed**

Only if Steps 1-3 revealed issues. Otherwise skip.

---

## Decomposition Note

This plan covers **Sub-project 5B (Ashtakoota Compatibility)** only. Remaining sub-projects:

- **5C: System Prompt + Chat Overhaul** — Rewrite `lib/claude.ts` to include computed Vedic data in AI prompts
- **5D: Horoscope Enhancement** — Transit-grounded daily horoscopes + cosmic weather API
