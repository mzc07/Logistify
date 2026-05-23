"""Tests para ColaPrioridad (Min-Heap)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from structures.heap import ColaPrioridad


def test_insercion_y_orden_prioridad():
    heap = ColaPrioridad()
    heap.insertar({"id": "PKG003", "desc": "Baja"},  3)
    heap.insertar({"id": "PKG001", "desc": "Alta"},  1)
    heap.insertar({"id": "PKG002", "desc": "Media"}, 2)

    lista = heap.listar()
    # El primero debe ser el de mayor prioridad (número menor)
    assert lista[0]["id"] == "PKG001"
    assert lista[1]["id"] == "PKG002"
    assert lista[2]["id"] == "PKG003"


def test_siguiente_extrae_mayor_prioridad():
    heap = ColaPrioridad()
    heap.insertar({"id": "A", "prioridad": "baja"},  3)
    heap.insertar({"id": "B", "prioridad": "alta"},  1)
    heap.insertar({"id": "C", "prioridad": "media"}, 2)

    primero = heap.siguiente()
    assert primero["id"] == "B"
    segundo = heap.siguiente()
    assert segundo["id"] == "C"


def test_fifo_mismo_nivel_prioridad():
    heap = ColaPrioridad()
    heap.insertar({"id": "X1"}, 2)
    heap.insertar({"id": "X2"}, 2)
    heap.insertar({"id": "X3"}, 2)

    lista = heap.listar()
    ids = [p["id"] for p in lista]
    assert ids == ["X1", "X2", "X3"]


def test_heap_vacio():
    heap = ColaPrioridad()
    assert heap.siguiente() is None
    assert heap.listar() == []


def test_len():
    heap = ColaPrioridad()
    assert len(heap) == 0
    heap.insertar({"id": "A"}, 1)
    heap.insertar({"id": "B"}, 2)
    assert len(heap) == 2


def test_eliminar():
    heap = ColaPrioridad()
    heap.insertar({"id": "A"}, 1)
    heap.insertar({"id": "B"}, 2)
    heap.eliminar("A")
    assert len(heap) == 1
    assert heap.siguiente()["id"] == "B"


def test_actualizar_paquete():
    heap = ColaPrioridad()
    heap.insertar({"id": "PKG", "estado": "pendiente"}, 1)
    heap.actualizar_paquete("PKG", {"estado": "en_transito"})
    pkg = heap.buscar("PKG")
    assert pkg["estado"] == "en_transito"
