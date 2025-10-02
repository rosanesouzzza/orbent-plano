from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.database import get_db
from app import models, schemas

router = APIRouter()


# -------- Plans --------
@router.get("/", response_model=List[schemas.PlanOut])
def list_plans(db: Session = Depends(get_db)):
    plans = db.execute(select(models.Plan)).scalars().all()
    return plans


@router.post("/", response_model=schemas.PlanOut, status_code=status.HTTP_201_CREATED)
def create_plan(payload: schemas.PlanCreate, db: Session = Depends(get_db)):
    plan = models.Plan(**payload.dict())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/{plan_id}", response_model=schemas.PlanOut)
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.get(models.Plan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.get(models.Plan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    db.delete(plan)
    db.commit()
    return None


# -------- Actions (nested) --------
@router.get("/{plan_id}/actions", response_model=List[schemas.ActionOut])
def list_actions(plan_id: int, db: Session = Depends(get_db)):
    plan = db.get(models.Plan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    actions = db.execute(
        select(models.Action).where(models.Action.plan_id == plan_id)
    ).scalars().all()
    return actions


@router.post("/{plan_id}/actions", response_model=schemas.ActionOut, status_code=status.HTTP_201_CREATED)
def create_action(plan_id: int, payload: schemas.ActionCreate, db: Session = Depends(get_db)):
    plan = db.get(models.Plan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    action = models.Action(**payload.dict(), plan_id=plan_id)
    db.add(action)
    db.commit()
    db.refresh(action)
    return action


@router.put("/{plan_id}/actions/{action_id}", response_model=schemas.ActionOut)
def update_action(plan_id: int, action_id: int, payload: schemas.ActionUpdate, db: Session = Depends(get_db)):
    action = db.get(models.Action, action_id)
    if not action or action.plan_id != plan_id:
        raise HTTPException(status_code=404, detail="Action not found")
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(action, field, value)
    db.commit()
    db.refresh(action)
    return action


@router.delete("/{plan_id}/actions/{action_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_action(plan_id: int, action_id: int, db: Session = Depends(get_db)):
    action = db.get(models.Action, action_id)
    if not action or action.plan_id != plan_id:
        raise HTTPException(status_code=404, detail="Action not found")
    db.delete(action)
    db.commit()
    return None
