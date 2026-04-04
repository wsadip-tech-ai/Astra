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


class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None


class CompatibilityPlanet(BaseModel):
    name: str
    sign: str
    degree: int


class CompatibilityRequest(BaseModel):
    chart1_planets: list[CompatibilityPlanet]
    chart2_planets: list[CompatibilityPlanet]


class CrossAspect(BaseModel):
    planet1: str  # from chart1
    planet2: str  # from chart2
    type: str
    orb: float


class CompatibilityResponse(BaseModel):
    score: int
    aspects: list[CrossAspect]
    summary: str
