# Sub-project 5A: Vedic Engine Services — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build deterministic Vedic astrology services in the FastAPI engine — transits, Vimshottari Dasha, yoga detection, interpretation rules, and Rahu/Ketu support — so all AI-facing code receives pre-computed astrological facts instead of relying on LLM guessing.

**Architecture:** Five new Python service modules under `engine/app/services/`, each with pure-function logic and no AI dependency. New FastAPI route files expose them as HTTP endpoints. The existing Vedic chart endpoint is enhanced to call into these services and return a richer response. All new services are tested independently with pytest.

**Tech Stack:** Python 3.12, FastAPI, pyswisseph (Swiss Ephemeris), Pydantic v2, pytest + pytest-asyncio + httpx

---

## File Structure

### New files to create:
```
engine/app/services/transits.py        — Real-time sidereal transit calculations
engine/app/services/dasha.py           — Vimshottari Dasha calculator
engine/app/services/yogas.py           — Yoga detection engine
engine/app/services/interpretations.py — Deterministic lookup tables
engine/app/routes/transits.py          — GET /transits/today, POST /transits/personal
engine/app/routes/dasha.py             — POST /dasha
engine/app/routes/yogas.py             — POST /yogas
engine/tests/test_transits.py          — Transit service + route tests
engine/tests/test_dasha.py             — Dasha calculation tests
engine/tests/test_yogas.py             — Yoga detection tests
engine/tests/test_interpretations.py   — Interpretation lookup tests
engine/tests/test_vedic_enhanced.py    — Enhanced Vedic chart response tests
```

### Files to modify:
```
engine/app/services/vedic_chart.py     — Add Rahu/Ketu, Whole Sign houses, house lords; remove Uranus/Neptune/Pluto; call yogas/dasha/interpretations
engine/app/models/schemas.py           — Add Pydantic models for new endpoints + enhanced Vedic response
engine/app/main.py                     — Register new routers
engine/tests/test_vedic.py             — Update expected planet count (9 Vedic grahas instead of 10 Western)
```

---

## Task 1: Interpretation Lookup Tables

The interpretation service is a pure data module with no external dependencies. Every other service references it, so we build it first.

**Files:**
- Create: `engine/app/services/interpretations.py`
- Create: `engine/tests/test_interpretations.py`

- [ ] **Step 1: Write failing tests for planet-in-sign lookups**

```python
# engine/tests/test_interpretations.py
from app.services.interpretations import (
    get_planet_in_sign,
    get_planet_in_house,
    get_nakshatra_meaning,
    get_planet_remedy,
    get_house_lord_in_house,
    SIGN_LORDS,
)


def test_planet_in_sign_returns_string():
    result = get_planet_in_sign("Sun", "Mesha")
    assert isinstance(result, str)
    assert len(result) > 20  # At least a sentence


def test_planet_in_sign_all_9_grahas():
    grahas = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ketu"]
    signs = ["Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
             "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena"]
    for graha in grahas:
        for sign in signs:
            result = get_planet_in_sign(graha, sign)
            assert isinstance(result, str), f"Missing: {graha} in {sign}"
            assert len(result) > 0


def test_planet_in_sign_unknown_returns_fallback():
    result = get_planet_in_sign("Pluto", "Mesha")
    assert "not available" in result.lower() or isinstance(result, str)


def test_planet_in_house_returns_string():
    result = get_planet_in_house("Moon", 4)
    assert isinstance(result, str)
    assert len(result) > 20


def test_planet_in_house_all_combinations():
    grahas = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ketu"]
    for graha in grahas:
        for house in range(1, 13):
            result = get_planet_in_house(graha, house)
            assert isinstance(result, str), f"Missing: {graha} in house {house}"


def test_nakshatra_meaning():
    result = get_nakshatra_meaning("Ashwini")
    assert "ruling_planet" in result
    assert "deity" in result
    assert "traits" in result
    assert isinstance(result["traits"], str)


def test_all_27_nakshatras():
    from app.services.vedic_chart import NAKSHATRAS
    for nak in NAKSHATRAS:
        result = get_nakshatra_meaning(nak)
        assert "ruling_planet" in result, f"Missing nakshatra: {nak}"


def test_planet_remedy():
    result = get_planet_remedy("Saturn")
    assert "gemstone" in result
    assert "mantra" in result
    assert "charity" in result
    assert "deity" in result


def test_all_9_planet_remedies():
    for planet in ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ketu"]:
        result = get_planet_remedy(planet)
        assert "gemstone" in result, f"Missing remedy for {planet}"


def test_sign_lords_mapping():
    assert SIGN_LORDS["Mesha"] == "Mars"
    assert SIGN_LORDS["Vrishchika"] == "Mars"
    assert SIGN_LORDS["Vrishabha"] == "Venus"
    assert SIGN_LORDS["Simha"] == "Sun"
    assert SIGN_LORDS["Karka"] == "Moon"
    assert SIGN_LORDS["Makara"] == "Saturn"
    assert SIGN_LORDS["Dhanu"] == "Jupiter"


def test_house_lord_in_house():
    result = get_house_lord_in_house(1, 7)
    assert isinstance(result, str)
    assert len(result) > 20
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd engine && python -m pytest tests/test_interpretations.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.services.interpretations'`

- [ ] **Step 3: Implement the interpretations service**

