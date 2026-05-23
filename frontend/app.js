/**
 * 🚚 Logistify — Frontend App v2
 * Dashboard + simulación animada de envío.
 */

const API = "http://localhost:8000";

let cy = null;
let ultimaRuta = [];
let paqueteEnSimulacion = null;  // El paquete que se está simulando
let simulacionEnCurso = false;

// ── INICIALIZACIÓN ────────────────────────────────────────────────────────

window.addEventListener("DOMContentLoaded", async () => {
  await cargarCiudades();
  await inicializarGrafo();
  await cargarPaquetes();
  await actualizarEstadisticas();
});

// ── CARGAR CIUDADES ───────────────────────────────────────────────────────

async function cargarCiudades() {
  try {
    const res = await fetch(`${API}/ciudades`);
    const data = await res.json();
    const ciudades = data.ciudades;

    const selOrigen  = document.getElementById("input-origen");
    const selDestino = document.getElementById("input-destino");

    ciudades.forEach(ciudad => {
      selOrigen.add(new Option(ciudad, ciudad));
      selDestino.add(new Option(ciudad, ciudad));
    });
  } catch (e) {
    toast("⚠ No se pudo conectar al backend. ¿Está corriendo en el puerto 8000?", "error");
  }
}

// ── GRAFO CYTOSCAPE ───────────────────────────────────────────────────────

async function inicializarGrafo() {
  try {
    const res  = await fetch(`${API}/grafo`);
    const data = await res.json();

    const posiciones = {
      "Barranquilla": { x: 280, y:  60 },
      "Cartagena":    { x: 155, y:  85 },
      "Cúcuta":       { x: 430, y: 165 },
      "Bucaramanga":  { x: 365, y: 235 },
      "Medellín":     { x: 200, y: 315 },
      "Bogotá":       { x: 365, y: 375 },
      "Manizales":    { x: 240, y: 378 },
      "Pereira":      { x: 210, y: 420 },
      "Cali":         { x: 215, y: 490 },
      "Pasto":        { x: 195, y: 595 },
    };

    const elementos = [
      ...data.nodos.map(n => ({
        group: "nodes",
        data: n.data,
        position: posiciones[n.data.id] || { x: Math.random()*400+100, y: Math.random()*500+50 }
      })),
      ...data.aristas.map(e => ({ group: "edges", data: e.data }))
    ];

    cy = cytoscape({
      container: document.getElementById("cy"),
      elements: elementos,
      style: cytoscapeEstilo(),
      layout: { name: "preset", fit: true, padding: 40 },
      userZoomingEnabled: true,
      userPanningEnabled: true,
    });

    // Tooltip hover
    cy.on("mouseover", "node", function(e) {
      if (!ultimaRuta.includes(e.target.id())) {
        e.target.style("background-color", "#ffb726");
        e.target.style("width", 26);
        e.target.style("height", 26);
      }
    });
    cy.on("mouseout", "node", function(e) {
      if (!ultimaRuta.includes(e.target.id())) {
        e.target.removeStyle("background-color");
        e.target.removeStyle("width");
        e.target.removeStyle("height");
      }
    });

  } catch (err) {
    console.error("Error cargando grafo:", err);
  }
}

