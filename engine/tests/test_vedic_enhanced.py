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


@pytest.mark.asyncio
async def test_vaastu_analyze_endpoint(client):
    response = await client.post("/vaastu/analyze", json={
        "property": {"length": 30, "breadth": 25, "entrance_direction": "N", "floor_level": "ground"},
        "user_nakshatra": "Ashwini",
        "dasha_lord": "Moon",
        "planets": [
            {"name": "Sun", "sign": "Mesha", "degree": 10, "house": 1, "nakshatra": "Ashwini", "retrograde": False},
            {"name": "Moon", "sign": "Tula", "degree": 10, "house": 7, "nakshatra": "Swati", "retrograde": False},
            {"name": "Mars", "sign": "Karka", "degree": 15, "house": 4, "nakshatra": "Pushya", "retrograde": False},
            {"name": "Mercury", "sign": "Mesha", "degree": 25, "house": 1, "nakshatra": "Bharani", "retrograde": False},
            {"name": "Jupiter", "sign": "Simha", "degree": 10, "house": 5, "nakshatra": "Magha", "retrograde": False},
            {"name": "Venus", "sign": "Mithuna", "degree": 20, "house": 3, "nakshatra": "Ardra", "retrograde": False},
            {"name": "Saturn", "sign": "Makara", "degree": 5, "house": 10, "nakshatra": "Uttara Ashadha", "retrograde": False},
            {"name": "Rahu", "sign": "Vrishabha", "degree": 15, "house": 2, "nakshatra": "Rohini", "retrograde": True},
            {"name": "Ketu", "sign": "Vrishchika", "degree": 15, "house": 8, "nakshatra": "Anuradha", "retrograde": True},
        ],
    }, headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert len(data["zone_map"]) == 16
    assert "aayadi" in data
    assert "remedies" in data
    assert "disclaimer" in data


@pytest.mark.asyncio
async def test_vaastu_aayadi_endpoint(client):
    response = await client.post("/vaastu/aayadi", json={
        "length": 30.0,
        "breadth": 25.0,
        "user_nakshatra": "Ashwini",
    }, headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert "aaya" in data
    assert "vyaya" in data
    assert "yoni" in data


@pytest.mark.asyncio
async def test_vaastu_hits_endpoint(client):
    response = await client.post("/vaastu/hits", json={
        "dasha_lord": "Moon",
        "planets": [
            {"name": "Sun", "sign": "Mesha", "degree": 10, "house": 1, "nakshatra": "Ashwini", "retrograde": False},
            {"name": "Moon", "sign": "Tula", "degree": 10, "house": 7, "nakshatra": "Swati", "retrograde": False},
        ],
    }, headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert "primary_hits" in data
    assert "dasha_lord" in data
