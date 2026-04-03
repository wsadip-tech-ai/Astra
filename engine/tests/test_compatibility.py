import os
import pytest
from httpx import AsyncClient, ASGITransport

os.environ["INTERNAL_SECRET"] = "test-secret"

from app.main import app

HEADERS = {"X-Internal-Secret": "test-secret"}

CHART1_PLANETS = [
    {"name": "Sun", "sign": "Taurus", "degree": 24},
    {"name": "Moon", "sign": "Scorpio", "degree": 8},
    {"name": "Mercury", "sign": "Taurus", "degree": 12},
    {"name": "Venus", "sign": "Gemini", "degree": 2},
    {"name": "Mars", "sign": "Pisces", "degree": 18},
    {"name": "Jupiter", "sign": "Cancer", "degree": 6},
    {"name": "Saturn", "sign": "Capricorn", "degree": 25},
    {"name": "Uranus", "sign": "Capricorn", "degree": 9},
    {"name": "Neptune", "sign": "Capricorn", "degree": 14},
    {"name": "Pluto", "sign": "Scorpio", "degree": 16},
]

CHART2_PLANETS = [
    {"name": "Sun", "sign": "Leo", "degree": 28},
    {"name": "Moon", "sign": "Taurus", "degree": 20},
    {"name": "Mercury", "sign": "Virgo", "degree": 5},
    {"name": "Venus", "sign": "Cancer", "degree": 10},
    {"name": "Mars", "sign": "Aries", "degree": 15},
    {"name": "Jupiter", "sign": "Virgo", "degree": 22},
    {"name": "Saturn", "sign": "Aquarius", "degree": 1},
    {"name": "Uranus", "sign": "Capricorn", "degree": 18},
    {"name": "Neptune", "sign": "Capricorn", "degree": 19},
    {"name": "Pluto", "sign": "Scorpio", "degree": 20},
]


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


@pytest.mark.asyncio
async def test_compatibility_returns_score_in_range(client):
    response = await client.post(
        "/compatibility",
        json={"chart1_planets": CHART1_PLANETS, "chart2_planets": CHART2_PLANETS},
        headers=HEADERS,
    )
    assert response.status_code == 200
    data = response.json()
    assert 0 <= data["score"] <= 100


@pytest.mark.asyncio
async def test_compatibility_returns_aspects_with_valid_types(client):
    response = await client.post(
        "/compatibility",
        json={"chart1_planets": CHART1_PLANETS, "chart2_planets": CHART2_PLANETS},
        headers=HEADERS,
    )
    data = response.json()
    valid_types = {"trine", "square", "conjunction", "opposition", "sextile"}
    assert len(data["aspects"]) > 0
    for aspect in data["aspects"]:
        assert aspect["type"] in valid_types
        assert aspect["orb"] >= 0


@pytest.mark.asyncio
async def test_compatibility_returns_summary(client):
    response = await client.post(
        "/compatibility",
        json={"chart1_planets": CHART1_PLANETS, "chart2_planets": CHART2_PLANETS},
        headers=HEADERS,
    )
    data = response.json()
    assert len(data["summary"]) > 0


@pytest.mark.asyncio
async def test_compatibility_aspects_sorted_by_orb(client):
    response = await client.post(
        "/compatibility",
        json={"chart1_planets": CHART1_PLANETS, "chart2_planets": CHART2_PLANETS},
        headers=HEADERS,
    )
    data = response.json()
    orbs = [a["orb"] for a in data["aspects"]]
    assert orbs == sorted(orbs)


@pytest.mark.asyncio
async def test_compatibility_identical_charts_high_score(client):
    response = await client.post(
        "/compatibility",
        json={"chart1_planets": CHART1_PLANETS, "chart2_planets": CHART1_PLANETS},
        headers=HEADERS,
    )
    data = response.json()
    assert data["score"] >= 80
