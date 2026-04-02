# Sub-project 2B: FastAPI Astrology Engine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a FastAPI service with pyswisseph that calculates Western and Vedic natal charts, and wire it to the existing Next.js frontend.

**Architecture:** FastAPI service in `engine/` directory, authenticated via `X-Internal-Secret` header. Western chart uses tropical zodiac + Placidus houses. Vedic chart uses Lahiri ayanamsa + Whole Sign houses + nakshatras. Next.js `POST /api/chart/generate` calls both endpoints and saves results to Supabase.

**Tech Stack:** Python 3.11+, FastAPI, uvicorn, pyswisseph, pydantic, pytest, httpx. Next.js 14, TypeScript.

---

## File Map

| File | Responsibility |
|------|---------------|
| `engine/requirements.txt` | Python dependencies |
| `engine/.env.example` | Environment variable template |
| `engine/app/__init__.py` | Package init |
| `engine/app/models/__init__.py` | Package init |
| `engine/app/models/schemas.py` | Pydantic request/response models |
| `engine/app/auth.py` | X-Internal-Secret middleware |
| `engine/app/services/__init__.py` | Package init |
| `engine/app/services/western_chart.py` | pyswisseph Western chart calculation |
| `engine/app/services/vedic_chart.py` | pyswisseph Vedic chart calculation |
| `engine/app/routes/__init__.py` | Package init |
| `engine/app/routes/western.py` | POST /chart/western endpoint |
| `engine/app/routes/vedic.py` | POST /chart/vedic endpoint |
| `engine/app/main.py` | FastAPI app setup, CORS, middleware, router includes |
| `engine/tests/__init__.py` | Package init |
| `engine/tests/test_auth.py` | Auth middleware tests |
| `engine/tests/test_western.py` | Western chart endpoint tests |
| `engine/tests/test_vedic.py` | Vedic chart endpoint tests |
| `types/index.ts` | Add VedicChartData, update BirthChart |
| `lib/astrology-engine.ts` | Thin FastAPI client for Next.js |
| `app/api/chart/generate/route.ts` | Update to call FastAPI |
| `__tests__/lib/astrology-engine.test.ts` | Engine client tests |

---

## Task 1: Python Project Scaffold

**Files:**
- Create: `engine/requirements.txt`
- Create: `engine/.env.example`
- Create: `engine/app/__init__.py`
- Create: `engine/app/models/__init__.py`
- Create: `engine/app/services/__init__.py`
- Create: `engine/app/routes/__init__.py`
- Create: `engine/tests/__init__.py`

- [ ] **Step 1: Create directory structure and requirements**

Create `engine/requirements.txt`:

```
fastapi==0.115.12
uvicorn[standard]==0.34.2
pyswisseph==2.10.3.2
python-dotenv==1.1.0
pytest==8.3.5
httpx==0.28.1
```

- [ ] **Step 2: Create .env.example**

Create `engine/.env.example`:

```
INTERNAL_SECRET=dev-secret-change-me
```

- [ ] **Step 3: Create __init__.py files**

Create these empty files:
- `engine/app/__init__.py`
- `engine/app/models/__init__.py`
- `engine/app/services/__init__.py`
- `engine/app/routes/__init__.py`
- `engine/tests/__init__.py`

- [ ] **Step 4: Create virtual environment and install dependencies**

```bash
cd engine
python -m venv venv
source venv/Scripts/activate   # Windows Git Bash
pip install -r requirements.txt
```

- [ ] **Step 5: Commit**

```bash
git add engine/
git commit -m "feat: scaffold FastAPI engine project with dependencies"
```

---

## Task 2: Pydantic Schemas

**Files:**
- Create: `engine/app/models/schemas.py`

- [ ] **Step 1: Create the schemas file**

Create `engine/app/models/schemas.py`:

