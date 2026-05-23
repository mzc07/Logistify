"""
Capa de persistencia con SQLite.
Guarda y recupera paquetes de la base de datos.
"""
import sqlite3
import json
from pathlib import Path

DB_PATH = Path(__file__).parent / "logistify.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row  # Permite acceder a columnas por nombre
    return conn


def init_db():
    """Crea la tabla si no existe."""
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS paquetes (
                id           TEXT PRIMARY KEY,
                origen       TEXT NOT NULL,
                destino      TEXT NOT NULL,
                descripcion  TEXT NOT NULL,
                peso_kg      REAL NOT NULL,
                prioridad    TEXT NOT NULL,
                estado       TEXT NOT NULL DEFAULT 'pendiente',
                distancia_km REAL NOT NULL DEFAULT 0,
                ruta         TEXT NOT NULL DEFAULT '[]',
                creado_en    TEXT NOT NULL
            )
        """)
        conn.commit()


def guardar_paquete(paquete: dict):
    with get_connection() as conn:
        conn.execute("""
            INSERT OR REPLACE INTO paquetes
            (id, origen, destino, descripcion, peso_kg, prioridad, estado, distancia_km, ruta, creado_en)
            VALUES (:id, :origen, :destino, :descripcion, :peso_kg, :prioridad, :estado, :distancia_km, :ruta, :creado_en)
        """, {**paquete, "ruta": json.dumps(paquete["ruta"])})
        conn.commit()


def obtener_todos() -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM paquetes ORDER BY creado_en DESC").fetchall()
        return [_row_to_dict(row) for row in rows]


def obtener_por_id(id_paquete: str) -> dict | None:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM paquetes WHERE id = ?", (id_paquete,)
        ).fetchone()
        return _row_to_dict(row) if row else None


def actualizar_estado(id_paquete: str, nuevo_estado: str) -> bool:
    with get_connection() as conn:
        cursor = conn.execute(
            "UPDATE paquetes SET estado = ? WHERE id = ?",
            (nuevo_estado, id_paquete)
        )
        conn.commit()
        return cursor.rowcount > 0


def eliminar_paquete(id_paquete: str) -> bool:
    with get_connection() as conn:
        cursor = conn.execute("DELETE FROM paquetes WHERE id = ?", (id_paquete,))
        conn.commit()
        return cursor.rowcount > 0


def _row_to_dict(row: sqlite3.Row) -> dict:
    d = dict(row)
    d["ruta"] = json.loads(d["ruta"])
    return d
