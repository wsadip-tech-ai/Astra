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
async def test_vedic_chart_has_10_planets_with_sanskrit_signs(client):
    response = await client.post("/chart/vedic", json=KATHMANDU_BIRTH, headers=HEADERS)
    data = response.json()
    assert len(data["planets"]) == 10
    for planet in data["planets"]:
        assert planet["sign"] in VALID_SIGNS


@pytest.mark.asyncio
async def test_vedic_chart_has_nakshatra_for_all_planets(client):
    response = await client.post("/chart/vedic", json=KATHMANDU_BIRTH, headers=HEADERS)
    data = response.json()
    assert len(data["nakshatras"]) == 10
    for nak in data["nakshatras"]:
        assert 1 <= nak["pada"] <= 4
        assert len(nak["nakshatra"]) > 0


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
