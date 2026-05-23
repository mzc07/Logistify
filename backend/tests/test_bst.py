"""Tests para BSTPaquetes (Árbol Binario de Búsqueda)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from structures.bst import BSTPaquetes


def test_insertar_y_buscar():
    bst = BSTPaquetes()
    bst.insertar("PKG001", {"id": "PKG001", "destino": "Cali"})
    resultado = bst.buscar("PKG001")
    assert resultado is not None
    assert resultado["destino"] == "Cali"


def test_buscar_inexistente():
    bst = BSTPaquetes()
    assert bst.buscar("NOEXISTE") is None


def test_inorden_ordenado():
    bst = BSTPaquetes()
    bst.insertar("PKG003", {"id": "PKG003"})
    bst.insertar("PKG001", {"id": "PKG001"})
    bst.insertar("PKG002", {"id": "PKG002"})

    lista = bst.inorden()
    ids = [p["id"] for p in lista]
    assert ids == ["PKG001", "PKG002", "PKG003"]


def test_actualizar():
    bst = BSTPaquetes()
    bst.insertar("PKG001", {"id": "PKG001", "estado": "pendiente"})
    bst.actualizar("PKG001", {"id": "PKG001", "estado": "entregado"})
    resultado = bst.buscar("PKG001")
    assert resultado["estado"] == "entregado"


def test_actualizar_inexistente():
    bst = BSTPaquetes()
    assert bst.actualizar("NOEXISTE", {}) is False


def test_eliminar():
    bst = BSTPaquetes()
    bst.insertar("PKG001", {"id": "PKG001"})
    bst.insertar("PKG002", {"id": "PKG002"})
    bst.insertar("PKG003", {"id": "PKG003"})
    bst.eliminar("PKG002")
    assert bst.buscar("PKG002") is None
    assert bst.buscar("PKG001") is not None
    assert bst.buscar("PKG003") is not None


def test_len():
    bst = BSTPaquetes()
    assert len(bst) == 0
    bst.insertar("A", {})
    bst.insertar("B", {})
    assert len(bst) == 2


def test_insertar_duplicado_actualiza():
    bst = BSTPaquetes()
    bst.insertar("PKG001", {"id": "PKG001", "estado": "pendiente"})
    bst.insertar("PKG001", {"id": "PKG001", "estado": "entregado"})
    resultado = bst.buscar("PKG001")
    assert resultado["estado"] == "entregado"
    # El tamaño no debe duplicarse
    assert len(bst) == 1
