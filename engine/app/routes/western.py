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
