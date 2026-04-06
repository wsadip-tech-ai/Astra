from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.models.schemas import YogaRequest, YogaListResponse, ErrorResponse
from app.services.yogas import detect_yogas
from app.services.future_yogas import predict_upcoming_yogas

router = APIRouter()


@router.post(
    "/yogas",
    response_model=YogaListResponse,
    responses={500: {"model": ErrorResponse}},
)
async def yogas(request: YogaRequest):
    try:
        planets = [p.model_dump() for p in request.planets]
        result = detect_yogas(planets, request.lagna_sign)
        return {"yogas": result}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": "calculation_failed", "detail": str(e)},
        )


@router.post("/yogas/predict")
async def predict_yogas(request: dict):
    try:
        natal_moon_sign = request.get("natal_moon_sign")
        if not natal_moon_sign:
            return JSONResponse(status_code=400, content={"error": "natal_moon_sign required"})

        result = predict_upcoming_yogas(
            natal_moon_sign=natal_moon_sign,
            from_date=request.get("from_date"),
            years_ahead=request.get("years_ahead", 3),
        )
        return result
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": "prediction_failed", "detail": str(e)},
        )
