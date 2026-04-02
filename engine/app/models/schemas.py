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
    type: str
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
