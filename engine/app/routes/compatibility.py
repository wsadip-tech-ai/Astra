from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.models.schemas import CompatibilityRequest, CompatibilityResponse, ErrorResponse
from app.services.compatibility import calculate_compatibility

router = APIRouter()


@router.post(
    "/compatibility",
    response_model=CompatibilityResponse,
    responses={500: {"model": ErrorResponse}},
)
async def compatibility(request: CompatibilityRequest):
    try:
        chart1 = [p.model_dump() for p in request.chart1_planets]
        chart2 = [p.model_dump() for p in request.chart2_planets]
        result = calculate_compatibility(chart1, chart2)
        return result
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": "calculation_failed", "detail": str(e)},
        )