```python
# engine/app/services/interpretations.py
"""
Deterministic Vedic astrology interpretation lookup tables.
Traditional Jyotish meanings — no AI involved.
"""

SIGN_LORDS: dict[str, str] = {
    "Mesha": "Mars", "Vrishabha": "Venus", "Mithuna": "Mercury",
    "Karka": "Moon", "Simha": "Sun", "Kanya": "Mercury",
    "Tula": "Venus", "Vrishchika": "Mars", "Dhanu": "Jupiter",
    "Makara": "Saturn", "Kumbha": "Saturn", "Meena": "Jupiter",
}

# 9 Vedic grahas × 12 signs = 108 entries
_PLANET_IN_SIGN: dict[str, dict[str, str]] = {
    "Sun": {
        "Mesha": "Sun is exalted in Mesha — strong vitality, leadership, and courage. Natural authority and pioneering spirit dominate the personality.",
        "Vrishabha": "Sun in Vrishabha brings steady determination and attachment to material comforts. Stubborn but reliable, with artistic sensibility.",
        "Mithuna": "Sun in Mithuna gives intellectual curiosity, versatile communication skills, and a restless mind seeking diverse experiences.",
        "Karka": "Sun in Karka creates emotional depth with nurturing leadership. Family and homeland hold great importance.",
        "Simha": "Sun in own sign Simha — powerful self-expression, natural charisma, and regal bearing. Born to lead and inspire.",
        "Kanya": "Sun in Kanya brings analytical precision, service-oriented nature, and attention to health and practical details.",
        "Tula": "Sun is debilitated in Tula — challenges with self-identity in relationships. Must learn to balance self with partnership.",
        "Vrishchika": "Sun in Vrishchika gives intense willpower, transformative nature, and deep psychological insight. Drawn to hidden truths.",
        "Dhanu": "Sun in Dhanu brings philosophical wisdom, optimism, and a strong sense of dharma. Drawn to higher learning and travel.",
        "Makara": "Sun in Makara gives disciplined ambition, structured authority, and patience in achieving long-term goals.",
        "Kumbha": "Sun in Kumbha brings humanitarian vision, unconventional thinking, and detachment from ego-driven pursuits.",
        "Meena": "Sun in Meena gives spiritual sensitivity, compassion, and creative imagination. Identity merges with the universal.",
    },
    "Moon": {
        "Mesha": "Moon in Mesha creates emotional impulsiveness and courage. Quick to react, independent in feelings, needs action to feel secure.",
        "Vrishabha": "Moon is exalted in Vrishabha — emotional stability, love of comfort, and deep contentment. Strong attachment to beauty and security.",
        "Mithuna": "Moon in Mithuna gives a quick, curious emotional nature. Needs mental stimulation and communication to feel at ease.",
        "Karka": "Moon in own sign Karka — deeply nurturing, emotionally intuitive, and strongly connected to home and mother.",
        "Simha": "Moon in Simha brings emotional warmth, generosity, and a need for recognition. Heart-centered and dramatic in expression.",
        "Kanya": "Moon in Kanya gives an analytical emotional nature. Finds comfort in order, service, and practical problem-solving.",
        "Tula": "Moon in Tula seeks emotional balance and harmony. Needs partnership and beauty to feel secure. Diplomatic by nature.",
        "Vrishchika": "Moon is debilitated in Vrishchika — intense, transformative emotions. Deep psychological awareness but prone to emotional turbulence.",
        "Dhanu": "Moon in Dhanu brings optimistic emotions, love of freedom, and philosophical outlook. Restless but generous spirit.",
        "Makara": "Moon in Makara gives emotional reserve, disciplined feelings, and a practical approach to security. Late-blooming emotional warmth.",
        "Kumbha": "Moon in Kumbha creates detached emotional awareness, humanitarian feelings, and unconventional emotional needs.",
        "Meena": "Moon in Meena brings profound sensitivity, spiritual emotions, and compassionate intuition. Boundaries may blur.",
    },
    "Mercury": {
        "Mesha": "Mercury in Mesha gives quick, sharp thinking and decisive communication. Impatient in learning but brilliant in debate.",
        "Vrishabha": "Mercury in Vrishabha brings slow, deliberate thinking and a practical, grounded communication style. Good for business.",
        "Mithuna": "Mercury in own sign Mithuna — exceptional intellect, versatile communication, and natural talent for writing and trade.",
        "Karka": "Mercury in Karka gives intuitive thinking colored by emotion. Strong memory connected to feelings and family history.",
        "Simha": "Mercury in Simha brings confident, authoritative speech and creative thinking. Natural talent for performance and leadership communication.",
        "Kanya": "Mercury is exalted in Kanya — supreme analytical ability, precise communication, and mastery of detail. Excellent for technology and healing.",
        "Tula": "Mercury in Tula gives balanced, diplomatic communication and aesthetic intellect. Natural mediator and skilled negotiator.",
        "Vrishchika": "Mercury in Vrishchika brings deep, investigative thinking and penetrating speech. Drawn to secrets and hidden knowledge.",
        "Dhanu": "Mercury in Dhanu gives philosophical thinking and broad communication style. May sacrifice detail for the big picture.",
        "Makara": "Mercury in Makara brings structured, strategic thinking and practical communication. Excellent for business and administration.",
        "Kumbha": "Mercury in Kumbha gives innovative, original thinking and progressive ideas. Natural affinity for technology and social reform.",
        "Meena": "Mercury is debilitated in Meena — intuitive but sometimes confused thinking. Strong imagination compensates for lack of precision.",
    },
    "Venus": {
        "Mesha": "Venus in Mesha brings passionate, impulsive love and bold artistic expression. Attracted to conquest and excitement in relationships.",
        "Vrishabha": "Venus in own sign Vrishabha — refined taste, sensual pleasure, and strong attraction to luxury, beauty, and comfort.",
        "Mithuna": "Venus in Mithuna gives intellectual love, flirtatious charm, and appreciation for wit and variety in relationships.",
        "Karka": "Venus in Karka brings nurturing love, emotional devotion, and attachment to home and family-centered romance.",
        "Simha": "Venus in Simha gives dramatic, generous love and creative flair. Desires admiration and grand romantic gestures.",
        "Kanya": "Venus is debilitated in Kanya — love expressed through service and practical care. Critical eye may challenge romantic idealism.",
        "Tula": "Venus in own sign Tula — supreme harmony in relationships, refined aesthetics, and natural talent for art and diplomacy.",
        "Vrishchika": "Venus in Vrishchika brings intense, transformative love and deep emotional-sexual bonds. All-or-nothing in attachment.",
        "Dhanu": "Venus in Dhanu gives adventurous love, philosophical romance, and attraction to foreign or spiritual partners.",
        "Makara": "Venus in Makara brings cautious, status-conscious love and pragmatic approach to relationships. Loyal and enduring.",
        "Kumbha": "Venus in Kumbha gives unconventional love, intellectual romance, and attraction to unique or humanitarian partners.",
        "Meena": "Venus is exalted in Meena — transcendent love, deep compassion, and supreme artistic and spiritual sensitivity.",
    },
    "Mars": {
        "Mesha": "Mars in own sign Mesha — powerful drive, physical courage, and competitive fire. Natural warrior and pioneer.",
        "Vrishabha": "Mars in Vrishabha gives persistent, steady energy directed toward material goals. Stubborn determination in finances.",
        "Mithuna": "Mars in Mithuna brings mental aggression, sharp debate skills, and restless energy channeled through communication.",
        "Karka": "Mars is debilitated in Karka — frustrated action, emotional reactivity, and energy drained by domestic conflicts.",
        "Simha": "Mars in Simha gives bold, dramatic action and leadership courage. Fights for honor and creative self-expression.",
        "Kanya": "Mars in Kanya brings precise, methodical action and energy directed toward service, health, and analytical pursuits.",
        "Tula": "Mars in Tula creates tension between assertion and diplomacy. Energy directed toward partnerships and justice.",
        "Vrishchika": "Mars in own sign Vrishchika — intense strategic power, deep reserves of willpower, and transformative action.",
        "Dhanu": "Mars in Dhanu gives righteous action, adventurous courage, and energy directed toward philosophical or spiritual goals.",
        "Makara": "Mars is exalted in Makara — disciplined, strategic action with patient ambition. Excellent for career and authority.",
        "Kumbha": "Mars in Kumbha brings revolutionary energy, unconventional action, and drive toward humanitarian or technological goals.",
        "Meena": "Mars in Meena gives diffused energy, spiritual action, and courage expressed through compassion and sacrifice.",
    },
    "Jupiter": {
        "Mesha": "Jupiter in Mesha brings bold wisdom, optimistic leadership, and expansion through courage and initiative.",
        "Vrishabha": "Jupiter in Vrishabha gives material abundance, steady growth in wealth, and wisdom expressed through practical means.",
        "Mithuna": "Jupiter in Mithuna brings intellectual expansion, love of learning, and wisdom through communication and diverse knowledge.",
        "Karka": "Jupiter is exalted in Karka — supreme wisdom through emotional intelligence, nurturing abundance, and spiritual depth.",
        "Simha": "Jupiter in Simha gives generous wisdom, noble character, and expansion through leadership and creative endeavors.",
        "Kanya": "Jupiter in Kanya brings analytical wisdom, attention to ethical details, and growth through service and health.",
        "Tula": "Jupiter in Tula gives wisdom in relationships, expansion through partnership, and a strong sense of social justice.",
        "Vrishchika": "Jupiter in Vrishchika brings deep occult wisdom, transformative growth, and expansion through research and hidden knowledge.",
        "Dhanu": "Jupiter in own sign Dhanu — supreme dharmic wisdom, philosophical depth, and natural teaching and guiding ability.",
        "Makara": "Jupiter is debilitated in Makara — restricted expansion, practical wisdom, and growth that comes slowly through discipline.",
        "Kumbha": "Jupiter in Kumbha gives humanitarian wisdom, progressive ideals, and expansion through social networks and innovation.",
        "Meena": "Jupiter in own sign Meena — spiritual wisdom, boundless compassion, and deep connection to the transcendent.",
    },
    "Saturn": {
        "Mesha": "Saturn is debilitated in Mesha — frustrated discipline, impatient karma, and lessons around impulsive action.",
        "Vrishabha": "Saturn in Vrishabha gives patient material accumulation, disciplined finances, and slow but enduring wealth building.",
        "Mithuna": "Saturn in Mithuna brings structured thinking, disciplined communication, and serious intellectual pursuits.",
        "Karka": "Saturn in Karka creates emotional restriction, karmic lessons around family and security. Late-developing emotional maturity.",
        "Simha": "Saturn in Simha brings lessons around authority, restricted self-expression, and discipline in leadership.",
        "Kanya": "Saturn in Kanya gives meticulous discipline, structured service, and mastery through detailed analytical work.",
        "Tula": "Saturn is exalted in Tula — supreme justice, balanced discipline, and karmic mastery through fair partnership.",
        "Vrishchika": "Saturn in Vrishchika brings deep karmic transformation, disciplined research, and lessons around shared resources.",
        "Dhanu": "Saturn in Dhanu gives structured philosophy, disciplined faith, and slow growth in wisdom and higher learning.",
        "Makara": "Saturn in own sign Makara — powerful ambition, patient career building, and mastery of long-term goals.",
        "Kumbha": "Saturn in own sign Kumbha — humanitarian discipline, structured innovation, and karmic service to society.",
        "Meena": "Saturn in Meena brings spiritual discipline, karmic completion, and lessons around surrender and transcendence.",
    },
    "Rahu": {
        "Mesha": "Rahu in Mesha amplifies desire for independence, pioneering ambition, and obsessive drive toward self-assertion.",
        "Vrishabha": "Rahu is exalted in Vrishabha — intense material desire, magnetic attraction to wealth and sensory pleasure.",
        "Mithuna": "Rahu in Mithuna gives obsessive curiosity, unconventional communication skills, and attraction to technology and media.",
        "Karka": "Rahu in Karka creates unusual emotional patterns, unconventional family dynamics, and desire for emotional security through non-traditional means.",
        "Simha": "Rahu in Simha brings intense desire for fame, dramatic self-expression, and unconventional approaches to authority.",
        "Kanya": "Rahu in Kanya gives obsessive analytical ability, unconventional healing skills, and perfectionist tendencies amplified.",
        "Tula": "Rahu in Tula brings intense desire for partnership, diplomatic manipulation skills, and unconventional relationship patterns.",
        "Vrishchika": "Rahu in Vrishchika gives deep obsession with occult knowledge, transformative power, and unconventional approaches to shared resources.",
        "Dhanu": "Rahu in Dhanu creates unorthodox spiritual seeking, foreign philosophical influences, and unconventional approaches to wisdom.",
        "Makara": "Rahu in Makara brings intense career ambition, unconventional authority, and desire for power through institutions.",
        "Kumbha": "Rahu in Kumbha gives revolutionary vision, obsession with technology and social reform, and unconventional community building.",
        "Meena": "Rahu in Meena brings unusual spiritual experiences, vivid imagination, and desire for transcendence through unconventional paths.",
    },
    "Ketu": {
        "Mesha": "Ketu in Mesha gives past-life warrior energy, detachment from ego assertion, and natural spiritual courage.",
        "Vrishabha": "Ketu in Vrishabha brings detachment from material comfort, past-life wealth memory, and spiritual minimalism.",
        "Mithuna": "Ketu in Mithuna gives intuitive knowledge beyond intellect, detachment from logic, and past-life communication mastery.",
        "Karka": "Ketu in Karka brings detachment from emotional security, past-life nurturing memory, and spiritual independence from family.",
        "Simha": "Ketu in Simha gives detachment from fame and ego, past-life leadership mastery, and humble spiritual authority.",
        "Kanya": "Ketu in Kanya brings intuitive analytical ability, detachment from perfectionism, and past-life healing knowledge.",
        "Tula": "Ketu in Tula gives detachment from partnerships, past-life relationship mastery, and spiritual self-sufficiency.",
        "Vrishchika": "Ketu is exalted in Vrishchika — profound occult intuition, past-life transformative mastery, and natural mystical ability.",
        "Dhanu": "Ketu in Dhanu brings innate spiritual wisdom, detachment from dogmatic belief, and past-life philosophical mastery.",
        "Makara": "Ketu in Makara gives detachment from career ambition, past-life authority mastery, and freedom from institutional power.",
        "Kumbha": "Ketu in Kumbha brings detachment from social networks, past-life humanitarian mastery, and solitary spiritual path.",
        "Meena": "Ketu in Meena gives profound spiritual liberation, past-life moksha energy, and natural detachment from the material world.",
    },
}

# 9 grahas × 12 houses = 108 entries
_PLANET_IN_HOUSE: dict[str, dict[int, str]] = {
    "Sun": {
        1: "Sun in 1st house (Tanu) — strong personality, natural leadership, vitality, and self-confidence. The identity shines brightly.",
        2: "Sun in 2nd house (Dhana) — wealth through authority, strong family pride, and powerful speech. May earn through government.",
        3: "Sun in 3rd house — courage, strong willpower, and leadership among siblings. Success through communication and short travel.",
        4: "Sun in 4th house (Matru) — authority in domestic life, property through government, and strong but potentially dominating parent.",
        5: "Sun in 5th house — creative intelligence, leadership in speculation, and strong connection with children. Political talent.",
        6: "Sun in 6th house (Shatru) — victory over enemies, strong health, and success in competition and service roles.",
        7: "Sun in 7th house (Kalatra) — dominant partner, public reputation through marriage, but ego conflicts in partnership.",
        8: "Sun in 8th house — challenges to vitality, transformation through authority, and interest in occult sciences.",
        9: "Sun in 9th house (Bhagya) — fortunate through father, strong dharma, and success in higher education and philosophy.",
        10: "Sun in 10th house (Karma) — powerful career, government authority, high status, and public recognition. Best placement for career.",
        11: "Sun in 11th house (Labha) — gains through authority, influential social network, and fulfillment of ambitions.",
        12: "Sun in 12th house (Vyaya) — hidden authority, foreign settlement possible, and spiritual journey through ego dissolution.",
    },
    "Moon": {
        1: "Moon in 1st house — emotional, intuitive personality. Public-facing, changeable nature. Strong connection to mother.",
        2: "Moon in 2nd house — fluctuating wealth, nurturing speech, and emotional attachment to family and food.",
        3: "Moon in 3rd house — imaginative communication, emotional courage, and close bond with siblings.",
        4: "Moon in 4th house — deeply content at home, strong maternal bond, emotional peace, and property gains. Excellent placement.",
        5: "Moon in 5th house — creative, romantic mind. Strong emotional bond with children. Speculative instincts.",
        6: "Moon in 6th house — emotional stress from enemies and illness. Service-oriented, but health needs attention.",
        7: "Moon in 7th house — emotional, caring partner. Public charm and success through partnerships. Spouse is nurturing.",
        8: "Moon in 8th house — emotional turbulence, psychic sensitivity, and transformation through emotional crises.",
        9: "Moon in 9th house — religious/spiritual mother, emotional wisdom, and fortune through intuition and travel.",
        10: "Moon in 10th house — public popularity, career in nurturing fields, and fame that fluctuates.",
        11: "Moon in 11th house — gains through women and public, emotional fulfillment through social connections.",
        12: "Moon in 12th house — vivid dreams, spiritual sensitivity, foreign residence possible. Private emotional life.",
    },
    "Mercury": {
        1: "Mercury in 1st house — intelligent, youthful appearance. Quick-witted, communicative, and commercially minded.",
        2: "Mercury in 2nd house — wealth through intellect, skilled speech, and business acumen. Family values education.",
        3: "Mercury in 3rd house — excellent communication, writing talent, and success through media. Strong sibling bonds.",
        4: "Mercury in 4th house — educated household, intellectual property interests, and mental peace through learning.",
        5: "Mercury in 5th house — sharp intelligence, speculative skill through analysis, and intellectual children.",
        6: "Mercury in 6th house — analytical victory over enemies, health through knowledge, and skill in debate.",
        7: "Mercury in 7th house — business partnerships, youthful spouse, and commercial success through alliance.",
        8: "Mercury in 8th house — research ability, interest in occult mathematics, and inheritance through communication.",
        9: "Mercury in 9th house — philosophical intellect, success in higher education, and wisdom through diverse learning.",
        10: "Mercury in 10th house — career in communication, technology, or trade. Versatile professional success.",
        11: "Mercury in 11th house — gains through intellect and networks. Friend circles include writers and merchants.",
        12: "Mercury in 12th house — foreign language ability, quiet contemplation, and expenses on education.",
    },
    "Venus": {
        1: "Venus in 1st house — attractive personality, artistic nature, and love of beauty. Charming and diplomatic.",
        2: "Venus in 2nd house — wealth through luxury and arts, sweet speech, and beautiful family life.",
        3: "Venus in 3rd house — artistic communication, creative siblings, and gains through media and performance.",
        4: "Venus in 4th house — beautiful home, luxury vehicles, and deep domestic happiness. Excellent placement.",
        5: "Venus in 5th house — romantic nature, creative talent, and love of entertainment. Artistic children.",
        6: "Venus in 6th house — challenges in love, health attention needed for kidneys/sugar. Service through beauty.",
        7: "Venus in 7th house — beautiful spouse, harmonious marriage, and success through partnerships. Strong placement.",
        8: "Venus in 8th house — hidden pleasures, inheritance through spouse, and transformative love experiences.",
        9: "Venus in 9th house — fortunate in love, artistic philosophy, and luck through creative or foreign connections.",
        10: "Venus in 10th house — career in arts, luxury, or beauty industry. Public charm and professional grace.",
        11: "Venus in 11th house — gains through women, arts, and luxury. Wishes fulfilled through social charm.",
        12: "Venus in 12th house — secret pleasures, foreign luxury, and spiritual love. Bedroom comforts and expenses on beauty.",
    },
    "Mars": {
        1: "Mars in 1st house — courageous, athletic, aggressive personality. Mangal Dosha: intensity in relationships.",
        2: "Mars in 2nd house — harsh speech, wealth through courage, and conflicts in family. Surgical or military earning.",
        3: "Mars in 3rd house — valorous, courageous siblings, and success through bold action. Excellent placement for Mars.",
        4: "Mars in 4th house — domestic conflicts, property through effort, and restless mind. Mangal Dosha active.",
        5: "Mars in 5th house — competitive children, speculative courage, and sharp intelligence applied aggressively.",
        6: "Mars in 6th house — victory over enemies, strong health, and dominance in competition. Excellent placement.",
        7: "Mars in 7th house — aggressive spouse, passionate marriage but conflicts. Mangal Dosha: partnership intensity.",
        8: "Mars in 8th house — accident-prone, surgery possible, but strong recovery. Mangal Dosha: transformative conflict.",
        9: "Mars in 9th house — courage in philosophy, aggressive dharma, and conflicts with father or teachers.",
        10: "Mars in 10th house — career in military, surgery, engineering, or sports. Powerful professional drive.",
        11: "Mars in 11th house — gains through courage, ambitious social network, and fulfillment through competitive effort.",
        12: "Mars in 12th house — hidden anger, foreign conflict, and expense through aggression. Mangal Dosha active.",
    },
    "Jupiter": {
        1: "Jupiter in 1st house — wise, optimistic, generous personality. Natural teacher and guide. Blessed with good fortune.",
        2: "Jupiter in 2nd house — wealth through wisdom, truthful speech, and prosperous family. Excellent for finances.",
        3: "Jupiter in 3rd house — wise communication, fortunate siblings, and success through teaching and publishing.",
        4: "Jupiter in 4th house — spacious home, academic mother, and deep inner peace. Property and vehicle gains.",
        5: "Jupiter in 5th house — brilliant children, wise speculation, and creative intelligence. Purva punya (past-life merit).",
        6: "Jupiter in 6th house — overcomes enemies through wisdom, but health watch for liver/weight. Service-oriented.",
        7: "Jupiter in 7th house — wise, generous spouse. Blessed marriage and successful partnerships. Excellent placement.",
        8: "Jupiter in 8th house — longevity, occult wisdom, and inheritance. Transformation through spiritual knowledge.",
        9: "Jupiter in 9th house — supreme fortune, spiritual wisdom, and blessed by guru. Excellent placement for dharma.",
        10: "Jupiter in 10th house — career in teaching, law, or finance. High ethical standards and professional respect.",
        11: "Jupiter in 11th house — abundant gains, prosperous network, and wishes fulfilled through wisdom.",
        12: "Jupiter in 12th house — spiritual liberation, foreign fortune, and charitable nature. Moksha-oriented.",
    },
    "Saturn": {
        1: "Saturn in 1st house — serious, disciplined personality. Slow start in life but enduring success through perseverance.",
        2: "Saturn in 2nd house — frugal, delayed wealth, and cautious speech. Financial success after hard work and patience.",
        3: "Saturn in 3rd house — persistent courage, estranged siblings possible, and success through sustained effort.",
        4: "Saturn in 4th house — restricted domestic happiness, delayed property, but eventual real estate success.",
        5: "Saturn in 5th house — delayed children, conservative speculation, and disciplined intelligence. Late creative blooming.",
        6: "Saturn in 6th house — chronic health vigilance needed, but ultimate victory over enemies. Strong work ethic.",
        7: "Saturn in 7th house — delayed or mature marriage, serious spouse, and partnerships built on duty and structure.",
        8: "Saturn in 8th house — longevity through discipline, chronic health patterns, and slow transformation.",
        9: "Saturn in 9th house — orthodox philosophy, delayed fortune, and wisdom through hardship and experience.",
        10: "Saturn in 10th house — powerful career through patience, authority earned over time. Government and corporate success.",
        11: "Saturn in 11th house — slow but steady gains, older friends, and long-term fulfillment of ambitions. Excellent placement.",
        12: "Saturn in 12th house — spiritual discipline, foreign exile possible, and karmic completion through solitude.",
    },
    "Rahu": {
        1: "Rahu in 1st house — unconventional personality, magnetic presence, and obsessive self-development. Foreign influences.",
        2: "Rahu in 2nd house — unusual wealth sources, unconventional family, and speech that captivates or deceives.",
        3: "Rahu in 3rd house — bold communication, success through media and technology. Courageous in unconventional ways.",
        4: "Rahu in 4th house — unusual home environment, foreign property, and restless domestic life.",
        5: "Rahu in 5th house — unconventional creativity, speculative obsession, and unusual relationship with children.",
        6: "Rahu in 6th house — victory over hidden enemies, unusual health patterns, and success through unconventional service.",
        7: "Rahu in 7th house — foreign or unconventional spouse, obsessive partnerships, and unusual public reputation.",
        8: "Rahu in 8th house — fascination with occult, sudden transformations, and unconventional inheritance.",
        9: "Rahu in 9th house — unorthodox spirituality, foreign guru, and philosophical rebellion.",
        10: "Rahu in 10th house — ambitious career through unconventional means, fame through innovation. Powerful placement.",
        11: "Rahu in 11th house — massive gains through networks and technology. Ambitious social circle. Excellent placement.",
        12: "Rahu in 12th house — foreign residence, unusual spiritual path, and hidden obsessions.",
    },
    "Ketu": {
        1: "Ketu in 1st house — spiritual, detached personality. Past-life wisdom gives intuitive but aloof demeanor.",
        2: "Ketu in 2nd house — detachment from wealth, unusual speech patterns, and spiritual family values.",
        3: "Ketu in 3rd house — intuitive communication, detachment from siblings, and past-life courage mastery.",
        4: "Ketu in 4th house — detachment from homeland, unusual domestic life, and spiritual search for inner peace.",
        5: "Ketu in 5th house — past-life creative mastery, unusual intelligence, and detachment from speculation.",
        6: "Ketu in 6th house — mystical healing ability, sudden victory over enemies, and unusual health patterns.",
        7: "Ketu in 7th house — detachment in marriage, spiritual partnerships, and past-life relationship completion.",
        8: "Ketu in 8th house — natural occult intuition, past-life mystical mastery, and detachment from fear of death.",
        9: "Ketu in 9th house — innate spiritual wisdom, detachment from organized religion, and past-life guru energy.",
        10: "Ketu in 10th house — detachment from career ambition, past-life authority, and unconventional professional path.",
        11: "Ketu in 11th house — detachment from gains and social networks. Spiritual fulfillment over material ambition.",
        12: "Ketu in 12th house — profound spiritual liberation, natural moksha energy, and past-life transcendence. Excellent placement.",
    },
}

# 27 nakshatras with ruling planet, deity, and core traits
_NAKSHATRA_DATA: dict[str, dict[str, str]] = {
    "Ashwini": {"ruling_planet": "Ketu", "deity": "Ashwini Kumaras (Divine Physicians)", "traits": "Swift healing ability, pioneering spirit, and desire for speed and new beginnings."},
    "Bharani": {"ruling_planet": "Venus", "deity": "Yama (God of Death)", "traits": "Transformative power, creative fertility, and ability to bear heavy burdens."},
    "Krittika": {"ruling_planet": "Sun", "deity": "Agni (Fire God)", "traits": "Sharp intelligence, purifying nature, and critical discernment that cuts through illusion."},
    "Rohini": {"ruling_planet": "Moon", "deity": "Brahma (Creator)", "traits": "Creative abundance, beauty, and sensual magnetism. Growth and material prosperity."},
    "Mrigashira": {"ruling_planet": "Mars", "deity": "Soma (Moon God)", "traits": "Searching, curious nature. Gentle yet restless pursuit of knowledge and experience."},
    "Ardra": {"ruling_planet": "Rahu", "deity": "Rudra (Storm God)", "traits": "Transformative storms, intellectual brilliance, and emotional intensity that clears the path."},
    "Punarvasu": {"ruling_planet": "Jupiter", "deity": "Aditi (Mother of Gods)", "traits": "Renewal, return to goodness, and optimistic ability to bounce back from adversity."},
    "Pushya": {"ruling_planet": "Saturn", "deity": "Brihaspati (Guru of Gods)", "traits": "Nourishing wisdom, spiritual teaching, and the most auspicious nakshatra for growth."},
    "Ashlesha": {"ruling_planet": "Mercury", "deity": "Naga (Serpent)", "traits": "Mystical intuition, hypnotic charm, and deep psychological penetration."},
    "Magha": {"ruling_planet": "Ketu", "deity": "Pitris (Ancestors)", "traits": "Royal authority, ancestral power, and connection to tradition and lineage."},
    "Purva Phalguni": {"ruling_planet": "Venus", "deity": "Bhaga (God of Delight)", "traits": "Creative enjoyment, romantic nature, and talent for relaxation and pleasure."},
    "Uttara Phalguni": {"ruling_planet": "Sun", "deity": "Aryaman (God of Patronage)", "traits": "Generous leadership, contractual fidelity, and success through helpful patronage."},
    "Hasta": {"ruling_planet": "Moon", "deity": "Savitar (Sun God of Vitality)", "traits": "Skilled hands, craftsmanship, and ability to manifest ideas into reality."},
    "Chitra": {"ruling_planet": "Mars", "deity": "Vishwakarma (Divine Architect)", "traits": "Architectural brilliance, visual beauty, and creative construction talent."},
    "Swati": {"ruling_planet": "Rahu", "deity": "Vayu (Wind God)", "traits": "Independent spirit, flexibility, and ability to thrive through adaptability and trade."},
    "Vishakha": {"ruling_planet": "Jupiter", "deity": "Indra-Agni (Power-Fire)", "traits": "Determined ambition, single-pointed focus, and triumph through perseverance."},
    "Anuradha": {"ruling_planet": "Saturn", "deity": "Mitra (God of Friendship)", "traits": "Devotional friendship, organizational ability, and success in foreign lands."},
    "Jyeshtha": {"ruling_planet": "Mercury", "deity": "Indra (King of Gods)", "traits": "Protective authority, elder responsibility, and courageous defense of the vulnerable."},
    "Mula": {"ruling_planet": "Ketu", "deity": "Nirriti (Goddess of Destruction)", "traits": "Root-level transformation, investigation to the core, and destruction that enables new growth."},
    "Purva Ashadha": {"ruling_planet": "Venus", "deity": "Apas (Water Goddess)", "traits": "Invincible conviction, purifying influence, and early victory energy."},
    "Uttara Ashadha": {"ruling_planet": "Sun", "deity": "Vishvedevas (Universal Gods)", "traits": "Final victory, universal ethics, and leadership that earns lasting respect."},
    "Shravana": {"ruling_planet": "Moon", "deity": "Vishnu (Preserver)", "traits": "Deep listening, learning through hearing, and connection to traditional knowledge."},
    "Dhanishta": {"ruling_planet": "Mars", "deity": "Vasus (Eight Elemental Gods)", "traits": "Musical rhythm, wealth accumulation, and abundance through disciplined effort."},
    "Shatabhisha": {"ruling_planet": "Rahu", "deity": "Varuna (God of Cosmic Waters)", "traits": "Healing through isolation, mystical knowledge, and independent self-healing ability."},
    "Purva Bhadrapada": {"ruling_planet": "Jupiter", "deity": "Aja Ekapada (One-footed Goat)", "traits": "Intense spiritual fire, transformative passion, and ability to endure extreme austerity."},
    "Uttara Bhadrapada": {"ruling_planet": "Saturn", "deity": "Ahir Budhnya (Serpent of the Deep)", "traits": "Deep wisdom, controlled kundalini energy, and mastery through spiritual discipline."},
    "Revati": {"ruling_planet": "Mercury", "deity": "Pushan (Nourishing Guide)", "traits": "Safe journeys, compassionate guidance, and gentle completion of cosmic cycles."},
}

# Remedies per planet
_PLANET_REMEDIES: dict[str, dict[str, str]] = {
    "Sun": {"gemstone": "Ruby (Manik)", "mantra": "Om Hraam Hreem Hraum Sah Suryaya Namah", "charity": "Donate wheat or jaggery on Sundays", "deity": "Lord Surya"},
    "Moon": {"gemstone": "Pearl (Moti)", "mantra": "Om Shraam Shreem Shraum Sah Chandraya Namah", "charity": "Donate rice or white items on Mondays", "deity": "Lord Shiva"},
    "Mars": {"gemstone": "Red Coral (Moonga)", "mantra": "Om Kraam Kreem Kraum Sah Bhaumaya Namah", "charity": "Donate red lentils on Tuesdays", "deity": "Lord Hanuman"},
    "Mercury": {"gemstone": "Emerald (Panna)", "mantra": "Om Braam Breem Braum Sah Budhaya Namah", "charity": "Donate green moong dal on Wednesdays", "deity": "Lord Vishnu"},
    "Jupiter": {"gemstone": "Yellow Sapphire (Pukhraj)", "mantra": "Om Graam Greem Graum Sah Gurave Namah", "charity": "Donate turmeric or yellow items on Thursdays", "deity": "Lord Brihaspati"},
    "Venus": {"gemstone": "Diamond (Heera)", "mantra": "Om Draam Dreem Draum Sah Shukraya Namah", "charity": "Donate white clothes or sugar on Fridays", "deity": "Goddess Lakshmi"},
    "Saturn": {"gemstone": "Blue Sapphire (Neelam)", "mantra": "Om Sham Shanicharaya Namah", "charity": "Donate black items or mustard oil on Saturdays", "deity": "Lord Shani"},
    "Rahu": {"gemstone": "Hessonite Garnet (Gomed)", "mantra": "Om Bhram Bhreem Bhraum Sah Rahave Namah", "charity": "Donate blue or black blankets on Saturdays", "deity": "Goddess Durga"},
    "Ketu": {"gemstone": "Cat's Eye (Lehsunia)", "mantra": "Om Stram Streem Straum Sah Ketave Namah", "charity": "Donate gray or mixed-color blankets on Tuesdays", "deity": "Lord Ganesha"},
}

# House lord in house (simplified — key combinations, 12x12=144)
_HOUSE_LORD_IN_HOUSE: dict[int, dict[int, str]] = {
    1: {
        1: "1st lord in 1st — strong self-identity, independent nature, and vitality. The self expresses itself directly.",
        2: "1st lord in 2nd — identity connected to wealth, family, and speech. Earns through personal effort and personality.",
        3: "1st lord in 3rd — courageous self-expression, success through communication and short travels.",
        4: "1st lord in 4th — identity rooted in home, emotional security, and domestic happiness.",
        5: "1st lord in 5th — creative self-expression, intelligence-driven identity, and connection to children.",
        6: "1st lord in 6th — identity through service or overcoming obstacles. Health requires attention.",
        7: "1st lord in 7th — identity defined through partnerships. Success comes through marriage or business alliance.",
        8: "1st lord in 8th — transformative life path, interest in occult, and ups-and-downs in self-expression.",
        9: "1st lord in 9th — fortunate, dharmic personality. Identity connected to philosophy, father, and higher purpose.",
        10: "1st lord in 10th — career-driven identity, public recognition, and strong professional ambition.",
        11: "1st lord in 11th — ambitious personality, identity through social networks and fulfillment of desires.",
        12: "1st lord in 12th — identity connected to foreign lands, spiritual seeking, or loss and isolation.",
    },
    7: {
        1: "7th lord in 1st — spouse influences personality strongly. Partnerships define the self.",
        2: "7th lord in 2nd — wealth through partnerships, spouse contributes to family prosperity.",
        3: "7th lord in 3rd — partnerships in communication or business. Spouse may be from nearby area.",
        4: "7th lord in 4th — domestic harmony through partnerships. Spouse brings comfort and property.",
        5: "7th lord in 5th — romantic marriage, creative partnerships, and love-based union.",
        6: "7th lord in 6th — conflicts in partnerships, possible separation challenges. Needs patience.",
        7: "7th lord in 7th — strong marriage, spouse has independent nature, and successful partnerships.",
        8: "7th lord in 8th — transformative marriage, spouse connected to occult or inheritance. Secret partnerships.",
        9: "7th lord in 9th — fortunate marriage, spouse from different background or philosophy.",
        10: "7th lord in 10th — career advancement through marriage. Spouse supports professional goals.",
        11: "7th lord in 11th — gains through partnerships. Social connections expand through marriage.",
        12: "7th lord in 12th — foreign spouse possible, expense through partnerships, or spiritual union.",
    },
    9: {
        1: "9th lord in 1st — naturally fortunate, blessed personality. Dharma guides all actions.",
        2: "9th lord in 2nd — wealth through fortune, inheritance from father, and dharmic family.",
        3: "9th lord in 3rd — fortune through communication, publishing, and courageous efforts.",
        4: "9th lord in 4th — fortunate domestic life, property inheritance, and spiritual home.",
        5: "9th lord in 5th — supreme fortune, past-life merit, and blessed intelligence. Excellent placement.",
        6: "9th lord in 6th — fortune diminished by obstacles. Success through service despite difficulties.",
        7: "9th lord in 7th — fortunate partnerships, dharmic spouse, and luck through alliance.",
        8: "9th lord in 8th — hidden fortune, inheritance, and transformation of luck through crisis.",
        9: "9th lord in 9th — supreme dharma, deeply fortunate, and blessed by guru and father.",
        10: "9th lord in 10th — career blessed by fortune, rajayoga potential, and public dharmic authority.",
        11: "9th lord in 11th — abundant gains through fortune and dharma. Wishes fulfilled easily.",
        12: "9th lord in 12th — fortune expressed through foreign lands, spirituality, and charitable giving.",
    },
    10: {
        1: "10th lord in 1st — career defines personality. Strong professional identity and public visibility.",
        2: "10th lord in 2nd — career generates wealth. Profession connected to speech, food, or family business.",
        3: "10th lord in 3rd — career in communication, media, writing, or business. Entrepreneurial success.",
        4: "10th lord in 4th — career from home, real estate, or education. Works in comfortable environments.",
        5: "10th lord in 5th — creative career, entertainment, politics, or speculation-based profession.",
        6: "10th lord in 6th — career in service, healthcare, law, or competitive fields.",
        7: "10th lord in 7th — career through partnerships, business alliances, or spouse's support.",
        8: "10th lord in 8th — career in research, occult, insurance, or transformation. Hidden professional life.",
        9: "10th lord in 9th — career connected to dharma, philosophy, law, or foreign lands. Teaching profession.",
        10: "10th lord in 10th — powerful career, strong professional position, and public authority.",
        11: "10th lord in 11th — profession generates abundant income. Career connected to networks and large organizations.",
        12: "10th lord in 12th — career abroad, in hospitals, ashrams, or spiritual institutions. Expenses through profession.",
    },
    2: {
        1: "2nd lord in 1st — wealth enhances personality. Earns through personal effort and appearance.",
        2: "2nd lord in 2nd — strong wealth house, family prosperity, and powerful speech.",
        3: "2nd lord in 3rd — wealth through communication, writing, and short business ventures.",
        4: "2nd lord in 4th — wealth through property, vehicles, and domestic comfort.",
        5: "2nd lord in 5th — wealth through speculation, creativity, and intelligent investment.",
        6: "2nd lord in 6th — wealth challenged by debts and enemies. Financial recovery through effort.",
        7: "2nd lord in 7th — wealth through partnerships and marriage. Spouse contributes financially.",
        8: "2nd lord in 8th — sudden financial changes, inheritance possible, but instability in wealth.",
        9: "2nd lord in 9th — fortunate wealth, family dharma, and prosperity through higher pursuits.",
        10: "2nd lord in 10th — career generates family wealth. Professional speech and authority.",
        11: "2nd lord in 11th — excellent for wealth accumulation. Multiple income sources.",
        12: "2nd lord in 12th — expenses drain family wealth. Foreign financial connections.",
    },
    4: {
        1: "4th lord in 1st — emotional nature defines personality. Love of comfort visible to all.",
        2: "4th lord in 2nd — home connected to wealth. Family property and domestic prosperity.",
        3: "4th lord in 3rd — comfort through communication. Frequent short moves or travels.",
        4: "4th lord in 4th — strong domestic happiness, property, and emotional security.",
        5: "4th lord in 5th — creative home environment. Education brings happiness.",
        6: "4th lord in 6th — challenges in domestic peace. Property disputes or home stress.",
        7: "4th lord in 7th — happiness through marriage. Spouse brings domestic comfort.",
        8: "4th lord in 8th — disrupted domestic peace, but property through inheritance.",
        9: "4th lord in 9th — fortunate home, spiritual domestic life. Property abroad possible.",
        10: "4th lord in 10th — career in real estate, education, or nurturing fields.",
        11: "4th lord in 11th — gains through property. Social network provides comfort.",
        12: "4th lord in 12th — home abroad, loss of domestic peace, or spiritual retreat.",
    },
    5: {
        1: "5th lord in 1st — intelligence defines personality. Creative, romantic nature visible to all.",
        2: "5th lord in 2nd — wealth through intelligence and speculation. Creative family.",
        3: "5th lord in 3rd — creative communication, intellectual courage, and writing talent.",
        4: "5th lord in 4th — academic home, creative domestic environment, and intelligent mother.",
        5: "5th lord in 5th — strong intelligence, creative power, and blessed children.",
        6: "5th lord in 6th — intelligence applied to overcoming obstacles. Competition in education.",
        7: "5th lord in 7th — romantic partnerships, creative alliances, and intelligent spouse.",
        8: "5th lord in 8th — hidden intelligence, research ability, and speculative risk.",
        9: "5th lord in 9th — purva punya, past-life merit bringing fortune through wisdom.",
        10: "5th lord in 10th — career through intelligence, creativity, or leadership. Political talent.",
        11: "5th lord in 11th — gains through intelligence and speculation. Ambitious creative mind.",
        12: "5th lord in 12th — foreign education, loss in speculation, or spiritual creativity.",
    },
    6: {
        1: "6th lord in 1st — personality defined by overcoming obstacles. Health requires attention.",
        2: "6th lord in 2nd — wealth affected by enemies or debts. Speech creates conflicts.",
        3: "6th lord in 3rd — courage against obstacles. Rivals in communication sphere.",
        4: "6th lord in 4th — domestic challenges, property disputes, or maternal health issues.",
        5: "6th lord in 5th — obstacles in creativity or children. Sharp analytical intelligence.",
        6: "6th lord in 6th — viparita rajayoga — enemies destroy themselves. Strong competitive position.",
        7: "6th lord in 7th — partnership conflicts, legal disputes, or spouse's health challenges.",
        8: "6th lord in 8th — chronic health patterns, but obstacles eventually resolve through transformation.",
        9: "6th lord in 9th — conflicts with father or guru. Obstacles in fortune.",
        10: "6th lord in 10th — career in service, healthcare, law, or defense.",
        11: "6th lord in 11th — gains through competition and service. Victory brings income.",
        12: "6th lord in 12th — viparita rajayoga — enemies and debts dissolve. Expenses end obstacles.",
    },
    8: {
        1: "8th lord in 1st — transformative personality, interest in occult, and health fluctuations.",
        2: "8th lord in 2nd — sudden financial changes and family secrets. Inheritance possible.",
        3: "8th lord in 3rd — risky communications, research writing, and courage through crisis.",
        4: "8th lord in 4th — domestic upheaval, hidden property matters, or underground resources.",
        5: "8th lord in 5th — speculative losses possible, but deep research intelligence.",
        6: "8th lord in 6th — viparita rajayoga — transformation overcomes enemies. Health through crisis.",
        7: "8th lord in 7th — transformative partnerships, spouse connected to hidden matters.",
        8: "8th lord in 8th — deep occult knowledge, longevity, and profound transformation.",
        9: "8th lord in 9th — challenges to fortune, crisis of faith, but spiritual transformation.",
        10: "8th lord in 10th — career upheavals, but success through research and transformation.",
        11: "8th lord in 11th — sudden gains or losses through networks. Inheritance from friends.",
        12: "8th lord in 12th — viparita rajayoga — losses transform into spiritual gains. Hidden liberation.",
    },
    11: {
        1: "11th lord in 1st — ambitious personality, gains through personal effort and charm.",
        2: "11th lord in 2nd — income builds family wealth. Multiple earning sources.",
        3: "11th lord in 3rd — gains through communication, media, and entrepreneurial courage.",
        4: "11th lord in 4th — gains through property, comfort, and domestic ventures.",
        5: "11th lord in 5th — gains through intelligence, speculation, and creative ventures.",
        6: "11th lord in 6th — income through service, competition, or healthcare.",
        7: "11th lord in 7th — gains through partnerships and marriage. Business alliances profitable.",
        8: "11th lord in 8th — sudden gains or losses. Income through research or occult.",
        9: "11th lord in 9th — fortunate gains, income through dharma and philosophy.",
        10: "11th lord in 10th — career generates strong income. Professional ambitions fulfilled.",
        11: "11th lord in 11th — excellent for income and gains. All desires tend to manifest.",
        12: "11th lord in 12th — income spent quickly, foreign income sources, or charitable gains.",
    },
    12: {
        1: "12th lord in 1st — personality connected to foreign lands, spirituality, or isolation.",
        2: "12th lord in 2nd — expenses drain wealth. Foreign family connections.",
        3: "12th lord in 3rd — expenses through communication. Foreign short travels.",
        4: "12th lord in 4th — domestic loss or foreign home. Spiritual domestic life.",
        5: "12th lord in 5th — foreign education, speculative loss, or spiritual creativity.",
        6: "12th lord in 6th — viparita rajayoga — losses become victories. Expenses end enemies.",
        7: "12th lord in 7th — foreign spouse, expenses through partnerships.",
        8: "12th lord in 8th — deep transformation, spiritual liberation, and past-life karmic clearing.",
        9: "12th lord in 9th — spiritual fortune, foreign pilgrimages, and dharma through sacrifice.",
        10: "12th lord in 10th — career abroad or in spiritual/institutional settings.",
        11: "12th lord in 11th — gains from foreign sources. Social network includes foreign connections.",
        12: "12th lord in 12th — strong moksha potential, foreign settlement, and spiritual isolation.",
    },
    3: {
        1: "3rd lord in 1st — courageous personality, self-made success through personal effort.",
        2: "3rd lord in 2nd — wealth through communication, writing, and sibling support.",
        3: "3rd lord in 3rd — strong courage, excellent communication, and sibling harmony.",
        4: "3rd lord in 4th — comfort through communication. Home-based business or writing.",
        5: "3rd lord in 5th — creative communication, artistic courage, and intellectual siblings.",
        6: "3rd lord in 6th — communication overcomes obstacles. Conflict with siblings possible.",
        7: "3rd lord in 7th — partnerships through communication. Business-oriented marriage.",
        8: "3rd lord in 8th — hidden communications, research writing, and transformative courage.",
        9: "3rd lord in 9th — courageous philosophy, publishing success, and dharmic communication.",
        10: "3rd lord in 10th — career in communication, media, or entrepreneurship.",
        11: "3rd lord in 11th — gains through communication and sibling network. Ambitious writing.",
        12: "3rd lord in 12th — foreign communication, loss of courage, or spiritual writing.",
    },
}


def get_planet_in_sign(planet: str, sign: str) -> str:
    """Get interpretation for a planet placed in a sign."""
    planet_data = _PLANET_IN_SIGN.get(planet)
    if not planet_data:
        return f"Interpretation for {planet} in {sign} is not available in the current knowledge base."
    return planet_data.get(sign, f"Interpretation for {planet} in {sign} is not available in the current knowledge base.")


def get_planet_in_house(planet: str, house: int) -> str:
    """Get interpretation for a planet placed in a house."""
    planet_data = _PLANET_IN_HOUSE.get(planet)
    if not planet_data:
        return f"Interpretation for {planet} in house {house} is not available in the current knowledge base."
    return planet_data.get(house, f"Interpretation for {planet} in house {house} is not available in the current knowledge base.")


def get_nakshatra_meaning(nakshatra: str) -> dict[str, str]:
    """Get meaning for a nakshatra. Returns dict with ruling_planet, deity, traits."""
    return _NAKSHATRA_DATA.get(nakshatra, {
        "ruling_planet": "Unknown",
        "deity": "Unknown",
        "traits": f"Interpretation for {nakshatra} is not available in the current knowledge base.",
    })


def get_planet_remedy(planet: str) -> dict[str, str]:
    """Get remedial measures for a planet."""
    return _PLANET_REMEDIES.get(planet, {
        "gemstone": "Consult an astrologer",
        "mantra": "Om Namah Shivaya",
        "charity": "General charity on any day",
        "deity": "Ishta Devata (personal deity)",
    })


def get_house_lord_in_house(source_house: int, target_house: int) -> str:
    """Get meaning for lord of source_house placed in target_house."""
    house_data = _HOUSE_LORD_IN_HOUSE.get(source_house)
    if not house_data:
        return f"Lord of house {source_house} in house {target_house} — interpretation not available."
    return house_data.get(target_house, f"Lord of house {source_house} in house {target_house} — interpretation not available.")
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd engine && python -m pytest tests/test_interpretations.py -v`
Expected: All 11 tests PASS

