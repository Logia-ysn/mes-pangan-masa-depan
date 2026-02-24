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
    damaged_percentage: float
    rotten_percentage: float
    normal_percentage: float
    defect_percentage: float  # damaged + rotten


class AnalyzeResponse(BaseModel):
    green_percentage: float
    yellow_percentage: float
    grade: str
    status: str
    level: int
    supplier: Optional[str] = None
    lot: Optional[str] = None
    # Full breakdown
    red_percentage: Optional[float] = None
    chalky_percentage: Optional[float] = None
    damaged_percentage: Optional[float] = None
    rotten_percentage: Optional[float] = None
    defect_percentage: Optional[float] = None
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
