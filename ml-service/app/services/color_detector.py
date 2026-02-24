import cv2
import numpy as np
from dataclasses import dataclass

from app.models.calibration import CalibrationProfile, ColorRange


@dataclass
class ColorDetectionResult:
    green_percentage: float
    yellow_percentage: float
    red_percentage: float
    chalky_percentage: float
    damaged_percentage: float
    rotten_percentage: float
    normal_percentage: float
    defect_percentage: float  # damaged + rotten


def _make_mask(hsv: np.ndarray, cr: ColorRange) -> np.ndarray:
    lower = np.array([cr.h_min, cr.s_min, cr.v_min])
    upper = np.array([cr.h_max, cr.s_max, cr.v_max])
    return cv2.inRange(hsv, lower, upper)


def detect_colors(
    hsv: np.ndarray,
    fg_mask: np.ndarray,
    valid_count: int,
    calibration: CalibrationProfile,
) -> ColorDetectionResult:
    if valid_count == 0:
        return ColorDetectionResult(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0)

    # Priority order: Rotten > Damaged > Green > Yellow > Red > Chalky > Normal
    # Rotten first because low V range can overlap with others
    # Damaged before yellow because dark brown can be misclassified as yellow
    remaining = fg_mask.copy()

    # 1. Rotten (very dark/black grains)
    rotten_mask = cv2.bitwise_and(_make_mask(hsv, calibration.rotten), remaining)
    rotten_px = int(cv2.countNonZero(rotten_mask))
    remaining = cv2.subtract(remaining, rotten_mask)

    # 2. Damaged (brown/dark damaged grains)
    damaged_mask = cv2.bitwise_and(_make_mask(hsv, calibration.damaged), remaining)
    damaged_px = int(cv2.countNonZero(damaged_mask))
    remaining = cv2.subtract(remaining, damaged_mask)

    # 3. Green (unripe)
    green_mask = cv2.bitwise_and(_make_mask(hsv, calibration.green), remaining)
    green_px = int(cv2.countNonZero(green_mask))
    remaining = cv2.subtract(remaining, green_mask)

    # 4. Yellow (good/ripe)
    yellow_mask = cv2.bitwise_and(_make_mask(hsv, calibration.yellow), remaining)
    yellow_px = int(cv2.countNonZero(yellow_mask))
    remaining = cv2.subtract(remaining, yellow_mask)

    # 5. Red (two ranges ORed)
    red_low = _make_mask(hsv, calibration.red_low)
    red_high = _make_mask(hsv, calibration.red_high)
    red_combined = cv2.bitwise_or(red_low, red_high)
    red_mask = cv2.bitwise_and(red_combined, remaining)
    red_px = int(cv2.countNonZero(red_mask))
    remaining = cv2.subtract(remaining, red_mask)

    # 6. Chalky (white/pale)
    chalky_mask = cv2.bitwise_and(_make_mask(hsv, calibration.chalky), remaining)
    chalky_px = int(cv2.countNonZero(chalky_mask))
    remaining = cv2.subtract(remaining, chalky_mask)

    # 7. Normal = whatever is left in foreground
    normal_px = int(cv2.countNonZero(remaining))

    def pct(px: int) -> float:
        return round((px / valid_count) * 100.0, 2)

    damaged_pct = pct(damaged_px)
    rotten_pct = pct(rotten_px)

    return ColorDetectionResult(
        green_percentage=pct(green_px),
        yellow_percentage=pct(yellow_px),
        red_percentage=pct(red_px),
        chalky_percentage=pct(chalky_px),
        damaged_percentage=damaged_pct,
        rotten_percentage=rotten_pct,
        normal_percentage=pct(normal_px),
        defect_percentage=round(damaged_pct + rotten_pct, 2),
    )
