document.addEventListener("DOMContentLoaded", () => {

    const socket = io();

    socket.on("estado-inicial", renderEstado);
    socket.on("estado-actualizado", renderEstado);

    
    socket.on("producto-eliminado", ({ mesa, nombreProd, categoria, jefe }) => {
        // Solo mostrar si es la mesa seleccionada y es bebida
        if (mesaSeleccionada === mesa && categoria === "bebida") {
            alert(`${jefe} eliminó ${nombreProd} de la mesa ${mesa}`);
        }
    });
    

    // 🔴 Mostrar error si no se puede cerrar mesa
socket.on("errorCerrarMesa", (msg) => {
    alert(msg);
});

    let mesaSeleccionada = null;
    let nombreMesero = "";

    while (!nombreMesero) {
        nombreMesero = prompt("Ingresa tu nombre:");
    }

    const titulo = document.querySelector("h2");
    if (titulo) {
        titulo.innerText = `Panel del Mesero - ${nombreMesero}`;
    }


    
    function cerrarMesa(mesa) {

        if (!confirm("¿Seguro que deseas cerrar la mesa?")) return;
    
        // 🔥 Abre PDF real
        window.open(`/ticket/${mesa}`, "_blank");
    
        socket.emit("cerrarMesa", { mesa });
    }

    
    function renderEstado(estado) {

    if (mesaSeleccionada && !estado.ordenes[mesaSeleccionada]) {
        mesaSeleccionada = null;
        document.getElementById("bodyResumen").innerHTML = "";
        document.getElementById("bodyCuenta").innerHTML = "";
        document.getElementById("totalEntregado").innerText = "0";
        document.getElementById("seccionMenu").style.display = "none";
    }

            estado.mesas.forEach(mesa => {
            const boton = document.querySelector(`.mesa[data-id="${mesa.id}"]`);
            if (!boton) return;

            if (mesa.ocupada) {
                boton.classList.remove("btn-success");
                boton.classList.add("btn-danger");
                boton.innerText = `Mesa ${mesa.id} - ${mesa.mesero}`;
            } else {
                boton.classList.remove("btn-danger");
                boton.classList.add("btn-success");
                boton.innerText = `Mesa ${mesa.id}`;
            }
        });

        if (!mesaSeleccionada) return;
        const orden = estado.ordenes[mesaSeleccionada] || [];
        renderPreparacion(orden);
        renderEntregados(orden);
    }

    window.seleccionarMesa = function(btn, id) {
        socket.emit("ocuparMesa", { mesa: id, mesero: nombreMesero });
        mesaSeleccionada = id;
        document.getElementById("seccionMenu").style.display = "block";
        cargarMenu();
    };

    function cargarMenu() {
        fetch("/api/menu")
            .then(res => res.json())
            .then(menu => {
                const body = document.getElementById("bodyMenu");
                body.innerHTML = "";

                const comidas = menu.filter(p => p.categoria === "comida");
                const bebidas = menu.filter(p => p.categoria === "bebida");

                body.innerHTML += `<tr class="table-warning"><td colspan="3"><strong>COMIDA</strong></td></tr>`;
                comidas.forEach(crearFila);

                body.innerHTML += `<tr class="table-info"><td colspan="3"><strong>BEBIDAS</strong></td></tr>`;
                bebidas.forEach(crearFila);
            });
    }

    function crearFila(prod) {
        const body = document.getElementById("bodyMenu");

        body.innerHTML += `
            <tr>
                <td>${prod.nombre}</td>
                <td>$${prod.precio}</td>
                <td>
                    <button onclick="cambiarCantidad(${prod.id}, -1)">-</button>
                    <input type="number" id="cantidad-${prod.id}" value="0" readonly>
                    <button onclick="cambiarCantidad(${prod.id}, 1)">+</button>
                </td>
            </tr>
        `;
    }

    window.cambiarCantidad = function(id, cambio) {
        const input = document.getElementById("cantidad-" + id);
        let val = parseInt(input.value);
        val += cambio;
        if (val < 0) val = 0;
        input.value = val;
    };

    window.enviarPedido = function() {
        fetch("/api/menu")
            .then(res => res.json())
            .then(menu => {
                const productos = [];

                menu.forEach(prod => {
                    const cantidad = parseInt(document.getElementById(`cantidad-${prod.id}`).value);
                    if (cantidad > 0) {
                        productos.push({
                            nombre: prod.nombre,
                            precio: prod.precio,
                            categoria: prod.categoria,
                            cantidad
                        });
                        document.getElementById(`cantidad-${prod.id}`).value = 0;
                    }
                });

                if (productos.length > 0) {
                    socket.emit("enviarPedido", { mesa: mesaSeleccionada, productos });
                    document.getElementById("seccionMenu").style.display = "none";
                }
            });
    };

    function renderPreparacion(orden) {
        const body = document.getElementById("bodyResumen");
        body.innerHTML = "";

        orden.forEach((item, index) => {
            if (item.estado === "preparando" && item.categoria === "comida") {
                body.innerHTML += `
                    <tr>
                        <td>${item.nombre}</td>
                        <td>${item.cantidad}</td>
                        <td><span class="badge bg-warning">Preparando</span></td>
                    </tr>
                `;
            }

            if (item.estado === "listo") {
                body.innerHTML += `
                    <tr>
                        <td>${item.nombre}</td>
                        <td>${item.cantidad}</td>
                        <td><button class="btn btn-success btn-sm" onclick="entregar(${index})">Entregar</button></td>
                    </tr>
                `;
            }
        });
    }

    window.entregar = function(index) {
        socket.emit("entregarProducto", { mesa: mesaSeleccionada, index, mesero: nombreMesero });
    };

    function renderEntregados(orden) {
        const body = document.getElementById("bodyCuenta");
        body.innerHTML = "";
        let total = 0;

        orden.forEach(item => {
            if (item.estado === "entregado") {
                total += item.precio * item.cantidad;
                body.innerHTML += `
                    <tr>
                        <td>${item.nombre}</td>
                        <td>${item.cantidad}</td>
                        <td>$${item.precio * item.cantidad}</td>
                        <td>${item.entregadoPor}</td>
                    </tr>
                `;
            }
        });

        document.getElementById("totalEntregado").innerText = total;
    }


    window.cerrarMesa = function() {

        if (!mesaSeleccionada) {
            alert("No hay mesa seleccionada");
            return;
        }
    
        if (!confirm("¿Seguro que deseas cerrar la mesa?")) return;
    
        // 🔥 Primero abrir el PDF
        window.open(`/ticket/${mesaSeleccionada}`, "_blank");
    
        // 🔥 Luego cerrar en el servidor
        socket.emit("cerrarMesa", mesaSeleccionada);
    };

    

});

