"""
🟣 Cola FIFO — Paquetes en Tránsito
El primer paquete en entrar es el primero en ser entregado.
Complejidad: O(1) para encolar y desencolar (deque de Python).
"""
from collections import deque
from typing import Any, Optional


class ColaTránsito:
    def __init__(self):
        self._cola: deque = deque()

    def encolar(self, paquete: Any):
        """Agrega un paquete al final de la cola (llegó a tránsito)."""
        self._cola.append(paquete)

    def desencolar(self) -> Optional[Any]:
        """Extrae el paquete más antiguo en tránsito (FIFO)."""
        if self._cola:
            return self._cola.popleft()
        return None

    def listar(self) -> list[Any]:
        """Vista de todos los paquetes en tránsito (sin modificar la cola)."""
        return list(self._cola)

    def buscar(self, id_paquete: str) -> Optional[Any]:
        for paquete in self._cola:
            if paquete.get("id") == id_paquete:
                return paquete
        return None

    def eliminar(self, id_paquete: str) -> bool:
        """Elimina un paquete por ID (cuando fue entregado o cancelado)."""
        for i, paquete in enumerate(self._cola):
            if paquete.get("id") == id_paquete:
                del self._cola[i]
                return True
        return False

    def actualizar_paquete(self, id_paquete: str, nuevos_datos: dict):
        for i, paquete in enumerate(self._cola):
            if paquete.get("id") == id_paquete:
                self._cola[i] = {**paquete, **nuevos_datos}
                return True
        return False

    def __len__(self):
        return len(self._cola)

    def está_vacía(self) -> bool:
        return len(self._cola) == 0
