from fastapi import FastAPI, UploadFile, File, HTTPException
from app.features import detect_green_percentage
from app.predict import predict_quality
import uvicorn

app = FastAPI(title="QC Gabah ML Service", version="1.0.0")

@app.get("/")
def read_root():
    return {"status": "ML Service Running"}

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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
