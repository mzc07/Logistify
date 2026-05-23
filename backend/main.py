"""
🚚 Logistify — Backend FastAPI
Endpoints REST para gestión de paquetes y rutas logísticas.
"""
import json
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from structures import GrafoLogistica, ColaPrioridad, BSTPaquetes, ColaTránsito
from models import (
    PaqueteCreate, PaqueteResponse, EstadoUpdate,
    RutaResponse, GrafoResponse, PRIORIDAD_A_NUMERO
)
import database as db

# ── Inicialización ────────────────────────────────────────────────────────────

app = FastAPI(
    title="🚚 Logistify API",
    description="Sistema de gestión de paquetes y rutas logísticas.\n"
                "Utiliza **Grafos + Dijkstra**, **Min-Heap**, **BST** y **Cola FIFO**.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Estructuras de datos en memoria ──────────────────────────────────────────

grafo     = GrafoLogistica()
heap      = ColaPrioridad()
bst       = BSTPaquetes()
cola_tran = ColaTránsito()


def _cargar_grafo():
    ciudades_json = Path(__file__).parent / "data" / "ciudades.json"
    with open(ciudades_json, encoding="utf-8") as f:
        data = json.load(f)
    grafo.cargar_desde_json(data)


def _cargar_paquetes_desde_db():
    """Al iniciar, recarga los paquetes de SQLite en las estructuras en memoria."""
    paquetes = db.obtener_todos()
    for pkg in paquetes:
        prioridad_num = {"alta": 1, "media": 2, "baja": 3}.get(pkg["prioridad"], 2)
        heap.insertar(pkg, prioridad_num)
        bst.insertar(pkg["id"], pkg)
        if pkg["estado"] == "en_transito":
            cola_tran.encolar(pkg)


@app.on_event("startup")
def startup():
    db.init_db()
    _cargar_grafo()
    _cargar_paquetes_desde_db()


# ── Endpoints de Paquetes ─────────────────────────────────────────────────────

@app.post("/paquetes", response_model=PaqueteResponse, status_code=201,
          summary="Crear un nuevo paquete", tags=["Paquetes"])
def crear_paquete(data: PaqueteCreate):
    """
    Crea un paquete y calcula automáticamente la ruta más corta (Dijkstra).
    Inserta en Min-Heap (por prioridad) y BST (por ID).
    """
    if data.origen == data.destino:
        raise HTTPException(400, "El origen y el destino deben ser diferentes.")

    # Verificar ciudades existen en el grafo
    ciudades = grafo.obtener_nodos()
    if data.origen not in ciudades:
        raise HTTPException(400, f"Ciudad origen '{data.origen}' no existe en el sistema.")
    if data.destino not in ciudades:
        raise HTTPException(400, f"Ciudad destino '{data.destino}' no existe en el sistema.")

    # Dijkstra para ruta más corta
    distancia, ruta = grafo.dijkstra(data.origen, data.destino)
    if distancia == float('inf'):
        raise HTTPException(400, f"No existe ruta entre '{data.origen}' y '{data.destino}'.")

    paquete = {
        "id":           str(uuid.uuid4())[:8].upper(),
        "origen":       data.origen,
        "destino":      data.destino,
        "descripcion":  data.descripcion,
        "peso_kg":      data.peso_kg,
        "prioridad":    data.prioridad.value,
        "estado":       "pendiente",
        "distancia_km": distancia,
        "ruta":         ruta,
        "creado_en":    datetime.now().isoformat(),
    }

    # Insertar en estructuras de datos
    prioridad_num = PRIORIDAD_A_NUMERO[data.prioridad]
    heap.insertar(paquete, prioridad_num)
    bst.insertar(paquete["id"], paquete)

    # Persistir en SQLite
    db.guardar_paquete(paquete)

    return paquete


@app.get("/paquetes", response_model=list[PaqueteResponse],
         summary="Listar todos los paquetes (ordenados por prioridad)", tags=["Paquetes"])
def listar_paquetes():
    """
    Retorna los paquetes ordenados por prioridad usando el Min-Heap.
    """
    return heap.listar()


@app.get("/paquetes/{id_paquete}", response_model=PaqueteResponse,
         summary="Buscar paquete por ID usando BST", tags=["Paquetes"])
def obtener_paquete(id_paquete: str):
    """
    Busca un paquete por su ID en el Árbol BST. O(log n) promedio.
    """
    paquete = bst.buscar(id_paquete.upper())
    if not paquete:
        raise HTTPException(404, f"Paquete '{id_paquete}' no encontrado.")
    return paquete


@app.put("/paquetes/{id_paquete}/estado", response_model=PaqueteResponse,
         summary="Actualizar estado de un paquete", tags=["Paquetes"])
def actualizar_estado(id_paquete: str, body: EstadoUpdate):
    """
    Cambia el estado: pendiente → en_transito → entregado.
    Mueve el paquete a la Cola FIFO si pasa a en_transito.
    """
    paquete = bst.buscar(id_paquete.upper())
    if not paquete:
        raise HTTPException(404, f"Paquete '{id_paquete}' no encontrado.")

    nuevo_estado = body.estado.value
    paquete_actualizado = {**paquete, "estado": nuevo_estado}

    # Actualizar en todas las estructuras
    bst.actualizar(id_paquete.upper(), paquete_actualizado)
    heap.actualizar_paquete(id_paquete.upper(), {"estado": nuevo_estado})
    db.actualizar_estado(id_paquete.upper(), nuevo_estado)

    # Cola de tránsito: agregar al entrar, remover al salir
    if nuevo_estado == "en_transito":
        if not cola_tran.buscar(id_paquete.upper()):
            cola_tran.encolar(paquete_actualizado)
    elif nuevo_estado in ("entregado", "cancelado"):
        cola_tran.eliminar(id_paquete.upper())

    return paquete_actualizado


@app.delete("/paquetes/{id_paquete}", status_code=204,
            summary="Eliminar un paquete", tags=["Paquetes"])
def eliminar_paquete(id_paquete: str):
    paquete = bst.buscar(id_paquete.upper())
    if not paquete:
        raise HTTPException(404, f"Paquete '{id_paquete}' no encontrado.")

    bst.eliminar(id_paquete.upper())
    heap.eliminar(id_paquete.upper())
    cola_tran.eliminar(id_paquete.upper())
    db.eliminar_paquete(id_paquete.upper())


# ── Endpoints de Grafo y Rutas ────────────────────────────────────────────────

@app.get("/grafo", response_model=GrafoResponse,
         summary="Obtener el grafo completo para Cytoscape.js", tags=["Grafo"])
def obtener_grafo():
    """
    Retorna nodos y aristas del grafo en formato listo para Cytoscape.js.
    """
    return grafo.para_cytoscape()


@app.get("/ruta", response_model=RutaResponse,
         summary="Calcular ruta más corta (Dijkstra)", tags=["Grafo"])
def calcular_ruta(origen: str, destino: str):
    """
    Calcula la ruta más corta entre dos ciudades usando el algoritmo de Dijkstra.
    """
    ciudades = grafo.obtener_nodos()
    if origen not in ciudades or destino not in ciudades:
        raise HTTPException(400, "Una o ambas ciudades no existen en el sistema.")

    distancia, ruta = grafo.dijkstra(origen, destino)
    return {
        "origen":       origen,
        "destino":      destino,
        "distancia_km": distancia if distancia != float('inf') else -1,
        "ruta":         ruta,
        "posible":      distancia != float('inf'),
    }


@app.get("/ciudades", summary="Listar ciudades disponibles", tags=["Grafo"])
def listar_ciudades():
    return {"ciudades": sorted(grafo.obtener_nodos())}


@app.get("/transito", summary="Paquetes actualmente en tránsito (Cola FIFO)", tags=["Paquetes"])
def paquetes_en_transito():
    return {"en_transito": cola_tran.listar(), "cantidad": len(cola_tran)}


@app.get("/", include_in_schema=False)
def root():
    return {"message": "🚚 Logistify API corriendo. Visita /docs para la documentación interactiva."}