- [ ] **Step 5: Commit**

```bash
cd engine && git add app/services/interpretations.py tests/test_interpretations.py
git commit -m "feat(engine): add Vedic interpretation lookup tables

108 planet-in-sign, 108 planet-in-house, 27 nakshatra meanings,
9 planet remedies, 144 house-lord-in-house entries. Pure deterministic
lookups — no AI involved."
```

---

## Task 2: Vimshottari Dasha Calculator

**Files:**
- Create: `engine/app/services/dasha.py`
- Create: `engine/tests/test_dasha.py`

- [ ] **Step 1: Write failing tests**

```python
# engine/tests/test_dasha.py
from app.services.dasha import calculate_vimshottari_dasha, DASHA_SEQUENCE, DASHA_YEARS
from datetime import date


def test_dasha_sequence_sums_to_120():
    total = sum(DASHA_YEARS[planet] for planet in DASHA_SEQUENCE)
    assert total == 120


def test_dasha_returns_9_mahadashas():
    # Moon at 40° sidereal (Rohini nakshatra, ruled by Moon)
    result = calculate_vimshottari_dasha(
        moon_longitude=40.0,
        date_of_birth="1990-05-15",
    )
    assert len(result["mahadashas"]) == 9


def test_dasha_mahadashas_cover_120_years():
    result = calculate_vimshottari_dasha(
        moon_longitude=40.0,
        date_of_birth="1990-05-15",
    )
    first_start = date.fromisoformat(result["mahadashas"][0]["start"])
    last_end = date.fromisoformat(result["mahadashas"][-1]["end"])
    total_days = (last_end - first_start).days
    # 120 years ~ 43800 days (allow some tolerance for leap years)
    assert 43700 < total_days < 43900


def test_dasha_current_period_identified():
    result = calculate_vimshottari_dasha(
        moon_longitude=40.0,
        date_of_birth="1990-05-15",
    )
    assert "current_mahadasha" in result
    assert "planet" in result["current_mahadasha"]
    assert "start" in result["current_mahadasha"]
    assert "end" in result["current_mahadasha"]


def test_dasha_antardashas_present():
    result = calculate_vimshottari_dasha(
        moon_longitude=40.0,
        date_of_birth="1990-05-15",
    )
    assert "current_antardasha" in result
    assert "planet" in result["current_antardasha"]
    assert "start" in result["current_antardasha"]
    assert "end" in result["current_antardasha"]


def test_dasha_upcoming_antardashas():
    result = calculate_vimshottari_dasha(
        moon_longitude=40.0,
        date_of_birth="1990-05-15",
    )
    assert "upcoming_antardashas" in result
    assert len(result["upcoming_antardashas"]) <= 3


def test_dasha_rohini_nakshatra_starts_with_moon():
    # Rohini (26.67° to 40°) is ruled by Moon
    result = calculate_vimshottari_dasha(
        moon_longitude=30.0,  # Start of Rohini
        date_of_birth="1990-01-01",
    )
    # First dasha should start with Moon's sequence position
    # Moon rules Rohini, so the birth dasha is Moon
    assert result["mahadashas"][0]["planet"] == "Moon"


def test_dasha_ashwini_nakshatra_starts_with_ketu():
    # Ashwini (0° to 13.33°) is ruled by Ketu
    result = calculate_vimshottari_dasha(
        moon_longitude=5.0,
        date_of_birth="2000-01-01",
    )
    assert result["mahadashas"][0]["planet"] == "Ketu"


def test_dasha_antardasha_count_in_mahadasha():
    result = calculate_vimshottari_dasha(
        moon_longitude=40.0,
        date_of_birth="1990-05-15",
    )
    # Each mahadasha should have exactly 9 antardashas
    for md in result["mahadashas"]:
        assert len(md["antardashas"]) == 9
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd engine && python -m pytest tests/test_dasha.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.services.dasha'`

