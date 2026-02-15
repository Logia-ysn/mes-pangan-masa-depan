from typing import Optional

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.models.requests import AnalyzeBase64Request
from app.models.responses import AnalyzeResponse
from app.services.image_processor import decode_base64, preprocess
from app.services.color_detector import detect_colors
from app.services.grading_service import determine_grade
from app.services.calibration_store import calibration_store

import logging
router = APIRouter()
logger = logging.getLogger(__name__)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def _analyze(image_bytes: bytes, supplier: Optional[str], lot: Optional[str]) -> AnalyzeResponse:
    profile = calibration_store.get_profile()
    grading = calibration_store.get_grading()

    hsv, mask, valid_count = preprocess(image_bytes)
    colors = detect_colors(hsv, mask, valid_count, profile)
    grade, level, status = determine_grade(colors.green_percentage, grading.rules)

    return AnalyzeResponse(
        green_percentage=colors.green_percentage,
        grade=grade,
        status=status,
        level=level,
        supplier=supplier,
        lot=lot,
        yellow_percentage=colors.yellow_percentage,
        red_percentage=colors.red_percentage,
        chalky_percentage=colors.chalky_percentage,
        normal_percentage=colors.normal_percentage,
    )


@router.post("/analyze")
async def analyze_grain(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    try:
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
             raise HTTPException(status_code=413, detail="File too large. Max 10MB.")
        result = _analyze(contents, None, None)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal analysis error")


@router.post("/analyze-base64")
async def analyze_grain_base64(request: AnalyzeBase64Request):
    try:
        image_bytes = decode_base64(request.image_base64)
        if len(image_bytes) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="Image too large. Max 10MB.")
        return _analyze(image_bytes, request.supplier, request.lot)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Base64 analysis failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal analysis error")
