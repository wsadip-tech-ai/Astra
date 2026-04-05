from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.models.schemas import ErrorResponse
from app.services.personality import analyze_personality

router = APIRouter()


@router.post(
    "/chart/personality",
    responses={500: {"model": ErrorResponse}},
)
async def personality_analysis(request: dict):
    try:
        result = analyze_personality(request)
        return result
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": "analysis_failed", "detail": str(e)},
        )
