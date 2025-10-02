from .schemas import Plan, Action, PlanCreate, ActionCreate
from typing import Dict, List

_PLANS: Dict[str, Plan] = {}

def list_plans() -> List[Plan]:
    return list(_PLANS.values())

def create_plan(data: PlanCreate) -> Plan:
    plan = Plan(**data.dict())
    _PLANS[plan.id] = plan
    return plan

def get_plan(plan_id: str) -> Plan | None:
    return _PLANS.get(plan_id)

def list_actions(plan_id: str) -> List[Action]:
    plan = get_plan(plan_id)
    return plan.actions if plan else []

def add_action(plan_id: str, data: ActionCreate) -> Action | None:
    plan = get_plan(plan_id)
    if not plan:
        return None
    action = Action(**data.dict())
    plan.actions.append(action)
    return action
