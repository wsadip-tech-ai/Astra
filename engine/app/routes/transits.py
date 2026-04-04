from datetime import date
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.models.schemas import (
    TransitResponse, PersonalTransitRequest, PersonalTransitResponse, ErrorResponse,
)
from app.services.transits import calculate_transits, calculate_personal_transits

router = APIRouter()


@router.get(
    "/transits/today",
    response_model=TransitResponse,
    responses={500: {"model": ErrorResponse}},
)
async def transits_today():
    try:
        result = calculate_transits(date.today().isoformat())
        return result
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": "calculation_failed", "detail": str(e)},
        )


@router.post(
    "/transits/personal",
    response_model=PersonalTransitResponse,
    responses={500: {"model": ErrorResponse}},
)
async def personal_transits(request: PersonalTransitRequest):
    try:
        date_str = request.date or date.today().isoformat()
        natal = [p.model_dump() for p in request.natal_planets]
        result = calculate_personal_transits(natal, request.moon_sign, date_str)
        return result
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": "calculation_failed", "detail": str(e)},
        )
