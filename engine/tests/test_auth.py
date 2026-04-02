import os
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

os.environ["INTERNAL_SECRET"] = "test-secret"


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


@pytest.mark.asyncio
async def test_request_without_secret_returns_401(client):
    response = await client.post("/chart/western", json={
        "date_of_birth": "1990-05-15",
        "latitude": 27.72,
        "longitude": 85.32,
        "timezone": "Asia/Kathmandu",
    })
    assert response.status_code == 401
    assert response.json()["error"] == "unauthorized"


@pytest.mark.asyncio
async def test_request_with_wrong_secret_returns_401(client):
    response = await client.post(
        "/chart/western",
        json={
            "date_of_birth": "1990-05-15",
            "latitude": 27.72,
            "longitude": 85.32,
            "timezone": "Asia/Kathmandu",
        },
        headers={"X-Internal-Secret": "wrong-secret"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_request_with_valid_secret_passes(client):
    response = await client.post(
        "/chart/western",
        json={
            "date_of_birth": "1990-05-15",
            "latitude": 27.72,
            "longitude": 85.32,
            "timezone": "Asia/Kathmandu",
        },
        headers={"X-Internal-Secret": "test-secret"},
    )
    # Should not be 401 — might be 404 since route doesn't exist yet, but not auth failure
    assert response.status_code != 401