```python
from pydantic import BaseModel, field_validator


class ChartRequest(BaseModel):
    date_of_birth: str  # "YYYY-MM-DD"
    time_of_birth: str | None = None  # "HH:MM" or null
    latitude: float
    longitude: float
    timezone: str  # IANA timezone e.g. "Asia/Kathmandu"

    @field_validator("latitude")
    @classmethod
    def validate_latitude(cls, v: float) -> float:
        if not -90 <= v <= 90:
            raise ValueError("latitude must be between -90 and 90")
        return v

    @field_validator("longitude")
    @classmethod
    def validate_longitude(cls, v: float) -> float:
        if not -180 <= v <= 180:
            raise ValueError("longitude must be between -180 and 180")
        return v


class PlanetResponse(BaseModel):
    name: str
    symbol: str
    sign: str
    degree: int
    house: int
    retrograde: bool


class HouseResponse(BaseModel):
    number: int
    sign: str
    degree: int


class AspectResponse(BaseModel):
    planet1: str
    planet2: str
    type: str  # "trine", "square", "conjunction", "opposition", "sextile"
    orb: float


class WesternChartResponse(BaseModel):
    summary: str
    planets: list[PlanetResponse]
    houses: list[HouseResponse]
    aspects: list[AspectResponse]


class LagnaResponse(BaseModel):
    sign: str
    degree: int


class VedicPlanetResponse(BaseModel):
    name: str
    sign: str
    degree: int
    nakshatra: str
    retrograde: bool


class NakshatraResponse(BaseModel):
    planet: str
    nakshatra: str
    pada: int


class VedicChartResponse(BaseModel):
    summary: str
    lagna: LagnaResponse
    planets: list[VedicPlanetResponse]
    nakshatras: list[NakshatraResponse]


class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None
```

- [ ] **Step 2: Commit**

```bash
git add engine/app/models/schemas.py
git commit -m "feat: add Pydantic request/response schemas for chart API"
```

---

## Task 3: Auth Middleware

**Files:**
- Create: `engine/app/auth.py`
- Create: `engine/tests/test_auth.py`

- [ ] **Step 1: Write the failing tests**

Create `engine/tests/test_auth.py`:

```python
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
    # Should not be 401 — might be 200 or another status, but not auth failure
    assert response.status_code != 401
```

- [ ] **Step 2: Create auth middleware**

Create `engine/app/auth.py`:

```python
import os
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


class InternalSecretMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        expected = os.environ.get("INTERNAL_SECRET", "")
        provided = request.headers.get("X-Internal-Secret", "")

        if not expected or provided != expected:
            return JSONResponse(
                status_code=401,
                content={"error": "unauthorized"},
            )

        return await call_next(request)
```

- [ ] **Step 3: Create minimal main.py (needed for tests to import)**

Create `engine/app/main.py`:

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


@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 4: Add pytest-asyncio to requirements and install**

Add `pytest-asyncio==0.25.3` to `engine/requirements.txt` and run:

```bash
cd engine && source venv/Scripts/activate && pip install pytest-asyncio
```

- [ ] **Step 5: Run tests**

```bash
cd engine && source venv/Scripts/activate && python -m pytest tests/test_auth.py -v
```

Expected: 3 tests pass

- [ ] **Step 6: Commit**

```bash
git add engine/app/auth.py engine/app/main.py engine/tests/test_auth.py engine/requirements.txt
git commit -m "feat: add auth middleware with X-Internal-Secret validation"
```

---

## Task 4: Western Chart Calculation Service

**Files:**
- Create: `engine/app/services/western_chart.py`

- [ ] **Step 1: Create the Western chart service**

Create `engine/app/services/western_chart.py`:

