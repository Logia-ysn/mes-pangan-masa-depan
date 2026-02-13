from __future__ import annotations

from pydantic import BaseModel
from typing import Optional

from app.models.calibration import CalibrationProfile
from app.models.grading import GradingRule


class ColorBreakdown(BaseModel):
    green_percentage: float
    yellow_percentage: float
    red_percentage: float
    chalky_percentage: float
    normal_percentage: float


class AnalyzeResponse(BaseModel):
    green_percentage: float
    grade: str
    status: str
    level: int
    supplier: Optional[str] = None
    lot: Optional[str] = None
    # New optional fields (backward-compatible)
    yellow_percentage: Optional[float] = None
    red_percentage: Optional[float] = None
    chalky_percentage: Optional[float] = None
    normal_percentage: Optional[float] = None


class DetailedAnalyzeResponse(BaseModel):
    colors: ColorBreakdown
    grade: str
    status: str
    level: int
    supplier: Optional[str] = None
    lot: Optional[str] = None
    calibration_used: CalibrationProfile
    grading_rules_used: list[GradingRule]
    processing_time_ms: float
