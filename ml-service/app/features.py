import cv2
import numpy as np

def detect_green_percentage(image_bytes: bytes) -> float:
    """
    Detects the percentage of green area in the grain image.
    Uses HSV color space for better color segmentation.
    """
    # Convert bytes to numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise ValueError("Could not decode image")

    # Resize for consistent processing speed (optional, keeping max width 800)
    height, width = img.shape[:2]
    max_width = 800
    if width > max_width:
        scale = max_width / width
        new_height = int(height * scale)
        img = cv2.resize(img, (max_width, new_height))

    # Convert to HSV
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    # Define Green Range in OpenCV HSV (H: 0-179, S: 0-255, V: 0-255)
    # 60 deg - 180 deg (Green to Cyan) maps to 30 - 90 in OpenCV
    # Adjusted slightly to capture yellowish-green (padi muda)
    lower_green = np.array([30, 40, 40])
    upper_green = np.array([90, 255, 255])

    # Create Mask
    mask = cv2.inRange(hsv, lower_green, upper_green)

    # Calculate percentage
    # We should only count grain pixels (foreground), but for simple approach
    # assuming mostly grain frame, total pixels is fine.
    # Better: Filter background first.
    
    # Simple Background filtering (remove very bright/dark)
    # L (Lightness) in HSL or V in HSV > 10 and < 250
    # Let's use simple mask count for now relative to total image
    # Or relative to non-white/black pixels.
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV) # Exclude bright white background
    
    valid_pixels = cv2.countNonZero(thresh)
    green_pixels = cv2.countNonZero(cv2.bitwise_and(mask, mask, mask=thresh))

    if valid_pixels == 0:
        return 0.0

    percentage = (green_pixels / valid_pixels) * 100.0
    return round(percentage, 2)