function cytoscapeEstilo() {
  return [
    {
      selector: "node",
      style: {
        "background-color":    "#f0a500",
        "background-opacity":  0.9,
        "border-color":        "#6b4800",
        "border-width":        2,
        "label":               "data(label)",
        "color":               "#e6e2d4",
        "font-family":         "Barlow Condensed, sans-serif",
        "font-weight":         700,
        "font-size":           11,
        "text-valign":         "bottom",
        "text-halign":         "center",
        "text-margin-y":       5,
        "text-background-color":   "#0a0b0e",
        "text-background-opacity": 0.85,
        "text-background-padding": "3px",
        "width":  20,
        "height": 20,
        "transition-property": "background-color, width, height, border-color, border-width",
        "transition-duration": "0.25s",
      }
    },
    {
      selector: "edge",
      style: {
        "line-color":           "#252836",
        "target-arrow-color":   "#343852",
        "target-arrow-shape":   "triangle",
        "arrow-scale":          1.1,
        "width":                1.5,
        "label":                "data(label)",
        "font-family":          "Space Mono, monospace",
        "font-size":            8,
        "color":                "#404560",
        "text-rotation":        "autorotate",
        "text-background-color":   "#0a0b0e",
        "text-background-opacity": 0.75,
        "text-background-padding": "2px",
        "curve-style":          "bezier",
        "transition-property":  "line-color, width, opacity",
        "transition-duration":  "0.25s",
      }
    },
    {
      selector: ".ruta-activa",
      style: {
        "background-color": "#00e676",
        "border-color":     "#00e676",
        "border-width":     2.5,
        "width":  26,
        "height": 26,
        "z-index": 10,
      }
    },
    {
      selector: ".ruta-edge",
      style: {
        "line-color":         "#00e676",
        "target-arrow-color": "#00e676",
        "width":              3,
        "opacity":            1,
        "z-index":            5,
      }
    },
    {
      selector: ".node-origen",
      style: {
        "background-color": "#4db6ff",
        "border-color":     "#4db6ff",
        "border-width":     2.5,
        "width":  28, "height": 28,
      }
    },
    {
      selector: ".node-destino",
      style: {
        "background-color": "#ff4444",
        "border-color":     "#ff4444",
        "border-width":     2.5,
        "width":  28, "height": 28,
      }
    },
    {
      selector: ".node-sim-activo",
      style: {
        "background-color": "#f0a500",
        "border-color":     "#ffc233",
        "border-width":     3,
        "width":  32, "height": 32,
        "z-index": 20,
      }
    },
    {
      selector: ".edge-sim-pasado",
      style: {
        "line-color":         "#f0a500",
        "target-arrow-color": "#f0a500",
        "width":              4,
        "opacity":            0.9,
        "z-index":            15,
      }
    }
  ];
}

function resaltarRutaEnGrafo(ruta) {
  if (!cy) return;
  cy.elements().removeClass("ruta-activa ruta-edge node-origen node-destino node-sim-activo edge-sim-pasado");
  ultimaRuta = ruta;
  if (!ruta || ruta.length === 0) return;

  ruta.forEach((ciudad, idx) => {
    const nodo = cy.$(`node[id="${ciudad}"]`);
    if (nodo.length) {
      nodo.addClass("ruta-activa");
      if (idx === 0)             nodo.addClass("node-origen");
      if (idx === ruta.length-1) nodo.addClass("node-destino");
    }
  });

  for (let i = 0; i < ruta.length - 1; i++) {
    const arista = cy.$(`edge[source="${ruta[i]}"][target="${ruta[i+1]}"]`);
    if (arista.length) arista.addClass("ruta-edge");
  }
}

function limpiarRutaGrafo() {
  if (!cy) return;
  cy.elements().removeClass("ruta-activa ruta-edge node-origen node-destino node-sim-activo edge-sim-pasado");
  ultimaRuta = [];
}

// ── CREAR PAQUETE ─────────────────────────────────────────────────────────

