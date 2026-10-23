import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router

app = FastAPI(
    title="Smart Pharmacy Inventory Management System API",
    description="Backend for pharmacy inventory, demand forecasting, intelligent reorder predictions, and business intelligence reporting.",
    version="1.0.0"
)

# Enable CORS for React frontend (Vite defaults to http://localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": "Smart Pharmacy Inventory Management System",
        "apis": "/api",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