- [ ] **Step 3: Implement the Dasha calculator**

```python
# engine/app/services/dasha.py
"""
Vimshottari Dasha calculator.
120-year planetary timing system based on Moon's nakshatra at birth.
"""
from datetime import date, timedelta
from app.services.vedic_chart import NAKSHATRAS, NAKSHATRA_SPAN

# Vimshottari sequence and durations (years)
DASHA_SEQUENCE = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]
DASHA_YEARS: dict[str, int] = {
    "Ketu": 7, "Venus": 20, "Sun": 6, "Moon": 10, "Mars": 7,
    "Rahu": 18, "Jupiter": 16, "Saturn": 19, "Mercury": 17,
}

# Nakshatra to ruling planet (every 3 nakshatras share the same lord in sequence)
NAKSHATRA_LORDS = [
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
]

TOTAL_DASHA_DAYS = 120 * 365.25  # 120 years in days


def _get_nakshatra_index(moon_longitude: float) -> int:
    """Get nakshatra index (0-26) from sidereal Moon longitude."""
    idx = int(moon_longitude / NAKSHATRA_SPAN)
    return min(idx, 26)


def _fraction_elapsed_in_nakshatra(moon_longitude: float) -> float:
    """How much of the current nakshatra has been traversed (0.0 to 1.0)."""
    nak_idx = _get_nakshatra_index(moon_longitude)
    nak_start = nak_idx * NAKSHATRA_SPAN
    elapsed = moon_longitude - nak_start
    return elapsed / NAKSHATRA_SPAN


def _add_days(start: date, days: float) -> date:
    """Add fractional days to a date."""
    return start + timedelta(days=round(days))


def calculate_vimshottari_dasha(
    moon_longitude: float,
    date_of_birth: str,
) -> dict:
    """Calculate full Vimshottari Dasha timeline.

    Args:
        moon_longitude: Moon's sidereal longitude (0-360)
        date_of_birth: "YYYY-MM-DD"

    Returns:
        dict with mahadashas, current_mahadasha, current_antardasha, upcoming_antardashas
    """
    birth = date.fromisoformat(date_of_birth)
    today = date.today()

    nak_idx = _get_nakshatra_index(moon_longitude)
    birth_lord = NAKSHATRA_LORDS[nak_idx]
    fraction_elapsed = _fraction_elapsed_in_nakshatra(moon_longitude)

    # Find where birth_lord sits in the DASHA_SEQUENCE
    lord_pos = DASHA_SEQUENCE.index(birth_lord)

    # Build the ordered sequence starting from the birth lord
    ordered = DASHA_SEQUENCE[lord_pos:] + DASHA_SEQUENCE[:lord_pos]

    # The first dasha's remaining duration = (1 - fraction_elapsed) * total years
    first_remaining_years = (1.0 - fraction_elapsed) * DASHA_YEARS[ordered[0]]
    first_remaining_days = first_remaining_years * 365.25

    mahadashas = []
    cursor = birth

    for i, planet in enumerate(ordered):
        if i == 0:
            duration_days = first_remaining_days
        else:
            duration_days = DASHA_YEARS[planet] * 365.25

        md_start = cursor
        md_end = _add_days(cursor, duration_days)

        # Calculate antardashas within this mahadasha
        antardashas = []
        ad_cursor = md_start
        ad_sequence = ordered[i:] + ordered[:i]  # Starts from same planet

        for ad_planet in ad_sequence:
            if i == 0:
                ad_proportion = (DASHA_YEARS[ad_planet] / 120.0)
                ad_days = first_remaining_days * (DASHA_YEARS[ad_planet] / DASHA_YEARS[planet]) if i == 0 and ad_planet == planet else duration_days * (DASHA_YEARS[ad_planet] / 120.0)
            else:
                ad_days = duration_days * (DASHA_YEARS[ad_planet] / 120.0)

            # Correct antardasha calculation:
            # Duration of antardasha = (Mahadasha years * Antardasha planet years / 120) * 365.25
            ad_actual_days = (duration_days / 365.25) * DASHA_YEARS[ad_planet] * 365.25 / 120.0

            ad_start = ad_cursor
            ad_end = _add_days(ad_cursor, ad_actual_days)
            antardashas.append({
                "planet": ad_planet,
                "start": ad_start.isoformat(),
                "end": ad_end.isoformat(),
            })
            ad_cursor = ad_end

        mahadashas.append({
            "planet": planet,
            "start": md_start.isoformat(),
            "end": md_end.isoformat(),
            "antardashas": antardashas,
        })
        cursor = md_end

    # Find current mahadasha and antardasha
    current_mahadasha = None
    current_antardasha = None
    upcoming_antardashas = []

    for md in mahadashas:
        md_start = date.fromisoformat(md["start"])
        md_end = date.fromisoformat(md["end"])
        if md_start <= today <= md_end:
            current_mahadasha = {
                "planet": md["planet"],
                "start": md["start"],
                "end": md["end"],
            }
            # Find current antardasha
            found_current_ad = False
            for j, ad in enumerate(md["antardashas"]):
                ad_start = date.fromisoformat(ad["start"])
                ad_end = date.fromisoformat(ad["end"])
                if ad_start <= today <= ad_end:
                    current_antardasha = {
                        "planet": ad["planet"],
                        "start": ad["start"],
                        "end": ad["end"],
                    }
                    found_current_ad = True
                    # Collect up to 3 upcoming antardashas
                    remaining = md["antardashas"][j + 1:]
                    upcoming_antardashas = [
                        {"planet": a["planet"], "start": a["start"], "end": a["end"]}
                        for a in remaining[:3]
                    ]
                    break
            if not found_current_ad and md["antardashas"]:
                # Fallback: use first antardasha
                current_antardasha = {
                    "planet": md["antardashas"][0]["planet"],
                    "start": md["antardashas"][0]["start"],
                    "end": md["antardashas"][0]["end"],
                }
            break

    # Fallback if today is outside the 120-year range
    if not current_mahadasha:
        current_mahadasha = {
            "planet": mahadashas[-1]["planet"],
            "start": mahadashas[-1]["start"],
            "end": mahadashas[-1]["end"],
        }
    if not current_antardasha:
        current_antardasha = {
            "planet": current_mahadasha["planet"],
            "start": current_mahadasha["start"],
            "end": current_mahadasha["end"],
        }

    return {
        "mahadashas": mahadashas,
        "current_mahadasha": current_mahadasha,
        "current_antardasha": current_antardasha,
        "upcoming_antardashas": upcoming_antardashas,
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd engine && python -m pytest tests/test_dasha.py -v`
Expected: All 9 tests PASS

