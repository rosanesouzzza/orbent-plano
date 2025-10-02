from typing import Optional, Literal
from datetime import date
from pydantic import BaseModel, Field


# ---------- Plan ----------
class PlanBase(BaseModel):
    name: str = Field(..., examples=["Plano Piloto"])
    owner: str = Field(..., examples=["Rosa"])


class PlanCreate(PlanBase):
    pass


class PlanOut(PlanBase):
    id: int

    class Config:
        from_attributes = True


# ---------- Action ----------
StatusLiteral = Literal["PENDING", "IN_PROGRESS", "DONE"]


class ActionBase(BaseModel):
    title: str
    status: StatusLiteral
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    department: Optional[str] = None
    pillar: Optional[str] = None


class ActionCreate(ActionBase):
    pass


class ActionUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[StatusLiteral] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    department: Optional[str] = None
    pillar: Optional[str] = None


class ActionOut(ActionBase):
    id: int
    plan_id: int

    class Config:
        from_attributes = True
