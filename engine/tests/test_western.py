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


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


@pytest.mark.asyncio
async def test_western_chart_returns_sun_in_taurus(client):
    response = await client.post("/chart/western", json=KATHMANDU_BIRTH, headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    sun = next(p for p in data["planets"] if p["name"] == "Sun")
    assert sun["sign"] == "Taurus"
    assert sun["retrograde"] is False


@pytest.mark.asyncio
async def test_western_chart_has_10_planets(client):
    response = await client.post("/chart/western", json=KATHMANDU_BIRTH, headers=HEADERS)
    data = response.json()
    assert len(data["planets"]) == 10


@pytest.mark.asyncio
async def test_western_chart_has_12_houses(client):
    response = await client.post("/chart/western", json=KATHMANDU_BIRTH, headers=HEADERS)
    data = response.json()
    assert len(data["houses"]) == 12


@pytest.mark.asyncio
async def test_western_chart_aspects_have_valid_types(client):
    response = await client.post("/chart/western", json=KATHMANDU_BIRTH, headers=HEADERS)
    data = response.json()
    valid_types = {"trine", "square", "conjunction", "opposition", "sextile"}
    for aspect in data["aspects"]:
        assert aspect["type"] in valid_types
        assert aspect["orb"] >= 0


@pytest.mark.asyncio
async def test_western_chart_summary_format(client):
    response = await client.post("/chart/western", json=KATHMANDU_BIRTH, headers=HEADERS)
    data = response.json()
    assert "Sun " in data["summary"]
    assert "Moon " in data["summary"]
    assert "ASC " in data["summary"]


@pytest.mark.asyncio
async def test_western_chart_without_time_uses_noon(client):
    birth = {**KATHMANDU_BIRTH, "time_of_birth": None}
    response = await client.post("/chart/western", json=birth, headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert len(data["planets"]) == 10


@pytest.mark.asyncio
async def test_western_chart_invalid_date_returns_400(client):
    birth = {**KATHMANDU_BIRTH, "date_of_birth": "not-a-date"}
    response = await client.post("/chart/western", json=birth, headers=HEADERS)
    assert response.status_code == 400
    assert response.json()["error"] == "invalid_date"


@pytest.mark.asyncio
async def test_western_chart_invalid_coordinates_returns_422(client):
    birth = {**KATHMANDU_BIRTH, "latitude": 999}
    response = await client.post("/chart/western", json=birth, headers=HEADERS)
    assert response.status_code == 422  # Pydantic validation error
