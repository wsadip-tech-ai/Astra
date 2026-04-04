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

ORDERED_SIGNS = [
    "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
    "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
]

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
    assert len(data["yogas"]) == 6
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
    rahu_idx = ORDERED_SIGNS.index(rahu["sign"])
    ketu_idx = ORDERED_SIGNS.index(ketu["sign"])
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
