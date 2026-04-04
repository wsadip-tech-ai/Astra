from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.models.schemas import VedicCompatibilityRequest, VedicCompatibilityResponse, ErrorResponse
from app.services.ashtakoota import calculate_ashtakoota

router = APIRouter()


@router.post(
    "/compatibility/vedic",
    response_model=VedicCompatibilityResponse,
    responses={500: {"model": ErrorResponse}},
)
async def vedic_compatibility(request: VedicCompatibilityRequest):
    try:
        result = calculate_ashtakoota(
            user_moon_sign=request.user_moon_sign,
            user_nakshatra=request.user_nakshatra,
            user_pada=request.user_pada,
            partner_moon_sign=request.partner_moon_sign,
            partner_nakshatra=request.partner_nakshatra,
            partner_pada=request.partner_pada,
            user_mars_house=request.user_mars_house,
            partner_mars_house=request.partner_mars_house,
        )
        return result
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": "calculation_failed", "detail": str(e)},
        )