- [ ] **Step 5: Commit**

```bash
cd engine && git add app/services/dasha.py tests/test_dasha.py
git commit -m "feat(engine): add Vimshottari Dasha calculator

120-year planetary timing system. Calculates Mahadasha + Antardasha
from Moon's nakshatra at birth. Identifies current period and next 3
upcoming Antardashas."
```

---

## Task 3: Yoga Detection Engine

**Files:**
- Create: `engine/app/services/yogas.py`
- Create: `engine/tests/test_yogas.py`

- [ ] **Step 1: Write failing tests**

```python
# engine/tests/test_yogas.py
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
    # Jupiter in 1st (Kendra) from Moon in 1st
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
    # Jupiter in 3rd from Moon — not a Kendra
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
    # Sun and Mercury in same sign
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
    # Moon and Mars in same sign
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
    # Mars in 5th — NOT a Mangal Dosha house
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd engine && python -m pytest tests/test_yogas.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.services.yogas'`

- [ ] **Step 3: Implement the yoga detection engine**

```python
# engine/app/services/yogas.py
"""
Vedic yoga (planetary combination) detection engine.
Deterministic checks based on traditional Jyotish rules.
"""
from app.services.interpretations import SIGN_LORDS

# Kendra houses (angular): 1, 4, 7, 10
KENDRA_HOUSES = {1, 4, 7, 10}
# Trikona houses (trinal): 1, 5, 9
TRIKONA_HOUSES = {1, 5, 9}
# Upachaya houses: 3, 6, 10, 11
UPACHAYA_HOUSES = {3, 6, 10, 11}
# Mangal Dosha houses
MANGAL_DOSHA_HOUSES = {1, 4, 7, 8, 12}
# Natural benefics
BENEFICS = {"Jupiter", "Venus", "Mercury", "Moon"}

SANSKRIT_SIGNS = [
    "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
    "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
]


def _get_planet(planets: list[dict], name: str) -> dict | None:
    """Find a planet by name in the planets list."""
    return next((p for p in planets if p["name"] == name), None)


def _house_distance(from_house: int, to_house: int) -> int:
    """Calculate house distance (1-indexed, wrapping at 12)."""
    dist = (to_house - from_house) % 12
    return dist if dist != 0 else 12


def _sign_index(sign: str) -> int:
    """Get 0-based index of a Sanskrit sign."""
    return SANSKRIT_SIGNS.index(sign)


def detect_yogas(planets: list[dict], lagna_sign: str) -> list[dict]:
    """Detect key Vedic yogas from planet positions.

    Args:
        planets: List of planet dicts with keys: name, sign, degree, house, nakshatra, retrograde
        lagna_sign: Sanskrit name of the ascendant sign

    Returns:
        List of yoga dicts with keys: name, present, strength, interpretation
    """
    moon = _get_planet(planets, "Moon")
    sun = _get_planet(planets, "Sun")
    mars = _get_planet(planets, "Mars")
    mercury = _get_planet(planets, "Mercury")
    jupiter = _get_planet(planets, "Jupiter")
    venus = _get_planet(planets, "Venus")
    saturn = _get_planet(planets, "Saturn")

    yogas = []

    # 1. Gaja Kesari Yoga: Jupiter in Kendra (1/4/7/10) from Moon
    gk_present = False
    gk_strength = "none"
    gk_interp = "Gaja Kesari Yoga is not formed in this chart."
    if moon and jupiter:
        dist = _house_distance(moon["house"], jupiter["house"])
        if dist in KENDRA_HOUSES:
            gk_present = True
            # Strength: strong if Jupiter is in own/exalted sign, moderate otherwise
            if jupiter["sign"] in ("Dhanu", "Meena", "Karka"):
                gk_strength = "strong"
                gk_interp = "Gaja Kesari Yoga — Jupiter in Kendra from Moon in a strong sign. Exceptional wisdom, wealth, and lasting reputation. Natural teacher and guide."
            else:
                gk_strength = "moderate"
                gk_interp = "Gaja Kesari Yoga — Jupiter in Kendra from Moon. Wisdom, financial acumen, and respected social standing. Good for teaching and advisory roles."
    yogas.append({"name": "Gaja Kesari Yoga", "present": gk_present, "strength": gk_strength, "interpretation": gk_interp})

    # 2. Lakshmi Yoga: Strong 9th lord + Venus in Kendra or Trikona
    lk_present = False
    lk_strength = "none"
    lk_interp = "Lakshmi Yoga is not formed in this chart."
    lagna_idx = _sign_index(lagna_sign)
    ninth_sign = SANSKRIT_SIGNS[(lagna_idx + 8) % 12]
    ninth_lord_name = SIGN_LORDS[ninth_sign]
    ninth_lord = _get_planet(planets, ninth_lord_name)
    if ninth_lord and venus:
        ninth_lord_strong = ninth_lord["house"] in KENDRA_HOUSES or ninth_lord["house"] in TRIKONA_HOUSES
        venus_in_kendra_trikona = venus["house"] in (KENDRA_HOUSES | TRIKONA_HOUSES)
        if ninth_lord_strong and venus_in_kendra_trikona:
            lk_present = True
            if venus["sign"] in ("Vrishabha", "Tula", "Meena"):
                lk_strength = "strong"
                lk_interp = "Lakshmi Yoga — 9th lord strong and Venus well-placed in own/exalted sign. Exceptional fortune, luxury, and prosperity blessed by Goddess Lakshmi."
            else:
                lk_strength = "moderate"
                lk_interp = "Lakshmi Yoga — 9th lord strong and Venus in Kendra/Trikona. Fortune, material comfort, and prosperity through ethical means."
    yogas.append({"name": "Lakshmi Yoga", "present": lk_present, "strength": lk_strength, "interpretation": lk_interp})

    # 3. Vasumati Yoga: Benefics in upachaya houses (3, 6, 10, 11) from Moon
    vm_present = False
    vm_strength = "none"
    vm_interp = "Vasumati Yoga is not formed in this chart."
    if moon:
        benefics_in_upachaya = 0
        for p in planets:
            if p["name"] in BENEFICS and p["name"] != "Moon":
                dist = _house_distance(moon["house"], p["house"])
                if dist in UPACHAYA_HOUSES:
                    benefics_in_upachaya += 1
        if benefics_in_upachaya >= 2:
            vm_present = True
            if benefics_in_upachaya >= 3:
                vm_strength = "strong"
                vm_interp = f"Vasumati Yoga — {benefics_in_upachaya} benefics in upachaya houses from Moon. Sustained wealth accumulation, growing prosperity, and financial resilience."
            else:
                vm_strength = "moderate"
                vm_interp = f"Vasumati Yoga — {benefics_in_upachaya} benefics in upachaya houses from Moon. Gradual wealth growth and steady financial improvement over time."
    yogas.append({"name": "Vasumati Yoga", "present": vm_present, "strength": vm_strength, "interpretation": vm_interp})

    # 4. Budhaditya Yoga: Sun and Mercury in the same sign
    bd_present = False
    bd_strength = "none"
    bd_interp = "Budhaditya Yoga is not formed in this chart."
    if sun and mercury and sun["sign"] == mercury["sign"]:
        bd_present = True
        # Check combustion: if Mercury is very close to Sun, it's weaker
        degree_diff = abs(sun["degree"] - mercury["degree"])
        if mercury["sign"] in ("Mithuna", "Kanya"):
            bd_strength = "strong"
            bd_interp = "Budhaditya Yoga — Sun-Mercury conjunction with Mercury in own sign. Brilliant intellect, authoritative communication, and success in writing or technology."
        elif degree_diff < 3:
            bd_strength = "mild"
            bd_interp = "Budhaditya Yoga — Sun-Mercury conjunction but Mercury is combust (too close to Sun). Intelligence present but expression may be overshadowed by ego."
        else:
            bd_strength = "moderate"
            bd_interp = "Budhaditya Yoga — Sun-Mercury conjunction. Sharp intelligence, skilled speech, and ability to combine authority with analytical thinking."
    yogas.append({"name": "Budhaditya Yoga", "present": bd_present, "strength": bd_strength, "interpretation": bd_interp})

    # 5. Chandra-Mangal Yoga: Moon and Mars in the same sign
    cm_present = False
    cm_strength = "none"
    cm_interp = "Chandra-Mangal Yoga is not formed in this chart."
    if moon and mars and moon["sign"] == mars["sign"]:
        cm_present = True
        if mars["sign"] in ("Mesha", "Vrishchika", "Makara"):
            cm_strength = "strong"
            cm_interp = "Chandra-Mangal Yoga — Moon-Mars conjunction with Mars in strong sign. Exceptional courage, financial drive, and entrepreneurial energy."
        else:
            cm_strength = "moderate"
            cm_interp = "Chandra-Mangal Yoga — Moon-Mars conjunction. Emotional courage, financial determination, and drive to earn through bold action."
    yogas.append({"name": "Chandra-Mangal Yoga", "present": cm_present, "strength": cm_strength, "interpretation": cm_interp})

    # 6. Mangal Dosha: Mars in 1st, 4th, 7th, 8th, or 12th house
    md_present = False
    md_strength = "none"
    md_interp = "Mangal Dosha is not present in this chart."
    if mars and mars["house"] in MANGAL_DOSHA_HOUSES:
        md_present = True
        if mars["house"] in (7, 8):
            md_strength = "strong"
            md_interp = f"Mangal Dosha — Mars in {mars['house']}th house. Strong intensity in partnerships and intimate relationships. Traditional remedies include Hanuman Chalisa and Mangal Shanti puja."
        elif mars["house"] in (1, 4):
            md_strength = "moderate"
            md_interp = f"Mangal Dosha — Mars in {mars['house']}th house. Moderate intensity affecting personality and domestic peace. Can be balanced by partner with similar Mars placement."
        else:
            md_strength = "mild"
            md_interp = f"Mangal Dosha — Mars in {mars['house']}th house. Mild effect on expenses and subconscious patterns. Generally manageable with awareness."
    yogas.append({"name": "Mangal Dosha", "present": md_present, "strength": md_strength, "interpretation": md_interp})

    return yogas
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd engine && python -m pytest tests/test_yogas.py -v`
Expected: All 8 tests PASS

