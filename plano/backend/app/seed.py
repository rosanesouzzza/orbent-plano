# app/seed.py
from __future__ import annotations

from datetime import date, timedelta
from typing import Iterable

from sqlalchemy.orm import Session

from app.database import Base, engine, SessionLocal
from app import models


# ---------- helpers ----------
def upsert_plan(db: Session, *, name: str, owner: str) -> models.Plan:
    plan = db.query(models.Plan).filter(
        models.Plan.name == name, models.Plan.owner == owner
    ).first()
    if plan is None:
        plan = models.Plan(name=name, owner=owner)
        db.add(plan)
        db.flush()  # garante .id sem precisar commit ainda
    return plan


def add_actions_if_missing(
    db: Session, plan: models.Plan, actions: Iterable[dict]
) -> None:
    for a in actions:
        exists = (
            db.query(models.Action)
            .filter(
                models.Action.plan_id == plan.id,
                models.Action.title == a["title"],
            )
            .first()
        )
        if exists:
            continue
        rec = models.Action(
            title=a["title"],
            status=a["status"],
            start_date=a.get("start_date"),
            end_date=a.get("end_date"),
            department=a.get("department"),
            pillar=a.get("pillar"),
            plan_id=plan.id,
        )
        db.add(rec)


def sample_actions(today: date) -> list[dict]:
    d = today
    td = timedelta

    return [
        # Qualidade / Auditoria
        dict(
            title="Treinamento ISO 9001",
            status="PENDING",
            start_date=d + td(days=2),
            end_date=d + td(days=12),
            department="Qualidade",
            pillar="Auditoria",
        ),
        dict(
            title="Revisão dos POPs",
            status="IN_PROGRESS",
            start_date=d + td(days=5),
            end_date=d + td(days=14),
            department="Operações",
            pillar="Padronização",
        ),
        dict(
            title="Calibração de Equipamentos",
            status="DONE",
            start_date=d - td(days=4),
            end_date=d - td(days=1),
            department="Manutenção",
            pillar="Confiabilidade",
        ),
        # RH
        dict(
            title="Onboarding turma de outubro",
            status="IN_PROGRESS",
            start_date=d - td(days=1),
            end_date=d + td(days=20),
            department="RH",
            pillar="Desenvolvimento",
        ),
        dict(
            title="Pesquisa de clima semestral",
            status="PENDING",
            start_date=d + td(days=10),
            end_date=d + td(days=25),
            department="RH",
            pillar="Engajamento",
        ),
        # Segurança
        dict(
            title="NR-10 reciclagem",
            status="PENDING",
            start_date=d + td(days=7),
            end_date=d + td(days=10),
            department="Segurança",
            pillar="Compliance",
        ),
        # Finanças
        dict(
            title="Fechamento trimestral Q4",
            status="IN_PROGRESS",
            start_date=d - td(days=3),
            end_date=d + td(days=4),
            department="Financeiro",
            pillar="Governança",
        ),
        dict(
            title="Renegociação com fornecedor A",
            status="PENDING",
            start_date=d + td(days=6),
            end_date=d + td(days=15),
            department="Suprimentos",
            pillar="Custo",
        ),
        # Operações
        dict(
            title="SMED – Linha 2",
            status="PENDING",
            start_date=d + td(days=8),
            end_date=d + td(days=18),
            department="Operações",
            pillar="Produtividade",
        ),
        dict(
            title="5S – auditoria mensal",
            status="DONE",
            start_date=d - td(days=30),
            end_date=d - td(days=29),
            department="Operações",
            pillar="Excelência Operacional",
        ),
    ]


# ---------- main ----------
def run() -> None:
    # cria tabelas se ainda não existirem
    Base.metadata.create_all(bind=engine)

    today = date.today()

    with SessionLocal() as db:
        with db.begin():  # transação com commit automático
            plan = upsert_plan(db, name="Plano Piloto", owner="Rosa")
            add_actions_if_missing(db, plan, sample_actions(today))
            # refresh para garantir campos atualizados (evita DetachedInstanceError)
            db.refresh(plan)

        # prints fora da transação, objeto já está “refrescado”
        total_actions = (
            db.query(models.Action).filter(models.Action.plan_id == plan.id).count()
        )

    print(f"[seed] OK. Plano id={plan.id}, name={plan.name}, owner={plan.owner}")
    print(f"[seed] Ações no plano: {total_actions}")


if __name__ == "__main__":
    run()