async function crearPaquete() {
  const origen    = document.getElementById("input-origen").value;
  const destino   = document.getElementById("input-destino").value;
  const desc      = document.getElementById("input-desc").value.trim();
  const peso      = parseFloat(document.getElementById("input-peso").value);
  const prioridad = document.getElementById("input-prioridad").value;

  if (!origen || !destino) { toast("Selecciona ciudad origen y destino.", "error"); return; }
  if (origen === destino)  { toast("El origen y destino deben ser distintos.", "error"); return; }
  if (!desc)               { toast("Ingresa una descripción del paquete.", "error"); return; }
  if (!peso || peso <= 0)  { toast("Ingresa un peso válido.", "error"); return; }

  const btn = document.getElementById("btn-crear");
  btn.disabled = true;
  btn.innerHTML = `<span class="btn-icon">⟳</span> CALCULANDO...`;

  try {
    const res = await fetch(`${API}/paquetes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origen, destino, descripcion: desc, peso_kg: peso, prioridad })
    });

    const data = await res.json();

    if (!res.ok) {
      toast(`Error: ${data.detail || "No se pudo crear el paquete"}`, "error");
      return;
    }

    paqueteEnSimulacion = data;
    mostrarResultadoRuta(data);
    resaltarRutaEnGrafo(data.ruta);
    await cargarPaquetes();
    await actualizarEstadisticas();

    document.getElementById("input-desc").value = "";
    document.getElementById("input-peso").value = "";

    toast(`✓ Paquete ${data.id} creado. Ruta óptima: ${data.distancia_km} km`, "success");

  } catch (e) {
    toast("Error de conexión con el backend.", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span class="btn-icon">⟢</span> CALCULAR RUTA + CREAR`;
  }
}

function mostrarResultadoRuta(paquete) {
  const div = document.getElementById("ruta-result");
  div.classList.remove("hidden");

  document.getElementById("ruta-km").textContent   = `${paquete.distancia_km} km`;
  document.getElementById("ruta-id-value").textContent = paquete.id;

  const pathEl = document.getElementById("ruta-path");
  pathEl.innerHTML = "";
  paquete.ruta.forEach((ciudad, idx) => {
    if (idx > 0) {
      const arrow = document.createElement("span");
      arrow.className = "ruta-arrow";
      arrow.textContent = "→";
      pathEl.appendChild(arrow);
    }
    const chip = document.createElement("span");
    chip.className = "ruta-city";
    chip.textContent = ciudad;
    pathEl.appendChild(chip);
  });
}

// ── TABLA DE PAQUETES ─────────────────────────────────────────────────────

async function cargarPaquetes() {
  try {
    const res      = await fetch(`${API}/paquetes`);
    const paquetes = await res.json();
    renderTabla(paquetes);
  } catch (e) {
    document.getElementById("tabla-body").innerHTML =
      `<tr><td colspan="6" class="tabla-empty">Sin conexión con el backend</td></tr>`;
  }
}

function renderTabla(paquetes) {
  const tbody = document.getElementById("tabla-body");

  if (!paquetes || paquetes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="tabla-empty">NO HAY PAQUETES — CREA UNO ↙</td></tr>`;
    return;
  }

  tbody.innerHTML = paquetes.map(p => `
    <tr>
      <td><span class="pkg-id">${p.id}</span></td>
      <td class="pkg-ruta">
        ${p.origen}<span class="arrow">→</span>${p.destino}
      </td>
      <td><span class="badge badge-${p.prioridad}">${p.prioridad.toUpperCase()}</span></td>
      <td><span class="badge badge-${p.estado}">${formatEstado(p.estado)}</span></td>
      <td class="pkg-km">${p.distancia_km}</td>
      <td>${botonEstado(p)}</td>
    </tr>
  `).join("");
}

function formatEstado(e) {
  return {
    pendiente:   "PENDIENTE",
    en_transito: "EN TRÁNSITO",
    entregado:   "ENTREGADO",
    cancelado:   "CANCELADO"
  }[e] || e.toUpperCase();
}

function botonEstado(p) {
  if (p.estado === "pendiente") {
    return `<button class="btn-estado despachar" onclick="despacharySimular('${p.id}')">▶ DESPACHAR</button>`;
  } else if (p.estado === "en_transito") {
    return `<button class="btn-estado entregar" onclick="cambiarEstado('${p.id}', 'entregado')">✓ ENTREGAR</button>`;
  } else {
    return `<button class="btn-estado" disabled>—</button>`;
  }
}

// ── DESPACHAR CON SIMULACIÓN ──────────────────────────────────────────────

async function despacharySimular(id) {
  // Buscar el paquete
  try {
    const res = await fetch(`${API}/paquetes/${id}`);
    if (!res.ok) throw new Error();
    const paquete = await res.json();

    // Primero actualizar el estado en backend
    const resEstado = await fetch(`${API}/paquetes/${id}/estado`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "en_transito" })
    });
    if (!resEstado.ok) throw new Error();

    // Resaltar ruta en grafo
    resaltarRutaEnGrafo(paquete.ruta);

    // Abrir modal de simulación
    paqueteEnSimulacion = paquete;
    abrirSimulacion(paquete);

    await cargarPaquetes();
    await actualizarEstadisticas();

  } catch (e) {
    toast("Error al despachar el paquete.", "error");
  }
}

// ── SIMULACIÓN ────────────────────────────────────────────────────────────

function simularEnvio() {
  if (!paqueteEnSimulacion) return;
  abrirSimulacion(paqueteEnSimulacion);
}

function abrirSimulacion(paquete) {
  // Construir visualización de ruta en el modal
  const routeVisual  = document.getElementById("sim-route-visual");
  const citiesList   = document.getElementById("sim-cities-list");
  const progressFill = document.getElementById("sim-progress-fill");

  routeVisual.innerHTML  = "";
  citiesList.innerHTML   = "";
  progressFill.style.width = "0%";

  const ruta = paquete.ruta;

  // Nodos y conectores visuales
  ruta.forEach((ciudad, idx) => {
    const node = document.createElement("div");
    node.className = "sim-city-node";
    node.id = `sim-node-${idx}`;
    node.innerHTML = `
      <div class="sim-city-dot" id="sim-dot-${idx}"></div>
      <div class="sim-city-label">${ciudad}</div>
    `;
    routeVisual.appendChild(node);

    if (idx < ruta.length - 1) {
      const conn = document.createElement("div");
      conn.className = "sim-connector";
      conn.id = `sim-conn-${idx}`;
      routeVisual.appendChild(conn);
    }
  });

  // Lista de ciudades
  ruta.forEach((ciudad, idx) => {
    const item = document.createElement("div");
    item.className = "sim-city-item";
    item.id = `sim-item-${idx}`;
    item.innerHTML = `
      <div class="sim-city-check" id="sim-check-${idx}">✓</div>
      <div class="sim-city-name">${ciudad}</div>
      <div class="sim-city-step">
        ${idx === 0 ? "ORIGEN" : idx === ruta.length-1 ? "DESTINO" : `PASO ${idx}`}
      </div>
    `;
    citiesList.appendChild(item);
  });

  // Resetear estado
  document.getElementById("sim-status-icon").textContent     = "🚚";
  document.getElementById("sim-status-icon").className       = "sim-status-icon";
  document.getElementById("sim-status-label").textContent    = `LISTO: ${paquete.id}`;
  document.getElementById("sim-status-detail").textContent   = `${paquete.origen} → ${paquete.destino} · ${paquete.distancia_km} km`;
  document.getElementById("btn-sim-start").disabled          = false;
  document.getElementById("btn-sim-start").textContent       = "▶ INICIAR SIMULACIÓN";

  // Mostrar modal
  document.getElementById("modal-backdrop").classList.remove("hidden");
  document.getElementById("modal-sim").classList.remove("hidden");
}

function cerrarSimulacion() {
  document.getElementById("modal-backdrop").classList.add("hidden");
  document.getElementById("modal-sim").classList.add("hidden");
  simulacionEnCurso = false;
}

async function iniciarSimulacion() {
  if (simulacionEnCurso || !paqueteEnSimulacion) return;
  simulacionEnCurso = true;

  const ruta   = paqueteEnSimulacion.ruta;
  const btn    = document.getElementById("btn-sim-start");
  const icon   = document.getElementById("sim-status-icon");
  const label  = document.getElementById("sim-status-label");
  const detail = document.getElementById("sim-status-detail");
  const fill   = document.getElementById("sim-progress-fill");

  btn.disabled = true;
  btn.textContent = "⟳ EN CURSO...";
  icon.textContent = "🚚";
  icon.classList.add("moving");

  // Limpiar clases previas en grafo
  if (cy) cy.elements().removeClass("node-sim-activo edge-sim-pasado");

  const stepDelay = Math.max(900, Math.min(1800, 5000 / ruta.length));

  for (let i = 0; i < ruta.length; i++) {
    const ciudad = ruta[i];
    const pct    = Math.round((i / (ruta.length - 1)) * 100);

    // Actualizar progreso barra
    fill.style.width = `${pct}%`;

    // Actualizar visual de ruta en modal
    for (let j = 0; j < ruta.length; j++) {
      const dot  = document.getElementById(`sim-dot-${j}`);
      const node = document.getElementById(`sim-node-${j}`);
      const item = document.getElementById(`sim-item-${j}`);
      if (j < i)  { dot.className = "sim-city-dot passed"; node.className = "sim-city-node passed"; item.className = "sim-city-item passed"; }
      if (j === i){ dot.className = "sim-city-dot active"; node.className = "sim-city-node active"; item.className = "sim-city-item active"; }
      if (j > i)  { dot.className = "sim-city-dot"; node.className = "sim-city-node"; item.className = "sim-city-item"; }
    }
    // Conectores pasados
    for (let j = 0; j < i; j++) {
      const conn = document.getElementById(`sim-conn-${j}`);
      if (conn) conn.className = "sim-connector passed";
    }
    // Auto-scroll en lista
    const activeItem = document.getElementById(`sim-item-${i}`);
    if (activeItem) activeItem.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // Actualizar texto de estado
    if (i === 0) {
      label.textContent  = "SALIENDO DE ORIGEN";
      detail.textContent = `Partiendo desde ${ciudad}...`;
    } else if (i === ruta.length - 1) {
      label.textContent  = "LLEGANDO AL DESTINO";
      detail.textContent = `Entregando en ${ciudad}`;
    } else {
      label.textContent  = `EN TRÁNSITO · ${ciudad.toUpperCase()}`;
      detail.textContent = `Pasando por ${ciudad} · ${i}/${ruta.length-1} tramos completados`;
    }

    // Animación en grafo Cytoscape
    if (cy) {
      // Marcar el nodo actual
      const nodoActual = cy.$(`node[id="${ciudad}"]`);
      if (nodoActual.length) {
        cy.elements().removeClass("node-sim-activo");
        nodoActual.addClass("node-sim-activo");
      }
      // Marcar arista pasada
      if (i > 0) {
        const aristaAnterior = cy.$(`edge[source="${ruta[i-1]}"][target="${ciudad}"]`);
        if (aristaAnterior.length) aristaAnterior.addClass("edge-sim-pasado");
        // Centro la vista en el nodo actual
        cy.animate({ center: { eles: nodoActual }, zoom: 1.8 }, { duration: 400 });
      }
    }

    await delay(stepDelay);
  }

  // Finalizado
  fill.style.width = "100%";
  icon.textContent = "✅";
  icon.classList.remove("moving");
  label.textContent  = "¡PAQUETE ENTREGADO!";
  detail.textContent = `${paqueteEnSimulacion.origen} → ${paqueteEnSimulacion.destino} · Completado`;

  btn.textContent    = "✓ COMPLETADO";
  simulacionEnCurso  = false;

  // Ajustar vista del grafo
  if (cy) {
    setTimeout(() => { cy.fit(undefined, 30); }, 300);
  }

  toast(`✓ Simulación completada: ${paqueteEnSimulacion.id} entregado`, "success");
}

// ── CAMBIAR ESTADO ────────────────────────────────────────────────────────

async function cambiarEstado(id, nuevoEstado) {
  try {
    const res = await fetch(`${API}/paquetes/${id}/estado`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado })
    });

    if (res.ok) {
      const accion = nuevoEstado === "en_transito" ? "despachado" : "entregado";
      toast(`✓ Paquete ${id} ${accion}`, "success");
      await cargarPaquetes();
      await actualizarEstadisticas();
    }
  } catch (e) {
    toast("Error al cambiar estado.", "error");
  }
}

// ── BUSCAR POR BST ────────────────────────────────────────────────────────

async function buscarPaquete() {
  const id = document.getElementById("input-buscar").value.trim().toUpperCase();
  if (!id) { toast("Ingresa un ID de paquete.", "error"); return; }

  const div = document.getElementById("search-result");
  div.classList.remove("hidden", "not-found");
  div.innerHTML = `<div style="color:var(--text-muted);font-size:.65rem;letter-spacing:2px;">BUSCANDO...</div>`;

  try {
    const res = await fetch(`${API}/paquetes/${id}`);
    if (res.ok) {
      const p = await res.json();
      div.innerHTML = `
        <div class="sr-id">${p.id}</div>
        <div class="sr-row"><span>Ruta</span>        <span class="sr-val">${p.origen} → ${p.destino}</span></div>
        <div class="sr-row"><span>Descripción</span> <span class="sr-val">${p.descripcion}</span></div>
        <div class="sr-row"><span>Peso</span>        <span class="sr-val">${p.peso_kg} kg</span></div>
        <div class="sr-row"><span>Prioridad</span>   <span class="sr-val">${p.prioridad.toUpperCase()}</span></div>
        <div class="sr-row"><span>Estado</span>      <span class="sr-val">${formatEstado(p.estado)}</span></div>
        <div class="sr-row"><span>Distancia</span>   <span class="sr-val">${p.distancia_km} km</span></div>
        <div class="sr-row"><span>Camino</span>      <span class="sr-val">${p.ruta.join(" → ")}</span></div>
      `;
      resaltarRutaEnGrafo(p.ruta);
      // Guardar para posible simulación
      paqueteEnSimulacion = p;
    } else {
      div.classList.add("not-found");
      div.innerHTML = `⊘ Paquete "${id}" no encontrado en el BST`;
    }
  } catch (e) {
    div.classList.add("not-found");
    div.innerHTML = "Error de conexión";
  }
}

// ── ESTADÍSTICAS ──────────────────────────────────────────────────────────

async function actualizarEstadisticas() {
  try {
    const res      = await fetch(`${API}/paquetes`);
    const paquetes = await res.json();

    animarNumero("num-total",    paquetes.length);
    animarNumero("num-urgentes", paquetes.filter(p => p.prioridad === "alta").length);
    animarNumero("num-transito", paquetes.filter(p => p.estado === "en_transito").length);
  } catch (_) {}
}

function animarNumero(id, valor) {
  const el = document.getElementById(id);
  const actual = parseInt(el.textContent) || 0;
  if (actual === valor) return;
  el.style.transform = "scale(1.2)";
  el.style.transition = "transform 0.15s";
  el.textContent = valor;
  setTimeout(() => { el.style.transform = "scale(1)"; }, 150);
}

// ── DESPACHO MASIVO POR PRIORIDAD ─────────────────────────────────────────

const PRIORIDAD_ORDEN = { alta: 0, media: 1, baja: 2 };
let batchCancelado = false;
let batchEnCurso   = false;

async function despacharTodosPorPrioridad() {
  // Obtener paquetes pendientes
  let paquetes;
  try {
    const res = await fetch(`${API}/paquetes`);
    paquetes  = await res.json();
  } catch (e) {
    toast("Error al obtener paquetes.", "error"); return;
  }

  const pendientes = paquetes
    .filter(p => p.estado === "pendiente")
    .sort((a, b) => PRIORIDAD_ORDEN[a.prioridad] - PRIORIDAD_ORDEN[b.prioridad]);

  if (pendientes.length === 0) {
    toast("No hay paquetes pendientes para despachar.", "error"); return;
  }

  // Preparar modal batch
  batchCancelado = false;
  construirModalBatch(pendientes);
  document.getElementById("modal-batch").classList.remove("hidden");
  document.getElementById("modal-backdrop").classList.remove("hidden");
}

function construirModalBatch(pendientes) {
  // Stats
  document.getElementById("batch-total").textContent     = pendientes.length;
  document.getElementById("batch-actual").textContent    = 0;
  document.getElementById("batch-completados").textContent = 0;
  document.getElementById("batch-restantes").textContent = pendientes.length;
  document.getElementById("batch-global-fill").style.width = "0%";
  document.getElementById("batch-global-pct").textContent = "0%";

  // Cola
  const queue = document.getElementById("batch-queue");
  queue.innerHTML = "";
  pendientes.forEach((p, idx) => {
    const iconMap = { alta: "🔴", media: "🟡", baja: "🟢" };
    const item = document.createElement("div");
    item.className   = `batch-queue-item prioridad-${p.prioridad} pendiente-q`;
    item.id          = `bqi-${p.id}`;
    item.innerHTML   = `
      <span class="bqi-icon">${iconMap[p.prioridad]}</span>
      <span class="bqi-id">${p.id}</span>
      <span class="bqi-ruta">${p.origen} → ${p.destino}</span>
      <span class="bqi-badge badge badge-${p.prioridad}">${p.prioridad.toUpperCase()}</span>
      <span class="bqi-estado">#${idx + 1}</span>
    `;
    queue.appendChild(item);
  });

  // Resetear zona activa
  document.getElementById("batch-active-id").textContent  = "—";
  document.getElementById("batch-route-bar").innerHTML    = "";
  document.getElementById("batch-active-sub").textContent = `${pendientes.length} paquetes listos para despachar`;

  // Botones
  document.getElementById("btn-batch-start").disabled  = false;
  document.getElementById("btn-batch-start").textContent = "⚡ INICIAR DESPACHO";
  document.getElementById("btn-batch-cancel").classList.add("hidden");
  document.getElementById("btn-close-batch").style.display = "";

  // Guardar lista en el botón para usarla en iniciarBatch
  document.getElementById("btn-batch-start")._pendientes = pendientes;
}

async function iniciarBatch() {
  if (batchEnCurso) return;
  const pendientes = document.getElementById("btn-batch-start")._pendientes;
  if (!pendientes || pendientes.length === 0) return;

  batchEnCurso   = true;
  batchCancelado = false;

  const btnStart  = document.getElementById("btn-batch-start");
  const btnCancel = document.getElementById("btn-batch-cancel");
  const btnClose  = document.getElementById("btn-close-batch");

  btnStart.disabled = true;
  btnStart.textContent = "⟳ EN CURSO...";
  btnCancel.classList.remove("hidden");
  btnClose.style.display = "none";

  const total = pendientes.length;
  let completados = 0;

  document.getElementById("btn-despachar-todos").disabled = true;

  for (let i = 0; i < pendientes.length; i++) {
    if (batchCancelado) break;

    const p = pendientes[i];

    // Actualizar stats
    actualizarStatsBatch(i + 1, completados, total - i - 1 + completados, total);

    // Marcar en cola
    marcarItemBatch(p.id, "activo", `EN PROCESO`);
    // Scroll al item activo
    const itemEl = document.getElementById(`bqi-${p.id}`);
    if (itemEl) itemEl.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // Mostrar ruta del paquete activo
    mostrarRutaBatch(p);

    // Resaltar en grafo
    resaltarRutaEnGrafo(p.ruta);

    // Despachar en backend
    try {
      await fetch(`${API}/paquetes/${p.id}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "en_transito" })
      });
    } catch (_) {}

    // Animar ruta en la barra del modal
    await animarRutaBatch(p.ruta);
    if (batchCancelado) break;

    completados++;
    marcarItemBatch(p.id, "despachado", "✓");
    actualizarStatsBatch(i + 1, completados, total - (i + 1), total);

    // Pequeña pausa entre paquetes
    await delay(300);
  }

  batchEnCurso = false;

  // Actualizar tabla y estadísticas
  await cargarPaquetes();
  await actualizarEstadisticas();

  if (!batchCancelado) {
    btnStart.textContent = `✓ COMPLETADO (${completados}/${total})`;
    document.getElementById("batch-active-sub").textContent = `${completados} paquetes despachados correctamente`;
    toast(`⚡ Despacho masivo completado: ${completados} paquetes en tránsito`, "success");
  } else {
    btnStart.disabled = false;
    btnStart.textContent = "⚡ REANUDAR";
    toast(`Despacho cancelado. ${completados} paquetes despachados.`, "error");
  }

  btnCancel.classList.add("hidden");
  btnClose.style.display = "";
  document.getElementById("btn-despachar-todos").disabled = false;
}

