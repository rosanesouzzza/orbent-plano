import os
from .schemas import AIRequest

API_KEY = os.getenv("GEMINI_API_KEY")

def suggest_actions(req: AIRequest) -> list[dict]:
    base = (req.prompt or "Objective").strip()[:50]
    return [
        {"title": f"{base} – Diagnóstico", "description": "Mapear gaps, riscos e stakeholders."},
        {"title": f"{base} – Plano de Ação", "description": "Definir responsáveis, prazos e KPIs."},
        {"title": f"{base} – Execução & Monitoramento", "description": "Rodar sprints e medir resultados."},
    ]

def summarize_plan(plan) -> str:
    return f"# Executive Summary – {plan.name}\n\nAções: {len(plan.actions)}. Origem: {plan.origin or 'N/D'}."

def decompose_action(text: str) -> list[dict]:
    return [
        {"title": "Quebrar requisitos", "description": "Elencar subitens e dependências."},
        {"title": "Definir prazos", "description": "Estimar esforço e marcos."},
        {"title": "Atribuir responsáveis", "description": "Mapear quem faz o quê."},
    ]