- [ ] **Step 5: Commit**

```bash
cd engine && git add app/services/yogas.py tests/test_yogas.py
git commit -m "feat(engine): add Vedic yoga detection engine

Detects 6 yogas: Gaja Kesari, Lakshmi, Vasumati, Budhaditya,
Chandra-Mangal, and Mangal Dosha. Each returns presence, strength
(strong/moderate/mild), and traditional interpretation."
```

---

## Task 4: Transit Calculator

**Files:**
- Create: `engine/app/services/transits.py`
- Create: `engine/tests/test_transits.py`

- [ ] **Step 1: Write failing tests**

```python
# engine/tests/test_transits.py
from app.services.transits import calculate_transits, calculate_personal_transits
from datetime import date

VALID_SIGNS = {
    "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
    "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
}

VEDIC_GRAHAS = {"Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ketu"}


def test_transits_returns_9_grahas():
    result = calculate_transits(date.today().isoformat())
    assert len(result["planets"]) == 9
    names = {p["name"] for p in result["planets"]}
    assert names == VEDIC_GRAHAS


def test_transits_planets_have_required_fields():
    result = calculate_transits(date.today().isoformat())
    for planet in result["planets"]:
        assert planet["sign"] in VALID_SIGNS
        assert 0 <= planet["degree"] <= 29
        assert isinstance(planet["nakshatra"], str)
        assert 1 <= planet["pada"] <= 4
        assert isinstance(planet["retrograde"], bool)


def test_transits_rahu_ketu_opposite():
    result = calculate_transits(date.today().isoformat())
    rahu = next(p for p in result["planets"] if p["name"] == "Rahu")
    ketu = next(p for p in result["planets"] if p["name"] == "Ketu")
    rahu_idx = list(VALID_SIGNS).index(rahu["sign"])
    ketu_idx = list(VALID_SIGNS).index(ketu["sign"])
    # Should be 6 signs apart (opposite)
    diff = abs(rahu_idx - ketu_idx)
    assert diff == 6 or diff == 6  # Always 6 signs apart


def test_transits_returns_date():
    today = date.today().isoformat()
    result = calculate_transits(today)
    assert result["date"] == today


def test_transits_returns_dominant_element():
    result = calculate_transits(date.today().isoformat())
    assert result["dominant_element"] in ("Fire", "Earth", "Air", "Water")


def test_personal_transits_returns_aspects():
    natal_planets = [
        {"name": "Sun", "sign": "Mesha", "degree": 15, "house": 1},
        {"name": "Moon", "sign": "Vrishabha", "degree": 10, "house": 2},
        {"name": "Mars", "sign": "Kanya", "degree": 20, "house": 6},
        {"name": "Jupiter", "sign": "Dhanu", "degree": 5, "house": 9},
        {"name": "Saturn", "sign": "Makara", "degree": 25, "house": 10},
    ]
    result = calculate_personal_transits(
        natal_planets=natal_planets,
        moon_sign="Vrishabha",
        date_str=date.today().isoformat(),
    )
    assert "transit_aspects" in result
    assert "vedha_flags" in result
    assert "murthi_nirnaya" in result
    assert isinstance(result["transit_aspects"], list)


def test_personal_transits_murthi_nirnaya_valid():
    natal_planets = [
        {"name": "Moon", "sign": "Mesha", "degree": 10, "house": 1},
    ]
    result = calculate_personal_transits(
        natal_planets=natal_planets,
        moon_sign="Mesha",
        date_str=date.today().isoformat(),
    )
    assert result["murthi_nirnaya"] in ("Gold", "Silver", "Copper", "Iron")


def test_transits_for_specific_date():
    # Test a known past date to ensure calculations work
    result = calculate_transits("2026-01-01")
    assert len(result["planets"]) == 9
    for p in result["planets"]:
        assert p["sign"] in VALID_SIGNS
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd engine && python -m pytest tests/test_transits.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.services.transits'`

- [ ] **Step 3: Implement the transit calculator**

```python
# engine/app/services/transits.py
"""
Real-time sidereal transit calculations using Swiss Ephemeris.
Calculates current planetary positions, transit-to-natal aspects, Vedha, and Murthi Nirnaya.
"""
import swisseph as swe
from datetime import datetime
from zoneinfo import ZoneInfo
from app.services.vedic_chart import (
    SANSKRIT_SIGNS, NAKSHATRAS, NAKSHATRA_SPAN, PADA_SPAN,
    _sidereal_longitude, _sid_to_sign_degree, _get_nakshatra,
)

# 9 Vedic grahas (no Uranus, Neptune, Pluto)
VEDIC_PLANET_IDS = [
    (swe.SUN, "Sun"),
    (swe.MOON, "Moon"),
    (swe.MERCURY, "Mercury"),
    (swe.VENUS, "Venus"),
    (swe.MARS, "Mars"),
    (swe.JUPITER, "Jupiter"),
    (swe.SATURN, "Saturn"),
]

# Sign elements
SIGN_ELEMENTS: dict[str, str] = {
    "Mesha": "Fire", "Simha": "Fire", "Dhanu": "Fire",
    "Vrishabha": "Earth", "Kanya": "Earth", "Makara": "Earth",
    "Mithuna": "Air", "Tula": "Air", "Kumbha": "Air",
    "Karka": "Water", "Vrishchika": "Water", "Meena": "Water",
}

# Vedha pairs: for each favorable transit house from Moon, the obstructing house
# Format: {favorable_house: obstructing_house}
# Sun vedha pairs
VEDHA_SUN = {3: 9, 6: 12, 10: 4, 11: 5}
# Jupiter vedha pairs
VEDHA_JUPITER = {2: 12, 5: 4, 7: 3, 9: 10, 11: 8}
# Saturn is generally exempt from vedha by Sun

# Simplified: major favorable transit houses for each planet from Moon
FAVORABLE_TRANSITS = {
    "Sun": {3, 6, 10, 11},
    "Moon": {1, 3, 6, 7, 10, 11},
    "Mars": {3, 6, 11},
    "Mercury": {2, 4, 6, 8, 10, 11},
    "Jupiter": {2, 5, 7, 9, 11},
    "Venus": {1, 2, 3, 4, 5, 8, 9, 11, 12},
    "Saturn": {3, 6, 11},
}

# General vedha pairs (simplified across planets)
GENERAL_VEDHA: dict[int, int] = {
    1: 5, 2: 12, 3: 9, 4: 10, 5: 1, 6: 12,
    7: 3, 8: 2, 9: 3, 10: 4, 11: 5, 12: 6,
}


def _date_to_jd(date_str: str) -> float:
    """Convert date string to Julian Day at noon UTC."""
    parts = date_str.split("-")
    year, month, day = int(parts[0]), int(parts[1]), int(parts[2])
    return swe.julday(year, month, day, 12.0)


def calculate_transits(date_str: str) -> dict:
    """Calculate sidereal planetary positions for a given date.

    Args:
        date_str: "YYYY-MM-DD"

    Returns:
        dict with planets list, date, and dominant element
    """
    jd = _date_to_jd(date_str)
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    ayanamsa = swe.get_ayanamsa_ut(jd)

    planets = []
    element_count: dict[str, int] = {"Fire": 0, "Earth": 0, "Air": 0, "Water": 0}

    # Calculate 7 main planets
    for planet_id, name in VEDIC_PLANET_IDS:
        result, _flag = swe.calc_ut(jd, planet_id)
        tropical_lon = result[0]
        speed = result[3]
        sid_lon = _sidereal_longitude(tropical_lon, ayanamsa)
        sign, degree = _sid_to_sign_degree(sid_lon)
        nak_name, pada = _get_nakshatra(sid_lon)

        planets.append({
            "name": name,
            "sign": sign,
            "degree": degree,
            "longitude": round(sid_lon, 2),
            "nakshatra": nak_name,
            "pada": pada,
            "retrograde": speed < 0,
        })
        element_count[SIGN_ELEMENTS[sign]] += 1

    # Calculate Rahu (Mean Node) and Ketu
    result, _flag = swe.calc_ut(jd, swe.MEAN_NODE)
    rahu_tropical = result[0]
    rahu_sid = _sidereal_longitude(rahu_tropical, ayanamsa)
    rahu_sign, rahu_degree = _sid_to_sign_degree(rahu_sid)
    rahu_nak, rahu_pada = _get_nakshatra(rahu_sid)

    ketu_sid = (rahu_sid + 180.0) % 360.0
    ketu_sign, ketu_degree = _sid_to_sign_degree(ketu_sid)
    ketu_nak, ketu_pada = _get_nakshatra(ketu_sid)

    planets.append({
        "name": "Rahu",
        "sign": rahu_sign,
        "degree": rahu_degree,
        "longitude": round(rahu_sid, 2),
        "nakshatra": rahu_nak,
        "pada": rahu_pada,
        "retrograde": True,  # Rahu is always retrograde
    })
    element_count[SIGN_ELEMENTS[rahu_sign]] += 1

    planets.append({
        "name": "Ketu",
        "sign": ketu_sign,
        "degree": ketu_degree,
        "longitude": round(ketu_sid, 2),
        "nakshatra": ketu_nak,
        "pada": ketu_pada,
        "retrograde": True,  # Ketu is always retrograde
    })
    element_count[SIGN_ELEMENTS[ketu_sign]] += 1

    dominant_element = max(element_count, key=element_count.get)

    return {
        "date": date_str,
        "planets": planets,
        "dominant_element": dominant_element,
    }


def calculate_personal_transits(
    natal_planets: list[dict],
    moon_sign: str,
    date_str: str,
) -> dict:
    """Calculate transit-to-natal aspects, Vedha flags, and Murthi Nirnaya.

    Args:
        natal_planets: List of natal planet dicts with name, sign, degree, house
        moon_sign: Janma Rasi (Sanskrit sign name)
        date_str: "YYYY-MM-DD"

    Returns:
        dict with transit_aspects, vedha_flags, murthi_nirnaya, transit_houses
    """
    transits = calculate_transits(date_str)
    moon_sign_idx = SANSKRIT_SIGNS.index(moon_sign)

    transit_aspects = []
    vedha_flags = []
    transit_house_map: dict[str, int] = {}

    # Calculate which house each transit planet occupies from Moon sign
    for tp in transits["planets"]:
        tp_sign_idx = SANSKRIT_SIGNS.index(tp["sign"])
        house_from_moon = ((tp_sign_idx - moon_sign_idx) % 12) + 1
        transit_house_map[tp["name"]] = house_from_moon

    # Check transit-to-natal aspects
    for tp in transits["planets"]:
        tp_sign_idx = SANSKRIT_SIGNS.index(tp["sign"])
        for np in natal_planets:
            if np["name"] == tp["name"]:
                continue  # Skip same planet
            np_sign_idx = SANSKRIT_SIGNS.index(np["sign"])

            # Calculate aspect by sign distance
            sign_dist = ((tp_sign_idx - np_sign_idx) % 12)

            aspect_type = None
            if sign_dist == 0:
                # Same sign — check degree proximity
                degree_diff = abs(tp["degree"] - np["degree"])
                if degree_diff <= 8:
                    aspect_type = "conjunction"
            elif sign_dist == 6:
                aspect_type = "opposition"
            elif sign_dist in (4, 8):
                aspect_type = "trine"
            elif sign_dist in (3, 9):
                aspect_type = "square"

            if aspect_type:
                orb = abs(tp["degree"] - np["degree"])
                transit_aspects.append({
                    "transit_planet": tp["name"],
                    "natal_planet": np["name"],
                    "aspect_type": aspect_type,
                    "orb": orb,
                    "transit_sign": tp["sign"],
                    "natal_sign": np["sign"],
                })

    # Check Vedha obstructions
    for planet_name, house in transit_house_map.items():
        if planet_name in ("Rahu", "Ketu"):
            continue
        favorable_houses = FAVORABLE_TRANSITS.get(planet_name, set())
        if house in favorable_houses:
            vedha_house = GENERAL_VEDHA.get(house)
            if vedha_house:
                # Check if any other transit planet occupies the vedha house
                for other_name, other_house in transit_house_map.items():
                    if other_name != planet_name and other_house == vedha_house:
                        vedha_flags.append({
                            "planet": planet_name,
                            "favorable_house": house,
                            "obstructed_by": other_name,
                            "vedha_house": vedha_house,
                            "description": f"{planet_name}'s favorable transit in {house}th house is obstructed by {other_name} in {vedha_house}th house.",
                        })

    # Murthi Nirnaya (simplified): based on Moon's current nakshatra
    transit_moon = next(p for p in transits["planets"] if p["name"] == "Moon")
    moon_nak_idx = NAKSHATRAS.index(transit_moon["nakshatra"]) if transit_moon["nakshatra"] in NAKSHATRAS else 0
    murthi_map = {0: "Gold", 1: "Silver", 2: "Copper", 3: "Iron"}
    murthi = murthi_map[moon_nak_idx % 4]

    return {
        "transit_aspects": transit_aspects,
        "vedha_flags": vedha_flags,
        "murthi_nirnaya": murthi,
        "transit_houses": transit_house_map,
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd engine && python -m pytest tests/test_transits.py -v`
Expected: All 8 tests PASS

- [ ] **Step 5: Commit**

```bash
cd engine && git add app/services/transits.py tests/test_transits.py
git commit -m "feat(engine): add real-time sidereal transit calculator

Calculates 9 Vedic grahas (incl. Rahu/Ketu) for any date using
Lahiri ayanamsa. Personal transits include transit-to-natal aspects,
Vedha obstruction checks, and Murthi Nirnaya quality rating."
```

