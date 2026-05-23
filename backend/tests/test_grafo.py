"""Tests para GrafoLogistica y Dijkstra."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from structures.grafo import GrafoLogistica


def grafo_ejemplo() -> GrafoLogistica:
    g = GrafoLogistica()
    g.agregar_ruta("Bogotá",      "Medellín",    420)
    g.agregar_ruta("Bogotá",      "Bucaramanga", 390)
    g.agregar_ruta("Medellín",    "Cali",        260)
    g.agregar_ruta("Bucaramanga", "Cúcuta",      200)
    g.agregar_ruta("Cali",        "Pasto",       230)
    g.agregar_ruta("Medellín",    "Bogotá",      420)
    g.agregar_ruta("Bogotá",      "Cali",        460)
    return g


def test_dijkstra_ruta_directa():
    g = grafo_ejemplo()
    costo, ruta = g.dijkstra("Bogotá", "Medellín")
    assert costo == 420
    assert ruta == ["Bogotá", "Medellín"]


def test_dijkstra_ruta_indirecta():
    g = grafo_ejemplo()
    # Bogotá → Medellín → Cali = 680 vs Bogotá → Cali = 460
    costo, ruta = g.dijkstra("Bogotá", "Cali")
    assert costo == 460
    assert "Cali" in ruta


def test_dijkstra_ruta_larga():
    g = grafo_ejemplo()
    costo, ruta = g.dijkstra("Bogotá", "Pasto")
    # Bogotá → Cali(460) → Pasto(230) = 690
    # Bogotá → Medellín(420) → Cali(260) → Pasto(230) = 910
    assert costo == 690
    assert ruta[0] == "Bogotá"
    assert ruta[-1] == "Pasto"


def test_dijkstra_sin_ruta():
    g = grafo_ejemplo()
    costo, ruta = g.dijkstra("Pasto", "Cúcuta")
    assert costo == float('inf')
    assert ruta == []


def test_dijkstra_origen_igual_destino():
    g = grafo_ejemplo()
    costo, ruta = g.dijkstra("Bogotá", "Bogotá")
    assert costo == 0
    assert ruta == ["Bogotá"]


def test_nodos_y_aristas():
    g = grafo_ejemplo()
    nodos = g.obtener_nodos()
    assert "Bogotá" in nodos
    assert "Pasto" in nodos
    aristas = g.obtener_aristas()
    assert len(aristas) > 0


def test_para_cytoscape():
    g = grafo_ejemplo()
    cy = g.para_cytoscape()
    assert "nodos" in cy
    assert "aristas" in cy
    assert len(cy["nodos"]) > 0