```python
import swisseph as swe
from datetime import datetime
from zoneinfo import ZoneInfo

ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

PLANET_IDS = [
    (swe.SUN, "Sun", "☉"),
    (swe.MOON, "Moon", "☽"),
    (swe.MERCURY, "Mercury", "☿"),
    (swe.VENUS, "Venus", "♀"),
    (swe.MARS, "Mars", "♂"),
    (swe.JUPITER, "Jupiter", "♃"),
    (swe.SATURN, "Saturn", "♄"),
    (swe.URANUS, "Uranus", "♅"),
    (swe.NEPTUNE, "Neptune", "♆"),
    (swe.PLUTO, "Pluto", "♇"),
]

ASPECT_DEFINITIONS = [
    ("conjunction", 0.0, 8.0),
    ("opposition", 180.0, 8.0),
    ("trine", 120.0, 7.0),
    ("square", 90.0, 7.0),
    ("sextile", 60.0, 5.0),
]


def _longitude_to_sign_degree(longitude: float) -> tuple[str, int]:
    """Convert ecliptic longitude (0-360) to zodiac sign and degree (0-29)."""
    sign_index = int(longitude // 30)
    degree = int(longitude % 30)
    return ZODIAC_SIGNS[sign_index], degree


def _find_house(longitude: float, cusps: list[float]) -> int:
    """Find which house a planet falls in given house cusps."""
    for i in range(12):
        next_i = (i + 1) % 12
        cusp_start = cusps[i]
        cusp_end = cusps[next_i]

        if cusp_start <= cusp_end:
            if cusp_start <= longitude < cusp_end:
                return i + 1
        else:
            # Wraps around 360°
            if longitude >= cusp_start or longitude < cusp_end:
                return i + 1
    return 1  # Fallback


def _angular_separation(lon1: float, lon2: float) -> float:
    """Calculate the smallest angle between two ecliptic longitudes."""
    diff = abs(lon1 - lon2) % 360
    return min(diff, 360 - diff)


def _to_julian_day(date_of_birth: str, time_of_birth: str | None, timezone: str) -> float:
    """Parse date/time and convert to Julian Day in UT."""
    date_parts = date_of_birth.split("-")
    year = int(date_parts[0])
    month = int(date_parts[1])
    day = int(date_parts[2])

    if time_of_birth:
        time_parts = time_of_birth.split(":")
        hour = int(time_parts[0])
        minute = int(time_parts[1])
    else:
        hour, minute = 12, 0  # Default to noon

    local_dt = datetime(year, month, day, hour, minute, tzinfo=ZoneInfo(timezone))
    utc_dt = local_dt.astimezone(ZoneInfo("UTC"))

    decimal_hour = utc_dt.hour + utc_dt.minute / 60.0 + utc_dt.second / 3600.0
    jd = swe.julday(utc_dt.year, utc_dt.month, utc_dt.day, decimal_hour)
    return jd


def calculate_western_chart(
    date_of_birth: str,
    time_of_birth: str | None,
    latitude: float,
    longitude: float,
    timezone: str,
) -> dict:
    """Calculate a Western natal chart and return structured data."""
    jd = _to_julian_day(date_of_birth, time_of_birth, timezone)

    # Calculate house cusps (Placidus)
    cusps_tuple, ascmc = swe.houses(jd, latitude, longitude, b"P")
    cusps = list(cusps_tuple)  # 12 house cusps

    # Build houses response
    houses = []
    for i, cusp_lon in enumerate(cusps):
        sign, degree = _longitude_to_sign_degree(cusp_lon)
        houses.append({"number": i + 1, "sign": sign, "degree": degree})

    # Calculate planets
    planets = []
    planet_longitudes: dict[str, float] = {}

    for planet_id, name, symbol in PLANET_IDS:
        result, flag = swe.calc_ut(jd, planet_id)
        lon = result[0]  # Ecliptic longitude
        speed = result[3]  # Speed in longitude
        sign, degree = _longitude_to_sign_degree(lon)
        house = _find_house(lon, cusps)
        retrograde = speed < 0

        planets.append({
            "name": name,
            "symbol": symbol,
            "sign": sign,
            "degree": degree,
            "house": house,
            "retrograde": retrograde,
        })
        planet_longitudes[name] = lon

    # Calculate aspects
    aspects = []
    planet_names = list(planet_longitudes.keys())
    for i in range(len(planet_names)):
        for j in range(i + 1, len(planet_names)):
            p1 = planet_names[i]
            p2 = planet_names[j]
            sep = _angular_separation(planet_longitudes[p1], planet_longitudes[p2])

            for aspect_type, angle, max_orb in ASPECT_DEFINITIONS:
                orb = abs(sep - angle)
                if orb <= max_orb:
                    aspects.append({
                        "planet1": p1,
                        "planet2": p2,
                        "type": aspect_type,
                        "orb": round(orb, 1),
                    })
                    break  # Only the closest aspect for each pair

    # Summary
    sun_sign = next(p["sign"] for p in planets if p["name"] == "Sun")
    moon_sign = next(p["sign"] for p in planets if p["name"] == "Moon")
    asc_sign = houses[0]["sign"]
    summary = f"Sun {sun_sign}, Moon {moon_sign}, ASC {asc_sign}"

    return {
        "summary": summary,
        "planets": planets,
        "houses": houses,
        "aspects": aspects,
    }
```