function cancelarBatch() {
  batchCancelado = true;
}

function cerrarBatch() {
  if (batchEnCurso) return;
  document.getElementById("modal-batch").classList.add("hidden");
  document.getElementById("modal-backdrop").classList.add("hidden");
}

function actualizarStatsBatch(actual, completados, restantes, total) {
  const pct = Math.round((completados / total) * 100);

  animarNumeroEl(document.getElementById("batch-actual"),      actual);
  animarNumeroEl(document.getElementById("batch-completados"), completados);
  animarNumeroEl(document.getElementById("batch-restantes"),   restantes);

  document.getElementById("batch-global-fill").style.width = `${pct}%`;
  document.getElementById("batch-global-pct").textContent  = `${pct}%`;
}

function animarNumeroEl(el, valor) {
  if (!el || el.textContent == valor) return;
  el.style.transform = "scale(1.25)";
  el.textContent = valor;
  setTimeout(() => { el.style.transform = "scale(1)"; }, 150);
}

function marcarItemBatch(id, estado, textoEstado) {
  const item = document.getElementById(`bqi-${id}`);
  if (!item) return;
  item.className = item.className
    .replace(/\b(activo|despachado|pendiente-q)\b/g, "").trim();
  item.classList.add(estado);
  const estadoEl = item.querySelector(".bqi-estado");
  if (estadoEl) estadoEl.textContent = textoEstado;
}