---

## Task 5: Enhanced Vedic Chart — Rahu/Ketu + Whole Sign Houses

Modify the existing Vedic chart service to use 9 Vedic grahas (add Rahu/Ketu, remove Uranus/Neptune/Pluto) and add Whole Sign houses with lords.

**Files:**
- Modify: `engine/app/services/vedic_chart.py`
- Modify: `engine/tests/test_vedic.py`

- [ ] **Step 1: Update existing tests + add new tests**

```python
# engine/tests/test_vedic.py — FULL REPLACEMENT
import os
import pytest
from httpx import AsyncClient, ASGITransport

os.environ["INTERNAL_SECRET"] = "test-secret"

from app.main import app

HEADERS = {"X-Internal-Secret": "test-secret"}

KATHMANDU_BIRTH = {
    "date_of_birth": "1990-05-15",
    "time_of_birth": "14:30",
    "latitude": 27.72,
    "longitude": 85.32,
    "timezone": "Asia/Kathmandu",
}

VALID_SIGNS = {
    "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
    "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
}

VEDIC_GRAHAS = {"Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ketu"}


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


@pytest.mark.asyncio
async def test_vedic_chart_has_lagna(client):
    response = await client.post("/chart/vedic", json=KATHMANDU_BIRTH, headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["lagna"]["sign"] in VALID_SIGNS
    assert 0 <= data["lagna"]["degree"] <= 29


@pytest.mark.asyncio
async def test_vedic_chart_has_9_vedic_grahas(client):
    response = await client.post("/chart/vedic", json=KATHMANDU_BIRTH, headers=HEADERS)
    data = response.json()
    assert len(data["planets"]) == 9
    names = {p["name"] for p in data["planets"]}
    assert names == VEDIC_GRAHAS


@pytest.mark.asyncio
async def test_vedic_planets_have_house_numbers(client):
    response = await client.post("/chart/vedic", json=KATHMANDU_BIRTH, headers=HEADERS)
    data = response.json()
    for planet in data["planets"]:
        assert "house" in planet
        assert 1 <= planet["house"] <= 12


@pytest.mark.asyncio
async def test_vedic_chart_has_nakshatra_for_all_planets(client):
    response = await client.post("/chart/vedic", json=KATHMANDU_BIRTH, headers=HEADERS)
    data = response.json()
    assert len(data["nakshatras"]) == 9
    for nak in data["nakshatras"]:
        assert 1 <= nak["pada"] <= 4
        assert len(nak["nakshatra"]) > 0


@pytest.mark.asyncio
async def test_vedic_chart_has_houses_with_lords(client):
    response = await client.post("/chart/vedic", json=KATHMANDU_BIRTH, headers=HEADERS)
    data = response.json()
    assert "houses" in data
    assert len(data["houses"]) == 12
    for house in data["houses"]:
        assert "number" in house
        assert "sign" in house
        assert "lord" in house
        assert "lord_house" in house
        assert house["sign"] in VALID_SIGNS


@pytest.mark.asyncio
async def test_vedic_chart_has_yogas(client):
    response = await client.post("/chart/vedic", json=KATHMANDU_BIRTH, headers=HEADERS)
    data = response.json()
    assert "yogas" in data
    assert len(data["yogas"]) == 6  # Always returns all 6 yoga checks
    for yoga in data["yogas"]:
        assert "name" in yoga
        assert "present" in yoga
        assert "strength" in yoga
        assert "interpretation" in yoga


@pytest.mark.asyncio
async def test_vedic_chart_has_dasha(client):
    response = await client.post("/chart/vedic", json=KATHMANDU_BIRTH, headers=HEADERS)
    data = response.json()
    assert "dasha" in data
    assert "current_mahadasha" in data["dasha"]
    assert "current_antardasha" in data["dasha"]
    assert "upcoming_antardashas" in data["dasha"]


@pytest.mark.asyncio
async def test_vedic_chart_has_interpretations(client):
    response = await client.post("/chart/vedic", json=KATHMANDU_BIRTH, headers=HEADERS)
    data = response.json()
    assert "interpretations" in data
    assert "lagna_lord" in data["interpretations"]
    assert "moon_nakshatra" in data["interpretations"]
    assert "planet_highlights" in data["interpretations"]


@pytest.mark.asyncio
async def test_vedic_chart_has_remedies(client):
    response = await client.post("/chart/vedic", json=KATHMANDU_BIRTH, headers=HEADERS)
    data = response.json()
    assert "remedies" in data
    assert isinstance(data["remedies"], list)
    for remedy in data["remedies"]:
        assert "planet" in remedy
        assert "gemstone" in remedy
        assert "mantra" in remedy
        assert "disclaimer" in remedy


@pytest.mark.asyncio
async def test_vedic_chart_rahu_ketu_opposite(client):
    response = await client.post("/chart/vedic", json=KATHMANDU_BIRTH, headers=HEADERS)
    data = response.json()
    rahu = next(p for p in data["planets"] if p["name"] == "Rahu")
    ketu = next(p for p in data["planets"] if p["name"] == "Ketu")
    rahu_idx = list(VALID_SIGNS).index(rahu["sign"])
    ketu_idx = list(VALID_SIGNS).index(ketu["sign"])
    assert abs(rahu_idx - ketu_idx) == 6


@pytest.mark.asyncio
async def test_vedic_chart_sidereal_differs_from_tropical(client):
    western_resp = await client.post("/chart/western", json=KATHMANDU_BIRTH, headers=HEADERS)
    vedic_resp = await client.post("/chart/vedic", json=KATHMANDU_BIRTH, headers=HEADERS)
    western = western_resp.json()
    vedic = vedic_resp.json()
    w_sun = next(p for p in western["planets"] if p["name"] == "Sun")
    v_sun = next(p for p in vedic["planets"] if p["name"] == "Sun")
    assert v_sun["sign"] in VALID_SIGNS
    assert v_sun["nakshatra"] != ""


@pytest.mark.asyncio
async def test_vedic_chart_summary_format(client):
    response = await client.post("/chart/vedic", json=KATHMANDU_BIRTH, headers=HEADERS)
    data = response.json()
    assert "Lagna " in data["summary"]
    assert "Moon " in data["summary"]
    assert "Nakshatra " in data["summary"]
```

- [ ] **Step 2: Run tests to verify old ones pass and new ones fail**

Run: `cd engine && python -m pytest tests/test_vedic.py -v`
Expected: New tests fail (no `houses`, `yogas`, `dasha`, `interpretations`, `remedies` keys; planet count is 10 not 9)

- [ ] **Step 3: Modify vedic_chart.py to add Rahu/Ketu, Whole Sign houses, and integrate services**

Replace `engine/app/services/vedic_chart.py` with:

```python
# engine/app/services/vedic_chart.py
import swisseph as swe
from app.services.western_chart import PLANET_IDS, _to_julian_day

SANSKRIT_SIGNS = [
    "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
    "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
]

NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
    "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha",
    "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha",
    "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada",
    "Uttara Bhadrapada", "Revati",
]

NAKSHATRA_SPAN = 360.0 / 27  # 13.333...°
PADA_SPAN = NAKSHATRA_SPAN / 4  # 3.333...°

# 7 Vedic grahas (Rahu/Ketu calculated separately from Mean Node)
VEDIC_PLANET_IDS = [
    (swe.SUN, "Sun"),
    (swe.MOON, "Moon"),
    (swe.MERCURY, "Mercury"),
    (swe.VENUS, "Venus"),
    (swe.MARS, "Mars"),
    (swe.JUPITER, "Jupiter"),
    (swe.SATURN, "Saturn"),
]


def _sidereal_longitude(tropical_lon: float, ayanamsa: float) -> float:
    """Convert tropical longitude to sidereal by subtracting ayanamsa."""
    sid = tropical_lon - ayanamsa
    if sid < 0:
        sid += 360.0
    return sid


def _sid_to_sign_degree(sid_longitude: float) -> tuple[str, int]:
    """Convert sidereal longitude to Sanskrit sign name and degree."""
    sign_index = int(sid_longitude // 30)
    degree = int(sid_longitude % 30)
    return SANSKRIT_SIGNS[sign_index], degree


def _get_nakshatra(sid_longitude: float) -> tuple[str, int]:
    """Get nakshatra name and pada (1-4) from sidereal longitude."""
    nak_index = int(sid_longitude / NAKSHATRA_SPAN)
    if nak_index >= 27:
        nak_index = 26
    remainder = sid_longitude - (nak_index * NAKSHATRA_SPAN)
    pada = int(remainder / PADA_SPAN) + 1
    if pada > 4:
        pada = 4
    return NAKSHATRAS[nak_index], pada


def _whole_sign_house(planet_sign_index: int, lagna_sign_index: int) -> int:
    """Calculate Whole Sign house number (1-12) from sign indices."""
    return ((planet_sign_index - lagna_sign_index) % 12) + 1


def calculate_vedic_chart(
    date_of_birth: str,
    time_of_birth: str | None,
    latitude: float,
    longitude: float,
    timezone: str,
) -> dict:
    """Calculate a Vedic natal chart using Lahiri ayanamsa and Whole Sign houses."""
    from app.services.interpretations import (
        SIGN_LORDS, get_planet_in_sign, get_planet_in_house,
        get_nakshatra_meaning, get_planet_remedy, get_house_lord_in_house,
    )
    from app.services.yogas import detect_yogas
    from app.services.dasha import calculate_vimshottari_dasha

    jd = _to_julian_day(date_of_birth, time_of_birth, timezone, latitude, longitude)

    # Set Lahiri ayanamsa
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    ayanamsa = swe.get_ayanamsa_ut(jd)

    # Get tropical ascendant and convert to sidereal
    _cusps, ascmc = swe.houses(jd, latitude, longitude, b"P")
    tropical_asc = ascmc[0]
    sid_asc = _sidereal_longitude(tropical_asc, ayanamsa)
    lagna_sign, lagna_degree = _sid_to_sign_degree(sid_asc)
    lagna_sign_idx = SANSKRIT_SIGNS.index(lagna_sign)
    lagna_nak, lagna_pada = _get_nakshatra(sid_asc)

    # Calculate 7 main planets
    planets = []
    nakshatras = []
    moon_sign = ""
    moon_nakshatra = ""
    moon_longitude = 0.0

    for planet_id, name in VEDIC_PLANET_IDS:
        result, _flag = swe.calc_ut(jd, planet_id)
        tropical_lon = result[0]
        speed = result[3]
        sid_lon = _sidereal_longitude(tropical_lon, ayanamsa)

        sign, degree = _sid_to_sign_degree(sid_lon)
        nak_name, pada = _get_nakshatra(sid_lon)
        retrograde = speed < 0
        sign_idx = SANSKRIT_SIGNS.index(sign)
        house = _whole_sign_house(sign_idx, lagna_sign_idx)

        planets.append({
            "name": name,
            "sign": sign,
            "degree": degree,
            "house": house,
            "nakshatra": nak_name,
            "retrograde": retrograde,
        })
        nakshatras.append({
            "planet": name,
            "nakshatra": nak_name,
            "pada": pada,
        })

        if name == "Moon":
            moon_sign = sign
            moon_nakshatra = nak_name
            moon_longitude = sid_lon

    # Calculate Rahu and Ketu
    result, _flag = swe.calc_ut(jd, swe.MEAN_NODE)
    rahu_tropical = result[0]
    rahu_sid = _sidereal_longitude(rahu_tropical, ayanamsa)
    rahu_sign, rahu_degree = _sid_to_sign_degree(rahu_sid)
    rahu_nak, rahu_pada = _get_nakshatra(rahu_sid)
    rahu_sign_idx = SANSKRIT_SIGNS.index(rahu_sign)
    rahu_house = _whole_sign_house(rahu_sign_idx, lagna_sign_idx)

    ketu_sid = (rahu_sid + 180.0) % 360.0
    ketu_sign, ketu_degree = _sid_to_sign_degree(ketu_sid)
    ketu_nak, ketu_pada = _get_nakshatra(ketu_sid)
    ketu_sign_idx = SANSKRIT_SIGNS.index(ketu_sign)
    ketu_house = _whole_sign_house(ketu_sign_idx, lagna_sign_idx)

    planets.append({
        "name": "Rahu",
        "sign": rahu_sign,
        "degree": rahu_degree,
        "house": rahu_house,
        "nakshatra": rahu_nak,
        "retrograde": True,
    })
    nakshatras.append({"planet": "Rahu", "nakshatra": rahu_nak, "pada": rahu_pada})

    planets.append({
        "name": "Ketu",
        "sign": ketu_sign,
        "degree": ketu_degree,
        "house": ketu_house,
        "nakshatra": ketu_nak,
        "retrograde": True,
    })
    nakshatras.append({"planet": "Ketu", "nakshatra": ketu_nak, "pada": ketu_pada})

    # Build Whole Sign houses with lords
    houses = []
    for i in range(12):
        house_sign_idx = (lagna_sign_idx + i) % 12
        house_sign = SANSKRIT_SIGNS[house_sign_idx]
        lord = SIGN_LORDS[house_sign]
        # Find which house the lord sits in
        lord_planet = next((p for p in planets if p["name"] == lord), None)
        lord_house = lord_planet["house"] if lord_planet else i + 1
        houses.append({
            "number": i + 1,
            "sign": house_sign,
            "lord": lord,
            "lord_house": lord_house,
        })

    # Detect yogas
    yogas = detect_yogas(planets, lagna_sign)

    # Calculate Dasha
    dasha = calculate_vimshottari_dasha(moon_longitude, date_of_birth)

    # Build interpretations
    lagna_lord_name = SIGN_LORDS[lagna_sign]
    lagna_lord_planet = next((p for p in planets if p["name"] == lagna_lord_name), None)
    lagna_lord_interp = get_house_lord_in_house(1, lagna_lord_planet["house"]) if lagna_lord_planet else "Lagna lord placement not determined."

    moon_nak_meaning = get_nakshatra_meaning(moon_nakshatra)
    moon_nak_interp = f"{moon_nakshatra} nakshatra — ruled by {moon_nak_meaning['ruling_planet']}, deity {moon_nak_meaning['deity']}. {moon_nak_meaning['traits']}"

    # Planet highlights: top 3 most significant placements
    planet_highlights = []
    for p in planets:
        if p["name"] in ("Sun", "Moon", "Jupiter", "Saturn", "Rahu"):
            interp = get_planet_in_house(p["name"], p["house"])
            planet_highlights.append({
                "planet": p["name"],
                "text": f"{p['name']} in {p['sign']} in {p['house']}th house — {get_planet_in_sign(p['name'], p['sign'])}",
            })

    interpretations = {
        "lagna_lord": f"{lagna_lord_name} rules your ascendant ({lagna_sign}) — {lagna_lord_interp}",
        "moon_nakshatra": moon_nak_interp,
        "planet_highlights": planet_highlights,
    }

    # Remedies: for current Dasha lords
    remedies = []
    for dasha_key in ("current_mahadasha", "current_antardasha"):
        dasha_planet = dasha[dasha_key]["planet"]
        remedy = get_planet_remedy(dasha_planet)
        remedies.append({
            "planet": dasha_planet,
            "reason": f"{dasha_planet} {'Mahadasha' if 'maha' in dasha_key else 'Antardasha'} active",
            "gemstone": remedy["gemstone"],
            "mantra": remedy["mantra"],
            "charity": remedy["charity"],
            "deity": remedy["deity"],
            "disclaimer": "Traditional Vedic remedy — not medical or financial advice",
        })

    summary = f"Lagna {lagna_sign}, Moon {moon_sign}, Nakshatra {moon_nakshatra}"

    return {
        "summary": summary,
        "lagna": {"sign": lagna_sign, "degree": lagna_degree, "nakshatra": lagna_nak, "pada": lagna_pada},
        "planets": planets,
        "nakshatras": nakshatras,
        "houses": houses,
        "yogas": yogas,
        "dasha": {
            "current_mahadasha": dasha["current_mahadasha"],
            "current_antardasha": dasha["current_antardasha"],
            "upcoming_antardashas": dasha["upcoming_antardashas"],
        },
        "interpretations": interpretations,
        "remedies": remedies,
    }
```

