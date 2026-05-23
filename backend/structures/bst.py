"""
🔴 BST — Árbol Binario de Búsqueda de Paquetes
Permite buscar paquetes por ID en O(log n) promedio.
Nota: sin balanceo (mejora natural: AVL Tree).
"""
from typing import Any, Optional


class NodoBST:
    def __init__(self, id_paquete: str, datos: Any):
        self.id = id_paquete
        self.datos = datos
        self.izq: Optional["NodoBST"] = None
        self.der: Optional["NodoBST"] = None


class BSTPaquetes:
    def __init__(self):
        self.raiz: Optional[NodoBST] = None
        self._tamanio = 0

    # ── Inserción O(log n) promedio ──────────────────────────────────────────

    def insertar(self, id_paquete: str, datos: Any):
        self.raiz = self._insertar(self.raiz, id_paquete, datos)
        self._tamanio += 1

    def _insertar(self, nodo: Optional[NodoBST], id_pkg: str, datos: Any) -> NodoBST:
        if nodo is None:
            return NodoBST(id_pkg, datos)
        if id_pkg < nodo.id:
            nodo.izq = self._insertar(nodo.izq, id_pkg, datos)
        elif id_pkg > nodo.id:
            nodo.der = self._insertar(nodo.der, id_pkg, datos)
        else:
            # ID ya existe: actualizar datos
            nodo.datos = datos
            self._tamanio -= 1  # No aumentó realmente
        return nodo

    # ── Búsqueda O(log n) promedio ───────────────────────────────────────────

    def buscar(self, id_paquete: str) -> Optional[Any]:
        nodo = self._buscar(self.raiz, id_paquete)
        return nodo.datos if nodo else None

    def _buscar(self, nodo: Optional[NodoBST], id_pkg: str) -> Optional[NodoBST]:
        if nodo is None or nodo.id == id_pkg:
            return nodo
        if id_pkg < nodo.id:
            return self._buscar(nodo.izq, id_pkg)
        return self._buscar(nodo.der, id_pkg)

    # ── Actualización ────────────────────────────────────────────────────────

    def actualizar(self, id_paquete: str, nuevos_datos: Any) -> bool:
        nodo = self._buscar(self.raiz, id_paquete)
        if nodo:
            nodo.datos = nuevos_datos
            return True
        return False

    # ── Eliminación ──────────────────────────────────────────────────────────

    def eliminar(self, id_paquete: str):
        self.raiz, eliminado = self._eliminar(self.raiz, id_paquete)
        if eliminado:
            self._tamanio -= 1

    def _eliminar(self, nodo: Optional[NodoBST], id_pkg: str) -> tuple[Optional[NodoBST], bool]:
        if nodo is None:
            return None, False

        eliminado = False
        if id_pkg < nodo.id:
            nodo.izq, eliminado = self._eliminar(nodo.izq, id_pkg)
        elif id_pkg > nodo.id:
            nodo.der, eliminado = self._eliminar(nodo.der, id_pkg)
        else:
            eliminado = True
            if nodo.izq is None:
                return nodo.der, eliminado
            elif nodo.der is None:
                return nodo.izq, eliminado
            else:
                # Sucesor inorden (mínimo del subárbol derecho)
                sucesor = self._minimo(nodo.der)
                nodo.id = sucesor.id
                nodo.datos = sucesor.datos
                nodo.der, _ = self._eliminar(nodo.der, sucesor.id)

        return nodo, eliminado

    def _minimo(self, nodo: NodoBST) -> NodoBST:
        while nodo.izq:
            nodo = nodo.izq
        return nodo

    # ── Recorrido Inorden (retorna lista ordenada por ID) ────────────────────

    def inorden(self) -> list[Any]:
        resultado = []
        self._inorden(self.raiz, resultado)
        return resultado

    def _inorden(self, nodo: Optional[NodoBST], resultado: list):
        if nodo:
            self._inorden(nodo.izq, resultado)
            resultado.append(nodo.datos)
            self._inorden(nodo.der, resultado)

    def __len__(self):
        return self._tamanio
