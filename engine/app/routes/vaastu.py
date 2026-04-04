from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.models.schemas import (
    VaastuAnalyzeRequest, VaastuDiagnosticResponse,
    VaastuAayadiRequest, AayadiResult,
    VaastuHitsRequest, VaastuHitsResponse,
    ErrorResponse,
)
from app.services.vaastu.diagnostic import run_vaastu_diagnostic
from app.services.vaastu.aayadi import calculate_aayadi
from app.services.vaastu.hit_calculator import calculate_hits

router = APIRouter()


@router.post(
    "/vaastu/analyze",
    response_model=VaastuDiagnosticResponse,
    responses={500: {"model": ErrorResponse}},
)
async def vaastu_analyze(request: VaastuAnalyzeRequest):
    try:
        vedic_chart = {
            "planets": [p.model_dump() for p in request.planets],
            "dasha": {"current_mahadasha": {"planet": request.dasha_lord}},
        }
        room_details = request.room_details.model_dump() if request.room_details else None
        result = run_vaastu_diagnostic(
            vedic_chart=vedic_chart,
            property=request.property.model_dump(),
            user_nakshatra=request.user_nakshatra,
            room_details=room_details,
            user_name_initial=request.user_name_initial,
        )
        return result
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": "calculation_failed", "detail": str(e)})


@router.post(
    "/vaastu/aayadi",
    response_model=AayadiResult,
    responses={500: {"model": ErrorResponse}},
)
async def vaastu_aayadi(request: VaastuAayadiRequest):
    try:
        result = calculate_aayadi(request.length, request.breadth, request.user_nakshatra)
        return result
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": "calculation_failed", "detail": str(e)})


@router.post(
    "/vaastu/hits",
    response_model=VaastuHitsResponse,
    responses={500: {"model": ErrorResponse}},
)
async def vaastu_hits(request: VaastuHitsRequest):
    try:
        planets = [p.model_dump() for p in request.planets]
        result = calculate_hits(planets, request.dasha_lord)
        return result
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": "calculation_failed", "detail": str(e)})