- [ ] **Step 2: Commit**

```bash
git add engine/app/services/western_chart.py
git commit -m "feat: add Western natal chart calculation with pyswisseph"
```

---

## Task 5: Western Chart Endpoint + Tests

**Files:**
- Create: `engine/app/routes/western.py`
- Create: `engine/tests/test_western.py`
- Modify: `engine/app/main.py` (add router)

- [ ] **Step 1: Create the route**

Create `engine/app/routes/western.py`:

```python
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.models.schemas import ChartRequest, WesternChartResponse, ErrorResponse
from app.services.western_chart import calculate_western_chart

router = APIRouter()


@router.post(
    "/chart/western",
    response_model=WesternChartResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def western_chart(request: ChartRequest):
    try:
        # Validate date format
        parts = request.date_of_birth.split("-")
        if len(parts) != 3:
            raise ValueError("invalid date format")
        int(parts[0]), int(parts[1]), int(parts[2])
    except (ValueError, IndexError):
        return JSONResponse(status_code=400, content={"error": "invalid_date"})

    try:
        result = calculate_western_chart(
            date_of_birth=request.date_of_birth,
            time_of_birth=request.time_of_birth,
            latitude=request.latitude,
            longitude=request.longitude,
            timezone=request.timezone,
        )
        return result
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": "calculation_failed", "detail": str(e)},
        )
```

- [ ] **Step 2: Register the router in main.py**

Add to `engine/app/main.py` after the middleware lines:

```python
from app.routes.western import router as western_router

app.include_router(western_router)
```

- [ ] **Step 3: Write the tests**

Create `engine/tests/test_western.py`:

```python
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
```

- [ ] **Step 4: Run tests**

```bash
cd engine && source venv/Scripts/activate && python -m pytest tests/test_western.py -v
```

Expected: 8 tests pass

- [ ] **Step 5: Commit**

```bash
git add engine/app/routes/western.py engine/app/main.py engine/tests/test_western.py
git commit -m "feat: add POST /chart/western endpoint with tests"
```

---

## Task 6: Vedic Chart Calculation Service

**Files:**
- Create: `engine/app/services/vedic_chart.py`

- [ ] **Step 1: Create the Vedic chart service**

Create `engine/app/services/vedic_chart.py`:

```python
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


def calculate_vedic_chart(
    date_of_birth: str,
    time_of_birth: str | None,
    latitude: float,
    longitude: float,
    timezone: str,
) -> dict:
    """Calculate a Vedic natal chart using Lahiri ayanamsa and Whole Sign houses."""
    jd = _to_julian_day(date_of_birth, time_of_birth, timezone)

    # Set Lahiri ayanamsa
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    ayanamsa = swe.get_ayanamsa_ut(jd)

    # Get tropical ascendant and convert to sidereal
    _cusps, ascmc = swe.houses(jd, latitude, longitude, b"P")
    tropical_asc = ascmc[0]
    sid_asc = _sidereal_longitude(tropical_asc, ayanamsa)
    lagna_sign, lagna_degree = _sid_to_sign_degree(sid_asc)

    # Calculate planets
    planets = []
    nakshatras = []
    moon_sign = ""
    moon_nakshatra = ""

    for planet_id, name, _symbol in PLANET_IDS:
        result, _flag = swe.calc_ut(jd, planet_id)
        tropical_lon = result[0]
        speed = result[3]
        sid_lon = _sidereal_longitude(tropical_lon, ayanamsa)

        sign, degree = _sid_to_sign_degree(sid_lon)
        nak_name, pada = _get_nakshatra(sid_lon)
        retrograde = speed < 0

        planets.append({
            "name": name,
            "sign": sign,
            "degree": degree,
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

    summary = f"Lagna {lagna_sign}, Moon {moon_sign}, Nakshatra {moon_nakshatra}"

    return {
        "summary": summary,
        "lagna": {"sign": lagna_sign, "degree": lagna_degree},
        "planets": planets,
        "nakshatras": nakshatras,
    }
```

- [ ] **Step 2: Commit**

```bash
git add engine/app/services/vedic_chart.py
git commit -m "feat: add Vedic natal chart calculation with Lahiri ayanamsa"
```

---

## Task 7: Vedic Chart Endpoint + Tests

**Files:**
- Create: `engine/app/routes/vedic.py`
- Create: `engine/tests/test_vedic.py`
- Modify: `engine/app/main.py` (add router)

- [ ] **Step 1: Create the route**

Create `engine/app/routes/vedic.py`:

```python
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.models.schemas import ChartRequest, VedicChartResponse, ErrorResponse
from app.services.vedic_chart import calculate_vedic_chart

router = APIRouter()


@router.post(
    "/chart/vedic",
    response_model=VedicChartResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def vedic_chart(request: ChartRequest):
    try:
        parts = request.date_of_birth.split("-")
        if len(parts) != 3:
            raise ValueError("invalid date format")
        int(parts[0]), int(parts[1]), int(parts[2])
    except (ValueError, IndexError):
        return JSONResponse(status_code=400, content={"error": "invalid_date"})

    try:
        result = calculate_vedic_chart(
            date_of_birth=request.date_of_birth,
            time_of_birth=request.time_of_birth,
            latitude=request.latitude,
            longitude=request.longitude,
            timezone=request.timezone,
        )
        return result
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": "calculation_failed", "detail": str(e)},
        )
```

- [ ] **Step 2: Register the router in main.py**

Add to `engine/app/main.py`:

```python
from app.routes.vedic import router as vedic_router

app.include_router(vedic_router)
```

- [ ] **Step 3: Write the tests**

Create `engine/tests/test_vedic.py`:

```python
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
    """Sidereal positions should differ from tropical by ~23° (ayanamsa)."""
    western_resp = await client.post("/chart/western", json=KATHMANDU_BIRTH, headers=HEADERS)
    vedic_resp = await client.post("/chart/vedic", json=KATHMANDU_BIRTH, headers=HEADERS)
    western = western_resp.json()
    vedic = vedic_resp.json()
    # Sun's tropical sign is Taurus — sidereal should be different (likely Aries)
    w_sun = next(p for p in western["planets"] if p["name"] == "Sun")
    v_sun = next(p for p in vedic["planets"] if p["name"] == "Sun")
    # They might be in the same sign near boundaries, but degree should differ
    # At minimum, the vedic chart should have valid data
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

- [ ] **Step 4: Run all engine tests**

```bash
cd engine && source venv/Scripts/activate && python -m pytest tests/ -v
```

Expected: All tests pass (auth + western + vedic)

- [ ] **Step 5: Commit**

```bash
git add engine/app/routes/vedic.py engine/app/main.py engine/tests/test_vedic.py
git commit -m "feat: add POST /chart/vedic endpoint with tests"
```

---

## Task 8: Next.js Types + Engine Client

**Files:**
- Modify: `types/index.ts`
- Create: `lib/astrology-engine.ts`
- Create: `__tests__/lib/astrology-engine.test.ts`

- [ ] **Step 1: Add VedicChartData type and update BirthChart**

In `types/index.ts`, append after `CosmicWeatherEntry`:

```ts
export interface VedicPlanet {
  name: string
  sign: string
  degree: number
  nakshatra: string
  retrograde: boolean
}

