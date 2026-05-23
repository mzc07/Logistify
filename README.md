# 🚚 Logistify — Gestor de Logística Simulado

> Sistema académico de gestión de paquetes y rutas de envío que utiliza **estructuras de datos clásicas**: Grafos, Min-Heap, BST y Cola FIFO, con visualización interactiva.

---

## ✨ Features

- 📦 Crear y rastrear paquetes con origen, destino y prioridad
- 🗺️ Cálculo automático de ruta más corta (Algoritmo de Dijkstra)
- 🔍 Búsqueda eficiente de paquetes por ID (Árbol BST)
- 📊 Cola de prioridad para gestión de urgencias (Min-Heap)
- 🌐 Visualización interactiva del grafo de rutas (Cytoscape.js)
- 💾 Persistencia con SQLite (sin instalación extra)

---

## 🧠 Estructuras de Datos Utilizadas

| Estructura | Uso en el Sistema | Complejidad clave |
|---|---|---|
| **Grafo dirigido ponderado** | Red de ciudades y rutas | O(V+E) espacio |
| **Algoritmo de Dijkstra** | Ruta más corta entre ciudades | O((V+E) log V) |
| **Min-Heap** | Cola de prioridad de paquetes | Inserción O(log n) |
| **BST** | Búsqueda de paquetes por ID | O(log n) promedio |
| **Cola FIFO (deque)** | Paquetes en tránsito | O(1) inserción/extracción |

---

## 🛠 Tech Stack

- **Backend**: Python 3.11 + FastAPI
- **Base de datos**: SQLite (sin instalación extra)
- **Frontend**: HTML + CSS + JavaScript (sin frameworks)
- **Visualización**: Cytoscape.js (via CDN)

---

## 🚀 Instalación y Uso

### Prerrequisitos
- Python 3.11+

### Pasos

```bash
# 1. Clonar el repo
git clone https://github.com/tuusuario/logistify
cd logistify

# 2. Crear entorno virtual
python -m venv venv
source venv/bin/activate      # Mac/Linux
venv\Scripts\activate         # Windows

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Correr el backend
cd backend
uvicorn main:app --reload --port 8000
```

5. Abrir `frontend/index.html` en el navegador (o usar Live Server en VS Code).

La documentación interactiva Swagger estará en: **http://localhost:8000/docs**

---

## 🧪 Tests

```bash
cd backend
pytest tests/ -v
```

Resultado esperado:
```
tests/test_grafo.py::test_dijkstra_ruta_directa     PASSED
tests/test_grafo.py::test_dijkstra_ruta_indirecta   PASSED
tests/test_grafo.py::test_dijkstra_ruta_larga       PASSED
tests/test_grafo.py::test_dijkstra_sin_ruta         PASSED
tests/test_grafo.py::test_dijkstra_origen_igual_destino  PASSED
tests/test_heap.py::test_insercion_y_orden_prioridad PASSED
tests/test_heap.py::test_siguiente_extrae_mayor_prioridad PASSED
tests/test_bst.py::test_insertar_y_buscar           PASSED
tests/test_bst.py::test_inorden_ordenado            PASSED
...
```

---

## 📡 Endpoints de la API

| Método | Endpoint | Descripción | Estructura usada |
|---|---|---|---|
| `POST` | `/paquetes` | Crear paquete + calcular ruta | Dijkstra + Heap + BST |
| `GET` | `/paquetes` | Listar paquetes por prioridad | Min-Heap |
| `GET` | `/paquetes/{id}` | Buscar paquete por ID | BST |
| `PUT` | `/paquetes/{id}/estado` | Cambiar estado | Cola FIFO |
| `DELETE` | `/paquetes/{id}` | Eliminar paquete | BST + Heap |
| `GET` | `/grafo` | Datos para Cytoscape.js | Grafo |
| `GET` | `/ruta?origen=X&destino=Y` | Calcular ruta | Dijkstra |
| `GET` | `/ciudades` | Listar ciudades disponibles | Grafo |
| `GET` | `/transito` | Paquetes en tránsito | Cola FIFO |

---

## 📁 Estructura del Proyecto

```
logistify/
├── backend/
│   ├── main.py                  # FastAPI app, todos los endpoints
│   ├── models.py                # Modelos Pydantic
│   ├── database.py              # Capa SQLite
│   ├── structures/
│   │   ├── grafo.py             # Grafo + Dijkstra
│   │   ├── heap.py              # Min-Heap (cola de prioridad)
│   │   ├── bst.py               # BST (árbol binario de búsqueda)
│   │   └── cola_transito.py     # Cola FIFO (deque)
│   ├── data/
│   │   └── ciudades.json        # Red de 10 ciudades colombianas
│   └── tests/
│       ├── test_grafo.py        # 7 tests para Dijkstra
│       ├── test_heap.py         # 7 tests para Min-Heap
│       └── test_bst.py          # 8 tests para BST
├── frontend/
│   ├── index.html               # Dashboard principal
│   ├── style.css                # Estilos (tema industrial oscuro)
│   └── app.js                   # Lógica JS + integración Cytoscape.js
├── requirements.txt
└── README.md
```

---

## 💡 Notas Académicas

**¿Por qué BST puede desbalancearse?**
Si los IDs se insertan en orden, el BST degenera a O(n). La mejora natural sería un **AVL Tree** o un **Red-Black Tree**, pero para este proyecto el BST simple es correcto y funcional.

**¿Por qué el Heap y BST se resetean al reiniciar?**
FastAPI es stateless — las estructuras en memoria se vacían al reiniciar. Al arrancar, `main.py` recarga los paquetes desde SQLite automáticamente.

**CORS**: Configurado con `allow_origins=["*"]` para desarrollo. En producción usarías el dominio específico del frontend.
