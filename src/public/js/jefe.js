// =======================
// 🔌 SOCKET
// =======================

var socket = io({
  auth: { nombre: "Administrador", rol: "jefe" }
});

if (typeof estadoGlobal === "undefined") {
  var estadoGlobal = {};
}

// =======================
// 🔄 EVENTOS DE SOCKET
// =======================

socket.on("estado-inicial", (estado) => {
  estadoGlobal = estado;
  renderTablas();
});

socket.on("estado-actualizado", (estado) => {
  estadoGlobal = estado;
  renderTablas();
});

// =======================
// 📋 RENDERIZAR TABLAS
// =======================

function renderTablas() {
  const tablaMesero = document.getElementById("tablaMesero");
  const tablaCocina = document.getElementById("tablaCocina");

  tablaMesero.innerHTML = "";
  tablaCocina.innerHTML = "";

  const ordenes = estadoGlobal.ordenes || {};

  Object.entries(ordenes).forEach(([mesa, productos]) => {
    const mesaInfo = estadoGlobal.mesas.find(m => m.id == mesa);
    const nombreMesero = mesaInfo ? mesaInfo.mesero : "-";

    productos.forEach((p) => {
      let estadoMostrar = "";
      if (p.estado === "preparando") estadoMostrar = "En preparación";
      if (p.estado === "listo") estadoMostrar = "Pendiente por entregar";
      if (p.estado === "entregado") estadoMostrar = "Entregado";

      const estadoClase =
        estadoMostrar === "En preparación" ? "text-warning fw-bold" :
        estadoMostrar === "Pendiente por entregar" ? "text-danger fw-bold" :
        estadoMostrar === "Entregado" ? "text-success fw-bold" : "";

      // Crear fila con data-id único
      const fila = document.createElement("tr");
      fila.setAttribute("data-mesa", mesa);
      fila.setAttribute("data-id", p.timestampPedido); // ID único por producto

      fila.innerHTML = `
        <td>${mesa}</td>
        <td>${p.nombre}</td>
        <td>
          <button class="btn btn-sm btn-secondary me-1" 
                  onclick="cambiarCantidad(${mesa}, ${p.timestampPedido}, -1)" ${p.estado === 'entregado' ? 'disabled' : ''}>-</button>
          <span class="cantidad" data-mesa="${mesa}" data-id="${p.timestampPedido}">${p.cantidad}</span>
          <button class="btn btn-sm btn-secondary ms-1" 
                  onclick="cambiarCantidad(${mesa}, ${p.timestampPedido}, 1)" ${p.estado === 'entregado' ? 'disabled' : ''}>+</button>
        </td>
        <td>${nombreMesero}</td>
        <td class="${estadoClase}">${estadoMostrar}</td>
        <td>
          ${p.estado !== "entregado" ? `<button class="btn btn-danger btn-sm" onclick="eliminarOrden(${mesa}, ${p.timestampPedido})">🗑️</button>` : `<span class="text-muted">🔒 Bloqueado</span>`}
        </td>
      `;

      if (p.categoria === "bebida") {
        tablaMesero.appendChild(fila);
      } else {
        tablaCocina.appendChild(fila);
      }
    });
  });
}

// =======================
// ✏️ CAMBIAR CANTIDAD CON BOTONES
// =======================

function cambiarCantidad(mesa, timestamp, cambio) {
  const orden = estadoGlobal.ordenes[mesa];
  if (!orden) return;

  const producto = orden.find(p => p.timestampPedido === timestamp);
  if (!producto || producto.estado === 'entregado') return;

  let nuevaCantidad = producto.cantidad + cambio;
  if (nuevaCantidad < 1) nuevaCantidad = 1;

  // Actualizar localmente
  producto.cantidad = nuevaCantidad;

  // Actualizar en la tabla
  const celda = document.querySelector(`.cantidad[data-mesa='${mesa}'][data-id='${timestamp}']`);
  if (celda) celda.innerText = nuevaCantidad;

  // Enviar al servidor
  socket.emit("editarProducto", {
    mesa,
    index: orden.findIndex(p => p.timestampPedido === timestamp),
    nuevaCantidad,
    jefe: "Administrador"
  });

  console.log(`Cantidad actualizada (mesa ${mesa}):`, producto);
}

// =======================
// 🗑️ ELIMINAR ORDEN
// =======================

function eliminarOrden(mesa, timestamp) {
  if (!confirm("¿Eliminar producto?")) return;

  const orden = estadoGlobal.ordenes[mesa];
  if (!orden) return;

  const index = orden.findIndex(p => p.timestampPedido === timestamp);
  if (index === -1) return;

  // Emitir al servidor
  socket.emit("eliminarProducto", {
    mesa,
    index,
    jefe: "Administrador"
  });
}
