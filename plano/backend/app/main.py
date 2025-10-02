from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import plans, reports
from app.database import init_db

app = FastAPI(title="Orbent Action Plan API", version="0.1.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# inicializa banco
init_db()

# inclui rotas
app.include_router(plans.router, prefix="/plans", tags=["plans"])
app.include_router(reports.router, prefix="/reports", tags=["reports"])

@app.get("/")
def root():
    return {"message": "Orbent backend rodando!"}
