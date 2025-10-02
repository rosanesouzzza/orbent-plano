from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from app.database import get_db
from app import models

router = APIRouter()


@router.get("/summary")
def summary(plan_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    plan = db.get(models.Plan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # contagem por status
    status_counts = dict(
        db.execute(
            select(models.Action.status, func.count())
            .where(models.Action.plan_id == plan_id)
            .group_by(models.Action.status)
        ).all()
    )

    # por departamento
    dept_counts = dict(
        db.execute(
            select(models.Action.department, func.count())
            .where(models.Action.plan_id == plan_id)
            .group_by(models.Action.department)
        ).all()
    )

    # por pilar
    pillar_counts = dict(
        db.execute(
            select(models.Action.pillar, func.count())
            .where(models.Action.plan_id == plan_id)
            .group_by(models.Action.pillar)
        ).all()
    )

    total = sum(status_counts.values()) if status_counts else 0

    return {
        "plan": {"id": plan.id, "name": plan.name, "owner": plan.owner},
        "total_actions": total,
        "by_status": status_counts,
        "by_department": dept_counts,
        "by_pillar": pillar_counts,
    }
