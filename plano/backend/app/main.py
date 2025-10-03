# app/main.py
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="Orbent Plano API")

# CORS
_allowed = os.getenv("ALLOWED_ORIGINS", "").split(",")
origins = [o.strip() for o in _allowed if o.strip()]
if not origins:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health/Meta
@app.get("/healthz", tags=["meta"])
def healthz():
    return {"status": "ok"}

@app.head("/", tags=["meta"])
def head_root():
    # alguns ambientes fazem HEAD /
    return Response(status_code=200)

@app.get("/", tags=["meta"])
def root():
    return {"ok": True}

# Rotas de negócio
from app.routers import plans, reports
app.include_router(plans.router, prefix="/plans", tags=["plans"])
app.include_router(reports.router, prefix="/reports", tags=["reports"])