function mostrarRutaBatch(paquete) {
  const bar = document.getElementById("batch-route-bar");
  bar.innerHTML = "";
  paquete.ruta.forEach((ciudad, idx) => {
    const node = document.createElement("div");
    node.className = "brd-node";
    node.id        = `brd-node-${idx}`;
    bar.appendChild(node);
    if (idx < paquete.ruta.length - 1) {
      const edge = document.createElement("div");
      edge.className = "brd-edge";
      edge.id        = `brd-edge-${idx}`;
      bar.appendChild(edge);
    }
  });
  document.getElementById("batch-active-id").textContent  = paquete.id;
  document.getElementById("batch-active-sub").textContent =
    `${paquete.origen} → ${paquete.destino}  ·  ${paquete.distancia_km} km`;
}

async function animarRutaBatch(ruta) {
  const stepMs = Math.max(350, Math.min(700, 2200 / ruta.length));

  for (let i = 0; i < ruta.length; i++) {
    if (batchCancelado) return;

    // Colorear nodos y aristas
    for (let j = 0; j < ruta.length; j++) {
      const n = document.getElementById(`brd-node-${j}`);
      if (!n) continue;
      if (j < i)  n.className = "brd-node done";
      if (j === i) n.className = "brd-node active";
    }
    for (let j = 0; j < i; j++) {
      const e = document.getElementById(`brd-edge-${j}`);
      if (e) e.className = "brd-edge done";
    }

    // Animar nodo activo en grafo
    if (cy) {
      cy.elements().removeClass("node-sim-activo edge-sim-pasado");
      const nCy = cy.$(`node[id="${ruta[i]}"]`);
      if (nCy.length) {
        nCy.addClass("node-sim-activo");
        cy.animate({ center: { eles: nCy }, zoom: 1.6 }, { duration: 250 });
      }
      if (i > 0) {
        const eCy = cy.$(`edge[source="${ruta[i-1]}"][target="${ruta[i]}"]`);
        if (eCy.length) eCy.addClass("edge-sim-pasado");
      }
    }

    await delay(stepMs);
  }

  // Volver a ajustar vista grafo
  if (cy) setTimeout(() => cy.fit(undefined, 30), 200);
}

const delay = (ms) => new Promise(res => setTimeout(res, ms));

// ── TOAST ─────────────────────────────────────────────────────────────────

let toastTimer = null;
function toast(msg, tipo = "info") {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className   = `toast ${tipo}`;
  el.classList.remove("hidden");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), 3800);
}
