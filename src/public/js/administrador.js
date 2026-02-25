// =======================
// CONEXIÓN SOCKET
// =======================

let socketAdmin = io({
  auth: { nombre: "Administrador", rol: "administrador" }
});

let estadoGlobal = {};

// =======================
// EVENTOS SOCKET
// =======================

socketAdmin.on("estado-inicial", (estado) => {
  estadoGlobal = estado;
  renderAdmin();
});

socketAdmin.on("estado-actualizado", (estado) => {
  estadoGlobal = estado;
  renderAdmin();
});

// =======================
// RENDER GENERAL
// =======================

function renderAdmin() {
  calcularResumen();
  renderTablaHistorial(estadoGlobal.historial || []);
  renderOrdenesAdmin();
  renderAuditoria(estadoGlobal);
}

// =======================
// RESUMEN GENERAL
// =======================

function calcularResumen() {
  const historial = estadoGlobal.historial || [];
  const hoy = new Date();

  let totalHoy = 0;
  let totalSemana = 0;
  let totalMes = 0;
  let productos = {};

  const hace7 = new Date();
  hace7.setDate(hoy.getDate() - 7);

  historial.forEach(v => {
    const fechaVenta = new Date(v.fecha);
    const totalVenta = v.precio * v.cantidad;

    if (fechaVenta.toDateString() === hoy.toDateString()) totalHoy += totalVenta;
    if (fechaVenta >= hace7) totalSemana += totalVenta;
    if (fechaVenta.getMonth() === hoy.getMonth() && fechaVenta.getFullYear() === hoy.getFullYear())
      totalMes += totalVenta;

    if (!productos[v.nombre]) productos[v.nombre] = 0;
    productos[v.nombre] += v.cantidad;
  });

  const top = Object.entries(productos).sort((a, b) => b[1] - a[1])[0];

  document.getElementById("totalHoy").innerText = `$${totalHoy}`;
  document.getElementById("totalSemana").innerText = `$${totalSemana}`;
  document.getElementById("totalMes").innerText = `$${totalMes}`;
  document.getElementById("productoTop").innerText = top ? `${top[0]} (${top[1]})` : "-";
}

// =======================
// RENDER TABLA HISTORIAL
// =======================

function renderTablaHistorial(datos) {
  const tabla = document.getElementById("tablaHistorial");
  tabla.innerHTML = "";

  datos.forEach(v => {
    const fila = `
      <tr>
        <td>${new Date(v.fecha).toLocaleDateString()}</td>
        <td>${v.mesa}</td>
        <td>${v.nombre}</td>
        <td>${v.cantidad}</td>
        <td>$${v.precio * v.cantidad}</td>
        <td>${v.vendidoPor || "-"}</td>
      </tr>
    `;
    tabla.innerHTML += fila;
  });
}

// =======================
// RENDER ORDENES ADMIN
// =======================

