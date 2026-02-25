const socket = io();

let estadoGlobal = null;

socket.on("estado-inicial", (estado) => {
    estadoGlobal = estado;
    render();
});

socket.on("estado-actualizado", (estado) => {
    estadoGlobal = estado;
    render();
});

function render() {

    if (!estadoGlobal) return;

    const body = document.getElementById("bodyCocina");
    const contador = document.getElementById("contadorPendientes");
    const acumuladoBody = document.getElementById("bodyAcumulado");

    body.innerHTML = "";
    acumuladoBody.innerHTML = "";

    let pendientes = 0;
    let acumulado = {};




    let listaOrdenada = [];

    // 1️⃣ Aplanar todas las órdenes
    Object.entries(estadoGlobal.ordenes).forEach(([mesaId, orden]) => {
    
        orden.forEach((item, index) => {
    
            if (item.estado === "preparando" && item.categoria === "comida") {
    
                listaOrdenada.push({
                    ...item,
                    mesaId,
                    index
                });
    
            }
    
        });
    
    });
    
    // 2️⃣ Ordenar por momento real de pedido
    listaOrdenada.sort((a, b) => a.timestampPedido - b.timestampPedido);
    
    // 3️⃣ Renderizar ya ordenado
    listaOrdenada.forEach(item => {
    
        pendientes += item.cantidad;
    
        if (!acumulado[item.nombre]) {
            acumulado[item.nombre] = 0;
        }
    
        acumulado[item.nombre] += item.cantidad;
    
        body.innerHTML += `
            <tr>
                <td>${item.nombre}</td>
                <td>${item.cantidad}</td>
                <td>${item.mesaId}</td>
                <td>${estadoGlobal.mesas.find(m => m.id == item.mesaId)?.mesero || "-"}</td>
                <td>
                    <button class="btn btn-success btn-sm"
                        onclick="marcarListo(${item.mesaId}, ${item.index})">
                        Listo
                    </button>
                </td>
            </tr>
        `;
    });
    





    contador.innerText = pendientes;

    Object.entries(acumulado).forEach(([producto, total]) => {
        acumuladoBody.innerHTML += `
            <tr>
                <td>${producto}</td>
                <td>${total}</td>
            </tr>
        `;
    });

}

window.marcarListo = function(mesa, index) {
    socket.emit("productoListo", { mesa, index });
};

socket.on("producto-eliminado", ({ mesa, nombreProd, categoria, jefe }) => {
    if (categoria === "comida") {
        alert(`${jefe} eliminó ${nombreProd} de la mesa ${mesa}`);
    }
});
