from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.models.schemas import DashaRequest, FullDashaResponse, ErrorResponse
from app.services.dasha import calculate_vimshottari_dasha

router = APIRouter()


@router.post(
    "/dasha",
    response_model=FullDashaResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def dasha(request: DashaRequest):
    if not (0 <= request.moon_longitude < 360):
        return JSONResponse(status_code=400, content={"error": "moon_longitude must be 0-360"})
    try:
        result = calculate_vimshottari_dasha(request.moon_longitude, request.date_of_birth)
        return result
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": "calculation_failed", "detail": str(e)},
        )
