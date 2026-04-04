from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.models.schemas import YogaRequest, YogaListResponse, ErrorResponse
from app.services.yogas import detect_yogas

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