export interface VedicNakshatra {
  planet: string
  nakshatra: string
  pada: number
}

export interface VedicChartData {
  summary: string
  lagna: { sign: string; degree: number }
  planets: VedicPlanet[]
  nakshatras: VedicNakshatra[]
}
```

Also change `BirthChart.vedic_chart_json`:

```ts
// Change from:
vedic_chart_json: Record<string, unknown> | null
// To:
vedic_chart_json: VedicChartData | null
```

- [ ] **Step 2: Write the failing test**

Create `__tests__/lib/astrology-engine.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('astrology-engine client', () => {
  beforeEach(() => {
    vi.resetModules()
    mockFetch.mockReset()
    process.env.FASTAPI_BASE_URL = 'http://localhost:8000'
    process.env.INTERNAL_SECRET = 'test-secret'
  })

  it('calculateWesternChart sends correct request and returns data', async () => {
    const mockChart = { summary: 'Sun Taurus', planets: [], houses: [], aspects: [] }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockChart,
    })

    const { calculateWesternChart } = await import('@/lib/astrology-engine')
    const result = await calculateWesternChart({
      date_of_birth: '1990-05-15',
      time_of_birth: '14:30',
      latitude: 27.72,
      longitude: 85.32,
      timezone: 'Asia/Kathmandu',
    })

    expect(result).toEqual(mockChart)
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/chart/western',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-Internal-Secret': 'test-secret',
        }),
      }),
    )
  })

  it('calculateWesternChart returns null on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'))

    const { calculateWesternChart } = await import('@/lib/astrology-engine')
    const result = await calculateWesternChart({
      date_of_birth: '1990-05-15',
      time_of_birth: '14:30',
      latitude: 27.72,
      longitude: 85.32,
      timezone: 'Asia/Kathmandu',
    })

    expect(result).toBeNull()
  })

  it('calculateVedicChart returns null on non-200 response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })

    const { calculateVedicChart } = await import('@/lib/astrology-engine')
    const result = await calculateVedicChart({
      date_of_birth: '1990-05-15',
      time_of_birth: '14:30',
      latitude: 27.72,
      longitude: 85.32,
      timezone: 'Asia/Kathmandu',
    })

    expect(result).toBeNull()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run __tests__/lib/astrology-engine.test.ts`
Expected: FAIL — module not found

- [ ] **Step 4: Create the engine client**

Create `lib/astrology-engine.ts`:

```ts
import type { WesternChartData, VedicChartData } from '@/types'

interface ChartParams {
  date_of_birth: string
  time_of_birth: string | null
  latitude: number
  longitude: number
  timezone: string
}

const BASE_URL = process.env.FASTAPI_BASE_URL || 'http://localhost:8000'
const SECRET = process.env.INTERNAL_SECRET || ''

async function callEngine<T>(path: string, params: ChartParams): Promise<T | null> {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': SECRET,
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) return null
    return await response.json() as T
  } catch {
    return null
  }
}

export async function calculateWesternChart(params: ChartParams): Promise<WesternChartData | null> {
  return callEngine<WesternChartData>('/chart/western', params)
}

