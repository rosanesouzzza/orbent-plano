# plano/backend/app/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import plans, reports
from app.database import init_db

app = FastAPI(title="Orbent Action Plan API", version="0.1.0")

origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
ALLOWED_ORIGINS = [o.strip() for o in origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

app.include_router(plans.router, prefix="/plans", tags=["plans"])
app.include_router(reports.router, prefix="/reports", tags=["reports"])

@app.get("/")
def root():
    return {"message": "Orbent backend rodando!"}
