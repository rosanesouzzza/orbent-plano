# app/migrate.py
from app.database import engine

def _columns(table: str) -> set[str]:
    with engine.connect() as conn:
        rows = conn.exec_driver_sql(f"PRAGMA table_info({table})")
        return {row[1] for row in rows}

def _add(table: str, column: str, ddl: str):
    with engine.connect() as conn:
        conn.exec_driver_sql(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}")

def run():
    cols = _columns("actions")
    if "department" not in cols:
        _add("actions", "department", "VARCHAR")
    if "pillar" not in cols:
        _add("actions", "pillar", "VARCHAR")