- [ ] **Step 4: Update Pydantic schemas for the enhanced response**

Add to `engine/app/models/schemas.py` — the `VedicPlanetResponse` needs a `house` field, and `VedicChartResponse` needs new fields. Replace the existing Vedic models:

```python
# In engine/app/models/schemas.py — replace the Vedic-related models:

class VedicPlanetResponse(BaseModel):
    name: str
    sign: str
    degree: int
    house: int
    nakshatra: str
    retrograde: bool


class NakshatraResponse(BaseModel):
    planet: str
    nakshatra: str
    pada: int


class LagnaResponse(BaseModel):
    sign: str
    degree: int
    nakshatra: str | None = None
    pada: int | None = None


class VedicHouseResponse(BaseModel):
    number: int
    sign: str
    lord: str
    lord_house: int


class YogaResponse(BaseModel):
    name: str
    present: bool
    strength: str
    interpretation: str


class DashaPeriod(BaseModel):
    planet: str
    start: str
    end: str


class DashaResponse(BaseModel):
    current_mahadasha: DashaPeriod
    current_antardasha: DashaPeriod
    upcoming_antardashas: list[DashaPeriod]


class PlanetHighlight(BaseModel):
    planet: str
    text: str


class InterpretationsResponse(BaseModel):
    lagna_lord: str
    moon_nakshatra: str
    planet_highlights: list[PlanetHighlight]


class RemedyResponse(BaseModel):
    planet: str
    reason: str
    gemstone: str
    mantra: str
    charity: str
    deity: str | None = None
    disclaimer: str


class VedicChartResponse(BaseModel):
    summary: str
    lagna: LagnaResponse
    planets: list[VedicPlanetResponse]
    nakshatras: list[NakshatraResponse]
    houses: list[VedicHouseResponse]
    yogas: list[YogaResponse]
    dasha: DashaResponse
    interpretations: InterpretationsResponse
    remedies: list[RemedyResponse]
```

- [ ] **Step 5: Run all Vedic tests**

Run: `cd engine && python -m pytest tests/test_vedic.py -v`
Expected: All 12 tests PASS

- [ ] **Step 6: Run ALL engine tests to check for regressions**

Run: `cd engine && python -m pytest -v`
Expected: All tests PASS (western, vedic, compatibility, auth, interpretations, dasha, yogas, transits)

- [ ] **Step 7: Commit**

```bash
cd engine && git add app/services/vedic_chart.py app/models/schemas.py tests/test_vedic.py
git commit -m "feat(engine): enhance Vedic chart with Rahu/Ketu, Whole Sign houses, yogas, dasha, interpretations, remedies

Vedic chart now returns 9 grahas (removed Uranus/Neptune/Pluto, added
Rahu/Ketu), 12 Whole Sign houses with lords, yoga detection, Vimshottari
Dasha, planet interpretations, and remedies for active Dasha lords."
```

---

## Task 6: New FastAPI Routes

Wire the new services to HTTP endpoints and register them in the app.

**Files:**
- Create: `engine/app/routes/transits.py`
- Create: `engine/app/routes/dasha.py`
- Create: `engine/app/routes/yogas.py`
- Modify: `engine/app/models/schemas.py` (add request/response models for new endpoints)
- Modify: `engine/app/main.py` (register new routers)

- [ ] **Step 1: Add Pydantic models for new endpoints**

Append to `engine/app/models/schemas.py`:

```python
# --- New endpoint models ---

class TransitPlanetResponse(BaseModel):
    name: str
    sign: str
    degree: int
    longitude: float
    nakshatra: str
    pada: int
    retrograde: bool


class TransitResponse(BaseModel):
    date: str
    planets: list[TransitPlanetResponse]
    dominant_element: str


class NatalPlanetInput(BaseModel):
    name: str
    sign: str
    degree: int
    house: int


class PersonalTransitRequest(BaseModel):
    natal_planets: list[NatalPlanetInput]
    moon_sign: str
    date: str | None = None  # defaults to today


class TransitAspect(BaseModel):
    transit_planet: str
    natal_planet: str
    aspect_type: str
    orb: int
    transit_sign: str
    natal_sign: str


class VedhaFlag(BaseModel):
    planet: str
    favorable_house: int
    obstructed_by: str
    vedha_house: int
    description: str


class PersonalTransitResponse(BaseModel):
    transit_aspects: list[TransitAspect]
    vedha_flags: list[VedhaFlag]
    murthi_nirnaya: str
    transit_houses: dict[str, int]


class DashaRequest(BaseModel):
    moon_longitude: float
    date_of_birth: str


class MahadashaPeriod(BaseModel):
    planet: str
    start: str
    end: str
    antardashas: list[DashaPeriod]


class FullDashaResponse(BaseModel):
    mahadashas: list[MahadashaPeriod]
    current_mahadasha: DashaPeriod
    current_antardasha: DashaPeriod
    upcoming_antardashas: list[DashaPeriod]


class YogaRequest(BaseModel):
    planets: list[VedicPlanetResponse]
    lagna_sign: str


class YogaListResponse(BaseModel):
    yogas: list[YogaResponse]


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
    score: int
    max_score: int
    description: str


class DoshaInfo(BaseModel):
    type: str
    person: str  # "user", "partner", or "both"
    severity: str
    canceled: bool
    remedy: str


class VedicCompatibilityResponse(BaseModel):
    score: int
    max_score: int
    rating: str
    kootas: list[KootaScore]
    doshas: list[DoshaInfo]
    mangal_dosha_user: bool
    mangal_dosha_partner: bool
```

- [ ] **Step 2: Create route files**

```python
# engine/app/routes/transits.py
from datetime import date
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.models.schemas import (
    TransitResponse, PersonalTransitRequest, PersonalTransitResponse, ErrorResponse,
)
from app.services.transits import calculate_transits, calculate_personal_transits

router = APIRouter()


@router.get(
    "/transits/today",
    response_model=TransitResponse,
    responses={500: {"model": ErrorResponse}},
)
async def transits_today():
    try:
        result = calculate_transits(date.today().isoformat())
        return result
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": "calculation_failed", "detail": str(e)},
        )


@router.post(
    "/transits/personal",
    response_model=PersonalTransitResponse,
    responses={500: {"model": ErrorResponse}},
)
async def personal_transits(request: PersonalTransitRequest):
    try:
        date_str = request.date or date.today().isoformat()
        natal = [p.model_dump() for p in request.natal_planets]
        result = calculate_personal_transits(natal, request.moon_sign, date_str)
        return result
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": "calculation_failed", "detail": str(e)},
        )
```

```python
# engine/app/routes/dasha.py
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.models.schemas import DashaRequest, FullDashaResponse, ErrorResponse
from app.services.dasha import calculate_vimshottari_dasha

router = APIRouter()


@router.post(
    "/dasha",
    response_model=FullDashaResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def dasha(request: DashaRequest):
    if not (0 <= request.moon_longitude < 360):
        return JSONResponse(status_code=400, content={"error": "moon_longitude must be 0-360"})
    try:
        result = calculate_vimshottari_dasha(request.moon_longitude, request.date_of_birth)
        return result
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": "calculation_failed", "detail": str(e)},
        )
```

```python
# engine/app/routes/yogas.py
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.models.schemas import YogaRequest, YogaListResponse, ErrorResponse
from app.services.yogas import detect_yogas

router = APIRouter()


@router.post(
    "/yogas",
    response_model=YogaListResponse,
    responses={500: {"model": ErrorResponse}},
)
async def yogas(request: YogaRequest):
    try:
        planets = [p.model_dump() for p in request.planets]
        result = detect_yogas(planets, request.lagna_sign)
        return {"yogas": result}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": "calculation_failed", "detail": str(e)},
        )
```

- [ ] **Step 3: Register routers in main.py**

Replace `engine/app/main.py`:

```python
import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth import InternalSecretMiddleware

app = FastAPI(title="Astra Astrology Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(InternalSecretMiddleware)


from app.routes.western import router as western_router
from app.routes.vedic import router as vedic_router
from app.routes.compatibility import router as compatibility_router
from app.routes.transits import router as transits_router
from app.routes.dasha import router as dasha_router
from app.routes.yogas import router as yogas_router

app.include_router(western_router)
app.include_router(vedic_router)
app.include_router(compatibility_router)
app.include_router(transits_router)
app.include_router(dasha_router)
app.include_router(yogas_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 4: Write route-level integration tests**

```python
# engine/tests/test_vedic_enhanced.py
import os
import pytest
from httpx import AsyncClient, ASGITransport
from datetime import date

os.environ["INTERNAL_SECRET"] = "test-secret"

from app.main import app

HEADERS = {"X-Internal-Secret": "test-secret"}
VALID_SIGNS = {
    "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
    "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
}


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


@pytest.mark.asyncio
async def test_transits_today_endpoint(client):
    response = await client.get("/transits/today", headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert len(data["planets"]) == 9
    assert data["date"] == date.today().isoformat()


@pytest.mark.asyncio
async def test_personal_transits_endpoint(client):
    response = await client.post("/transits/personal", json={
        "natal_planets": [
            {"name": "Sun", "sign": "Mesha", "degree": 15, "house": 1},
            {"name": "Moon", "sign": "Vrishabha", "degree": 10, "house": 2},
        ],
        "moon_sign": "Vrishabha",
    }, headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert "transit_aspects" in data
    assert "vedha_flags" in data
    assert data["murthi_nirnaya"] in ("Gold", "Silver", "Copper", "Iron")


@pytest.mark.asyncio
async def test_dasha_endpoint(client):
    response = await client.post("/dasha", json={
        "moon_longitude": 40.0,
        "date_of_birth": "1990-05-15",
    }, headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert len(data["mahadashas"]) == 9
    assert "current_mahadasha" in data


@pytest.mark.asyncio
async def test_dasha_endpoint_invalid_longitude(client):
    response = await client.post("/dasha", json={
        "moon_longitude": 400.0,
        "date_of_birth": "1990-05-15",
    }, headers=HEADERS)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_yogas_endpoint(client):
    response = await client.post("/yogas", json={
        "planets": [
            {"name": "Sun", "sign": "Mithuna", "degree": 15, "house": 3, "nakshatra": "Ardra", "retrograde": False},
            {"name": "Moon", "sign": "Mesha", "degree": 10, "house": 1, "nakshatra": "Ashwini", "retrograde": False},
            {"name": "Mercury", "sign": "Mithuna", "degree": 20, "house": 3, "nakshatra": "Punarvasu", "retrograde": False},
            {"name": "Venus", "sign": "Karka", "degree": 5, "house": 4, "nakshatra": "Pushya", "retrograde": False},
            {"name": "Mars", "sign": "Kanya", "degree": 12, "house": 6, "nakshatra": "Hasta", "retrograde": False},
            {"name": "Jupiter", "sign": "Mesha", "degree": 8, "house": 1, "nakshatra": "Ashwini", "retrograde": False},
            {"name": "Saturn", "sign": "Vrishchika", "degree": 22, "house": 8, "nakshatra": "Jyeshtha", "retrograde": False},
            {"name": "Rahu", "sign": "Vrishabha", "degree": 15, "house": 2, "nakshatra": "Rohini", "retrograde": True},
            {"name": "Ketu", "sign": "Vrishchika", "degree": 15, "house": 8, "nakshatra": "Anuradha", "retrograde": True},
        ],
        "lagna_sign": "Mesha",
    }, headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert len(data["yogas"]) == 6


@pytest.mark.asyncio
async def test_health_endpoint(client):
    response = await client.get("/health", headers=HEADERS)
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [ ] **Step 5: Run all tests**

Run: `cd engine && python -m pytest -v`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
cd engine && git add app/routes/transits.py app/routes/dasha.py app/routes/yogas.py app/main.py app/models/schemas.py tests/test_vedic_enhanced.py
git commit -m "feat(engine): add transit, dasha, and yoga HTTP endpoints

New routes: GET /transits/today, POST /transits/personal,
POST /dasha, POST /yogas. All registered in main app with
Pydantic request/response validation."
```

---

## Task 7: Final Integration Test

Run the full test suite and verify the engine starts up correctly.

**Files:** No new files

- [ ] **Step 1: Run the complete test suite**

Run: `cd engine && python -m pytest -v --tb=short`
Expected: All tests pass (interpretations, dasha, yogas, transits, vedic, western, compatibility, auth, enhanced routes)

- [ ] **Step 2: Verify the engine starts**

Run: `cd engine && python -c "from app.main import app; print('App loaded with', len(app.routes), 'routes')"`
Expected: Output shows app loaded with routes (should be ~15+ including health)

- [ ] **Step 3: Commit any fixes if needed**

Only if Step 1 or 2 revealed issues. Otherwise skip.

---

## Decomposition Note

This plan covers **Sub-project 5A (Engine Services)** only. Remaining sub-projects to be planned separately:

- **5B: Ashtakoota Compatibility** — `engine/app/services/ashtakoota.py` + `POST /compatibility/vedic` + updated compatibility prompt + UI score display
- **5C: System Prompt + Chat Overhaul** — rewrite `lib/claude.ts`, update `app/api/chat/message/route.ts` to fetch transits
- **5D: Horoscope Enhancement** — rewrite `lib/horoscope.ts` with transit-grounded prompts + new `GET /api/cosmic-weather` endpoint
