from __future__ import annotations

import base64
import cv2
import numpy as np

from app.config import settings


def decode_base64(image_base64: str) -> bytes:
    data = image_base64
    if "," in data:
        data = data.split(",", 1)[1]
    return base64.b64decode(data)


def preprocess(image_bytes: bytes) -> tuple[np.ndarray, np.ndarray, int]:
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")

    height, width = img.shape[:2]
    if width > settings.max_image_width:
        scale = settings.max_image_width / width
        img = cv2.resize(img, (settings.max_image_width, int(height * scale)))

    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    # Foreground mask: exclude white background and very dark pixels
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, white_mask = cv2.threshold(gray, settings.bg_white_threshold, 255, cv2.THRESH_BINARY_INV)
    _, dark_mask = cv2.threshold(gray, settings.bg_dark_threshold, 255, cv2.THRESH_BINARY)
    mask = cv2.bitwise_and(white_mask, dark_mask)

    valid_count = int(cv2.countNonZero(mask))
    return hsv, mask, valid_count
