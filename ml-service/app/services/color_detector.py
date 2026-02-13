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
    normal_percentage: float


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
        return ColorDetectionResult(0.0, 0.0, 0.0, 0.0, 0.0)

    # Priority order: green > yellow > red > chalky > normal
    # Each subsequent mask excludes already-claimed pixels
    remaining = fg_mask.copy()

    # Green
    green_mask = cv2.bitwise_and(_make_mask(hsv, calibration.green), remaining)
    green_px = int(cv2.countNonZero(green_mask))
    remaining = cv2.subtract(remaining, green_mask)

    # Yellow
    yellow_mask = cv2.bitwise_and(_make_mask(hsv, calibration.yellow), remaining)
    yellow_px = int(cv2.countNonZero(yellow_mask))
    remaining = cv2.subtract(remaining, yellow_mask)

    # Red (two ranges ORed)
    red_low = _make_mask(hsv, calibration.red_low)
    red_high = _make_mask(hsv, calibration.red_high)
    red_combined = cv2.bitwise_or(red_low, red_high)
    red_mask = cv2.bitwise_and(red_combined, remaining)
    red_px = int(cv2.countNonZero(red_mask))
    remaining = cv2.subtract(remaining, red_mask)

    # Chalky
    chalky_mask = cv2.bitwise_and(_make_mask(hsv, calibration.chalky), remaining)
    chalky_px = int(cv2.countNonZero(chalky_mask))
    remaining = cv2.subtract(remaining, chalky_mask)

    # Normal = whatever is left in foreground
    normal_px = int(cv2.countNonZero(remaining))

    def pct(px: int) -> float:
        return round((px / valid_count) * 100.0, 2)

    return ColorDetectionResult(
        green_percentage=pct(green_px),
        yellow_percentage=pct(yellow_px),
        red_percentage=pct(red_px),
        chalky_percentage=pct(chalky_px),
        normal_percentage=pct(normal_px),
    )
