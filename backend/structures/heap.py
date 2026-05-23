"""
🟡 Min-Heap — Cola de Prioridad de Paquetes
Los paquetes con mayor urgencia (prioridad numérica menor) salen primero.
Complejidad: inserción O(log n), consulta mínimo O(1), extracción O(log n)
"""
import heapq
from typing import Any, Optional


class ColaPrioridad:
    def __init__(self):
        self._heap: list = []
        self._contador = 0  # desempate FIFO cuando prioridades son iguales

    def insertar(self, paquete: Any, prioridad: int):
        """
        Inserta un paquete con su prioridad.
        prioridad: 1=Alta (urgente), 2=Media, 3=Baja
        """
        heapq.heappush(self._heap, (prioridad, self._contador, paquete))
        self._contador += 1

    def siguiente(self) -> Optional[Any]:
        """Extrae y retorna el paquete de mayor prioridad (menor número)."""
        if self._heap:
            _, _, paquete = heapq.heappop(self._heap)
            return paquete
        return None

    def listar(self) -> list[Any]:
        """Retorna todos los paquetes ordenados por prioridad sin modificar el heap."""
        return [paquete for (_, _, paquete) in sorted(self._heap)]

    def actualizar_paquete(self, id_paquete: str, nuevos_datos: dict):
        """
        Actualiza los datos de un paquete en el heap.
        Dado que heapq no soporta actualización directa, reconstruimos.
        """
        nueva_heap = []
        for prioridad, contador, paquete in self._heap:
            if paquete.get("id") == id_paquete:
                paquete = {**paquete, **nuevos_datos}
            nueva_heap.append((prioridad, contador, paquete))
        heapq.heapify(nueva_heap)
        self._heap = nueva_heap

    def eliminar(self, id_paquete: str):
        """Elimina un paquete del heap por su ID."""
        self._heap = [
            (p, c, pkg) for (p, c, pkg) in self._heap
            if pkg.get("id") != id_paquete
        ]
        heapq.heapify(self._heap)

    def buscar(self, id_paquete: str) -> Optional[Any]:
        """Busca un paquete por ID en el heap (O(n))."""
        for _, _, paquete in self._heap:
            if paquete.get("id") == id_paquete:
                return paquete
        return None

    def __len__(self):
        return len(self._heap)