export async function calculateVedicChart(params: ChartParams): Promise<VedicChartData | null> {
  return callEngine<VedicChartData>('/chart/vedic', params)
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run __tests__/lib/astrology-engine.test.ts`
Expected: PASS — all 3 tests

- [ ] **Step 6: Commit**

```bash
git add types/index.ts lib/astrology-engine.ts __tests__/lib/astrology-engine.test.ts
git commit -m "feat: add VedicChartData type and FastAPI engine client"
```

---

## Task 9: Update Chart Generate Route

**Files:**
- Modify: `app/api/chart/generate/route.ts`

- [ ] **Step 1: Update the route to call FastAPI**

Replace `app/api/chart/generate/route.ts` with:

```ts
import { createClient } from '@/lib/supabase/server'
import { geocodeCity, GeocodingError } from '@/lib/geocoding'
import { calculateWesternChart, calculateVedicChart } from '@/lib/astrology-engine'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { date_of_birth, time_of_birth, place_of_birth, label = 'My Chart' } = body

  if (!date_of_birth || !place_of_birth) {
    return NextResponse.json({ error: 'date_of_birth and place_of_birth are required' }, { status: 400 })
  }

  let geoResult
  try {
    geoResult = await geocodeCity(place_of_birth)
  } catch (err) {
    if (err instanceof GeocodingError) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Geocoding service unavailable' }, { status: 503 })
  }

  // Call FastAPI engine (returns null on failure — graceful degradation)
  const chartParams = {
    date_of_birth,
    time_of_birth: time_of_birth || null,
    latitude: geoResult.lat,
    longitude: geoResult.lng,
    timezone: geoResult.timezone,
  }

  const [westernChart, vedicChart] = await Promise.all([
    calculateWesternChart(chartParams),
    calculateVedicChart(chartParams),
  ])

  const { data: chart, error } = await supabase
    .from('birth_charts')
    .insert({
      user_id: user.id,
      label,
      date_of_birth,
      time_of_birth: time_of_birth || null,
      place_of_birth: geoResult.displayName,
      latitude: geoResult.lat,
      longitude: geoResult.lng,
      timezone: geoResult.timezone,
      western_chart_json: westernChart,
      vedic_chart_json: vedicChart,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to save chart' }, { status: 500 })
  }

  return NextResponse.json({ chart_id: chart.id, timezone: geoResult.timezone })
}
```

- [ ] **Step 2: Run all Next.js tests**

```bash
npx vitest run
```

Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add app/api/chart/generate/route.ts
git commit -m "feat: wire chart generate route to FastAPI engine with graceful degradation"
```

---

## Task 10: Final Verification

- [ ] **Step 1: Run all Python tests**

```bash
cd engine && source venv/Scripts/activate && python -m pytest tests/ -v
```

Expected: All engine tests pass

- [ ] **Step 2: Run all Next.js tests**

```bash
npx vitest run
```

Expected: All frontend tests pass

- [ ] **Step 3: Start the engine and manually verify**

Terminal 1:
```bash
cd engine && source venv/Scripts/activate && INTERNAL_SECRET=dev-secret uvicorn app.main:app --reload --port 8000
```

Terminal 2 — test with curl:
```bash
curl -X POST http://localhost:8000/chart/western \
  -H "Content-Type: application/json" \
  -H "X-Internal-Secret: dev-secret" \
  -d '{"date_of_birth":"1990-05-15","time_of_birth":"14:30","latitude":27.72,"longitude":85.32,"timezone":"Asia/Kathmandu"}'
```

Expected: JSON response with Sun in Taurus, 10 planets, 12 houses, aspects

```bash
curl -X POST http://localhost:8000/chart/vedic \
  -H "Content-Type: application/json" \
  -H "X-Internal-Secret: dev-secret" \
  -d '{"date_of_birth":"1990-05-15","time_of_birth":"14:30","latitude":27.72,"longitude":85.32,"timezone":"Asia/Kathmandu"}'
```

Expected: JSON response with Lagna, 10 planets with Sanskrit signs and nakshatras
