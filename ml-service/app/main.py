from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.features import detect_green_percentage
from app.predict import predict_quality
import uvicorn
import base64
from typing import Optional

app = FastAPI(title="QC Gabah ML Service", version="1.0.0")

# Enable CORS for Railway deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeBase64Request(BaseModel):
    image_base64: str
    supplier: Optional[str] = None
    lot: Optional[str] = None

@app.get("/")
def read_root():
    return {"status": "ML Service Running", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/analyze")
async def analyze_grain(file: UploadFile = File(...)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        contents = await file.read()
        green_pct = detect_green_percentage(contents)
        grade, status = predict_quality(green_pct)
        
        return {
            "filename": file.filename,
            "green_percentage": green_pct,
            "grade": grade,
            "status": status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-base64")
async def analyze_grain_base64(request: AnalyzeBase64Request):
    """
    Analyze grain image from base64 encoded string.
    This is the endpoint called by the backend API.
    """
    try:
        # Remove data URI prefix if present
        image_data = request.image_base64
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Decode base64 to bytes
        image_bytes = base64.b64decode(image_data)
        
        # Analyze green percentage
        green_pct = detect_green_percentage(image_bytes)
        
        # Get grade and status
        grade, status = predict_quality(green_pct)
        
        return {
            "green_percentage": green_pct,
            "grade": grade,
            "status": status,
            "supplier": request.supplier,
            "lot": request.lot,
            "level": 1 if grade == "KW 1" else (2 if grade == "KW 2" else 3)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