function renderOrdenesAdmin() {
  const tablaMesero = document.getElementById("tablaMeseroAdmin");
  const tablaCocina = document.getElementById("tablaCocinaAdmin");

  if (!tablaMesero || !tablaCocina) return;

  tablaMesero.innerHTML = "";
  tablaCocina.innerHTML = "";

  const ordenes = estadoGlobal.ordenes || {};

  Object.entries(ordenes).forEach(([mesa, productos]) => {
    const mesaInfo = estadoGlobal.mesas.find(m => m.id == mesa);
    const nombreMesero = mesaInfo ? mesaInfo.mesero : "-";

    productos.forEach((p, index) => {
      let estadoMostrar = "";
      if (p.estado === "preparando") estadoMostrar = "En preparación";
      if (p.estado === "listo") estadoMostrar = "Pendiente por entregar";
      if (p.estado === "entregado") estadoMostrar = "Entregado";

      const estadoClase =
        estadoMostrar === "En preparación" ? "text-warning fw-bold" :
        estadoMostrar === "Pendiente por entregar" ? "text-danger fw-bold" :
        estadoMostrar === "Entregado" ? "text-success fw-bold" : "";

      const botones = p.estado !== "entregado"
        ? `<button class="btn btn-danger btn-sm" onclick="eliminarOrdenAdmin(${mesa}, ${index})">🗑️</button>`
        : `<span class="text-muted">🔒 Bloqueado</span>`;

      const fila = `
        <tr>
          <td>${mesa}</td>
          <td>${p.nombre}</td>
          <td>
            <button class="btn btn-sm btn-secondary me-1" onclick="cambiarCantidadAdmin(${mesa}, ${index}, -1)" ${p.estado === 'entregado' ? 'disabled' : ''}>-</button>
            <span class="cantidad" data-mesa="${mesa}" data-index="${index}">${p.cantidad}</span>
            <button class="btn btn-sm btn-secondary ms-1" onclick="cambiarCantidadAdmin(${mesa}, ${index}, 1)" ${p.estado === 'entregado' ? 'disabled' : ''}>+</button>
          </td>
          <td>${nombreMesero}</td>
          <td class="${estadoClase}">${estadoMostrar}</td>
          <td>${botones}</td>
        </tr>
      `;

      if (p.categoria === "bebida") {
        tablaMesero.innerHTML += fila;
      } else {
        tablaCocina.innerHTML += fila;
      }
    });
  });
}

// =======================
// CAMBIAR CANTIDAD ADMIN
// =======================

function cambiarCantidadAdmin(mesa, index, cambio) {
  const producto = estadoGlobal.ordenes[mesa][index];
  if (!producto || producto.estado === "entregado") return;

  let nuevaCantidad = producto.cantidad + cambio;
  if (nuevaCantidad < 1) nuevaCantidad = 1;

  producto.cantidad = nuevaCantidad;

  const celda = document.querySelector(`.cantidad[data-mesa='${mesa}'][data-index='${index}']`);
  if (celda) celda.innerText = nuevaCantidad;

  socketAdmin.emit("editarProducto", {
    mesa,
    index,
    nuevaCantidad,
    jefe: "Administrador"
  });
}

// =======================
// ELIMINAR ORDEN ADMIN
// =======================

function eliminarOrdenAdmin(mesa, index) {
  if (!confirm("¿Eliminar producto?")) return;

  socketAdmin.emit("eliminarProducto", {
    mesa,
    index,
    jefe: "Administrador"
  });
}

// =======================
// FILTRO PERSONALIZADO
// =======================

function filtrarReporte() {
  if (!estadoGlobal || !estadoGlobal.historial) {
    alert("Aún no hay datos cargados.");
    return;
  }

  const inicioInput = document.getElementById("fechaInicio").value;
  const finInput = document.getElementById("fechaFin").value;

  if (!inicioInput || !finInput) {
    alert("Selecciona ambas fechas");
    return;
  }

  const inicio = new Date(inicioInput);
  const fin = new Date(finInput);
  fin.setHours(23, 59, 59, 999);

  const historial = estadoGlobal.historial;
  const filtrado = historial.filter(v => {
    const fecha = new Date(v.fecha);
    return fecha >= inicio && fecha <= fin;
  });

  const total = filtrado.reduce((sum, v) => sum + (v.precio * v.cantidad), 0);
  document.getElementById("totalFiltrado").innerText = `Total: $${total}`;

  renderTablaHistorial(filtrado);
}

// =======================
// AUDITORIA
// =======================

socketAdmin.on("estado-inicial", renderAuditoria);
socketAdmin.on("estado-actualizado", renderAuditoria);

function renderAuditoria(estado) {
  const body = document.getElementById("tablaAuditoria");
  body.innerHTML = "";

  const auditoria = estado.auditoria || [];
  auditoria.forEach(item => {
    body.innerHTML += `
      <tr>
        <td>${new Date(item.fecha).toLocaleString()}</td>
        <td>${item.mesa}</td>
        <td>${item.producto}</td>
        <td>${item.mesero}</td>
        <td>${item.jefe}</td>
        <td>${item.tipo}</td>
        <td>${item.cantidadOriginal}</td>
        <td>${item.nuevaCantidad}</td>
      </tr>
    `;
  });
}
