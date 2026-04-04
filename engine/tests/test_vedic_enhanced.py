import os
import pytest
from httpx import AsyncClient, ASGITransport
from datetime import date

os.environ["INTERNAL_SECRET"] = "test-secret"

from app.main import app

HEADERS = {"X-Internal-Secret": "test-secret"}


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
