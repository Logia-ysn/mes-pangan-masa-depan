import sys
import json
import cv2
import numpy as np
import os

def detect(image_path):
    try:
        if not os.path.exists(image_path):
            return {"error": "File not found"}
        
        img = cv2.imread(image_path)
        if img is None:
            return {"error": "Could not read image"}

        # Resize for performance
        height, width = img.shape[:2]
        max_width = 800
        if width > max_width:
            scale = max_width / width
            new_height = int(height * scale)
            img = cv2.resize(img, (max_width, new_height))

        # HSV Conversion
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        # Ranges
        grade = "KW 3"
        level = 1
        status = "WARNING"
        
        # Grading & Calibration Logic
        config_rules = []
        calibration = {}
        
        if len(sys.argv) > 2:
            try:
                config_raw = sys.argv[2]
                payload = json.loads(config_raw)
                
                # Support both old format (list of rules) and new format (object)
                if isinstance(payload, list):
                    config_rules = payload
                elif isinstance(payload, dict):
                    config_rules = payload.get('grading_rules', [])
                    calibration = payload.get('calibration', {})
            except Exception as e:
                # print(f"[ML-ERROR] Failed to load config: {e}")
                pass
        
        # Apply Calibration if exists
        # Green Defaults
        g_h_min, g_h_max = 25, 95
        g_s_min, g_s_max = 25, 255
        g_v_min, g_v_max = 40, 255
        
        if 'green' in calibration:
            g_h_min = int(calibration['green'].get('hue', [25, 95])[0])
            g_h_max = int(calibration['green'].get('hue', [25, 95])[1])
            g_s_min = int(calibration['green'].get('sat', [25, 255])[0])
            g_s_max = int(calibration['green'].get('sat', [25, 255])[1])
            g_v_min = int(calibration['green'].get('val', [40, 255])[0])
            g_v_max = int(calibration['green'].get('val', [40, 255])[1])

        lower_green = np.array([g_h_min, g_s_min, g_v_min])
        upper_green = np.array([g_h_max, g_s_max, g_v_max])
        
        # Yellow Defaults (we focus on green for now, but good to have structure)
        y_h_min, y_h_max = 10, 25
        y_s_min, y_s_max = 40, 255
        y_v_min, y_v_max = 40, 255
        
        if 'yellow' in calibration:
            y_h_min = int(calibration['yellow'].get('hue', [10, 25])[0])
            y_h_max = int(calibration['yellow'].get('hue', [10, 25])[1])
            y_s_min = int(calibration['yellow'].get('sat', [40, 255])[0])
            y_s_max = int(calibration['yellow'].get('sat', [40, 255])[1])
            y_v_min = int(calibration['yellow'].get('val', [40, 255])[0])
            y_v_max = int(calibration['yellow'].get('val', [40, 255])[1])
            
        lower_yellow = np.array([y_h_min, y_s_min, y_v_min])
        upper_yellow = np.array([y_h_max, y_s_max, y_v_max])

        mask_green = cv2.inRange(hsv, lower_green, upper_green)
        mask_yellow = cv2.inRange(hsv, lower_yellow, upper_yellow)

        # Background Filter
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV) # Exclude white background
        
        valid_pixels = cv2.countNonZero(thresh)
        if valid_pixels == 0:
             return {"green_percentage": 0, "grade": "Unknown", "status": "Error"}

        green_pixels = cv2.countNonZero(cv2.bitwise_and(mask_green, mask_green, mask=thresh))
        
        green_pct = round((green_pixels / valid_pixels) * 100, 2)
        
        # Grading Logic
        # KW 1: Green < 10%
        # KW 2: Green < 20%
        # KW 3: Green >= 20%
        
        # Grading Logic with Levels
        # KW 1: 
        #   Level 1: < 3%
        #   Level 2: < 5%
        #   Level 3: < 10%
        # KW 2:
        #   Level 1: < 15%
        #   Level 2: < 20%
        # KW 3: >= 20%
        
        # Grading Logic: Dynamic (if config provided) or Fallback
        
        if config_rules:
            # Sort by min_value ascending to ensure we match correct range
            # Strategy: Find the first rule where green_pct fits [min, max]
            # Actually, usually ranges are exclusive/sequences. 
            # Let's verify standard: "KW 1 Level 1" might be 0-3. "KW 1 Level 2" might be 3-5.
            
            matched = False
            
            # Sort to ensure check order (priority to better grades usually, or just check range inclusion)
            # Assuming configs are clean ranges.
            for rule in config_rules:
                min_v = float(rule.get('min_value', 0))
                max_v = float(rule.get('max_value', 100))
                
                # Check inclusion: min <= pct < max  (Strict inequality for max usually better for non-overlap, 
                # but if last one is 100, we need <=)
                # Let's use <= for max to be safe for inclusive ranges.
                if min_v <= green_pct <= max_v:
                    grade = rule.get('grade', 'Unknown')
                    level = int(rule.get('level', 1))
                    status = "OK" 
                    # Logic: If grade is KW 3 or Out of Range, status might be WARNING/REJECT.
                    # We can infer status or pass it. For now hardcode simple logic:
                    if grade == 'KW 3' or grade == 'REJECT':
                        status = "WARNING"
                    
                    matched = True
                    break
            
            if not matched:
                # If no range matches, assume worst case
                grade = "REJECT"
                level = 99
                status = "REJECT"
                
        else:
            # Fallback Logic (Hardcoded)
            if green_pct < 3.0:
                grade = "KW 1"
                level = 1
                status = "OK"
            elif green_pct < 5.0:
                grade = "KW 1"
                level = 2
                status = "OK"
            elif green_pct < 10.0:
                grade = "KW 1"
                level = 3
                status = "OK"
            elif green_pct < 15.0:
                grade = "KW 2"
                level = 1
                status = "OK"
            elif green_pct < 20.0:
                grade = "KW 2"
                level = 2
                status = "WARNING"


        return {
            "green_percentage": green_pct,
            "grade": grade,
            "level": level,
            "status": status
        }

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            print(json.dumps({"error": "No image path provided"}))
            sys.exit(1)
        
        path = sys.argv[1]
        result = detect(path)
        print(json.dumps(result))
    except Exception as e:
        # Catch-all to ensure we always print JSON
        print(json.dumps({"error": f"Unhandled ML Error: {str(e)}"}))
        sys.exit(1)
