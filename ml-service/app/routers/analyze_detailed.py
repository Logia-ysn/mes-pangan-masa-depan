import time

from fastapi import APIRouter, HTTPException

from app.models.requests import AnalyzeDetailedRequest
from app.models.responses import DetailedAnalyzeResponse, ColorBreakdown
from app.services.image_processor import decode_base64, preprocess
from app.services.color_detector import detect_colors
from app.services.grading_service import determine_grade
from app.services.calibration_store import calibration_store

router = APIRouter()


@router.post("/analyze-detailed")
async def analyze_detailed(request: AnalyzeDetailedRequest):
    try:
        start = time.perf_counter()

        profile = request.calibration or calibration_store.get_profile()
        rules = request.grading_rules or calibration_store.get_grading().rules

        image_bytes = decode_base64(request.image_base64)
        hsv, mask, valid_count = preprocess(image_bytes)
        colors = detect_colors(hsv, mask, valid_count, profile)
        grade, level, status = determine_grade(colors.green_percentage, rules)

        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

        return DetailedAnalyzeResponse(
            colors=ColorBreakdown(
                green_percentage=colors.green_percentage,
                yellow_percentage=colors.yellow_percentage,
                red_percentage=colors.red_percentage,
                chalky_percentage=colors.chalky_percentage,
                normal_percentage=colors.normal_percentage,
            ),
            grade=grade,
            status=status,
            level=level,
            supplier=request.supplier,
            lot=request.lot,
            calibration_used=profile,
            grading_rules_used=rules,
            processing_time_ms=elapsed_ms,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
