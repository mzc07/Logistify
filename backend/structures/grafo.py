"""
🔵 Grafo Dirigido Ponderado + Algoritmo de Dijkstra
Representa la red de ciudades colombianas.
Complejidad Dijkstra: O((V + E) log V)
"""
import heapq
from typing import Optional


class GrafoLogistica:
    def __init__(self):
        # Lista de adyacencia: {ciudad: [(vecino, peso), ...]}
        self._grafo: dict[str, list[tuple[str, int]]] = {}

    def agregar_ciudad(self, ciudad: str):
        if ciudad not in self._grafo:
            self._grafo[ciudad] = []

    def agregar_ruta(self, origen: str, destino: str, peso: int):
        """Agrega una arista dirigida (origen → destino) con su peso en km."""
        self.agregar_ciudad(origen)
        self.agregar_ciudad(destino)
        # Evitar duplicados
        if not any(v == destino for v, _ in self._grafo[origen]):
            self._grafo[origen].append((destino, peso))

    def agregar_ruta_bidireccional(self, ciudad_a: str, ciudad_b: str, peso: int):
        self.agregar_ruta(ciudad_a, ciudad_b, peso)
        self.agregar_ruta(ciudad_b, ciudad_a, peso)

    def dijkstra(self, origen: str, destino: str) -> tuple[float, list[str]]:
        """
        Calcula la ruta más corta entre origen y destino.
        Retorna (costo_total_km, [lista_de_ciudades_del_camino])
        """
        if origen not in self._grafo or destino not in self._grafo:
            return float('inf'), []

        distancias = {nodo: float('inf') for nodo in self._grafo}
        distancias[origen] = 0
        # (costo_acumulado, ciudad_actual, camino_recorrido)
        heap = [(0, origen, [origen])]
        visitados = set()

        while heap:
            costo, nodo, camino = heapq.heappop(heap)

            if nodo in visitados:
                continue
            visitados.add(nodo)

            if nodo == destino:
                return costo, camino

            for vecino, peso in self._grafo.get(nodo, []):
                if vecino not in visitados:
                    nuevo_costo = costo + peso
                    if nuevo_costo < distancias[vecino]:
                        distancias[vecino] = nuevo_costo
                        heapq.heappush(heap, (nuevo_costo, vecino, camino + [vecino]))

        return float('inf'), []

    def obtener_nodos(self) -> list[str]:
        return list(self._grafo.keys())

    def obtener_aristas(self) -> list[dict]:
        aristas = []
        for origen, vecinos in self._grafo.items():
            for destino, peso in vecinos:
                aristas.append({"origen": origen, "destino": destino, "peso": peso})
        return aristas

    def para_cytoscape(self) -> dict:
        """Serializa el grafo en formato listo para Cytoscape.js."""
        nodos = [{"data": {"id": ciudad, "label": ciudad}} for ciudad in self._grafo]
        aristas = [
            {
                "data": {
                    "id": f"{origen}-{destino}",
                    "source": origen,
                    "target": destino,
                    "peso": peso,
                    "label": f"{peso} km"
                }
            }
            for origen, vecinos in self._grafo.items()
            for destino, peso in vecinos
        ]
        return {"nodos": nodos, "aristas": aristas}

    def cargar_desde_json(self, data: dict):
        """Carga el grafo desde un diccionario JSON (ciudades.json)."""
        for ciudad in data.get("ciudades", []):
            self.agregar_ciudad(ciudad)
        for ruta in data.get("rutas", []):
            self.agregar_ruta(ruta["origen"], ruta["destino"], ruta["peso"])
