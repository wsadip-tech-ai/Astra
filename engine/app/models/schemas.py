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


# --- New endpoint models ---

class TransitPlanetResponse(BaseModel):
    name: str
    sign: str
    degree: int
    longitude: float
    nakshatra: str
    pada: int
    retrograde: bool


class TransitResponse(BaseModel):
    date: str
    planets: list[TransitPlanetResponse]
    dominant_element: str


class NatalPlanetInput(BaseModel):
    name: str
    sign: str
    degree: int
    house: int


class PersonalTransitRequest(BaseModel):
    natal_planets: list[NatalPlanetInput]
    moon_sign: str
    date: str | None = None


class TransitAspect(BaseModel):
    transit_planet: str
    natal_planet: str
    aspect_type: str
    orb: int
    transit_sign: str
    natal_sign: str


class VedhaFlag(BaseModel):
    planet: str
    favorable_house: int
    obstructed_by: str
    vedha_house: int
    description: str


class PersonalTransitResponse(BaseModel):
    transit_aspects: list[TransitAspect]
    vedha_flags: list[VedhaFlag]
    murthi_nirnaya: str
    transit_houses: dict[str, int]


class DashaRequest(BaseModel):
    moon_longitude: float
    date_of_birth: str


class MahadashaPeriod(BaseModel):
    planet: str
    start: str
    end: str
    antardashas: list[DashaPeriod]


class FullDashaResponse(BaseModel):
    mahadashas: list[MahadashaPeriod]
    current_mahadasha: DashaPeriod
    current_antardasha: DashaPeriod
    upcoming_antardashas: list[DashaPeriod]


class YogaRequest(BaseModel):
    planets: list[VedicPlanetResponse]
    lagna_sign: str


class YogaListResponse(BaseModel):
    yogas: list[YogaResponse]
