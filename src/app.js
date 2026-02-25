import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { engine } from "express-handlebars";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes/views.router.js";
import { menu } from "./data/menu.js";
import PDFDocument from "pdfkit";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================= CONFIG HANDLEBARS =================
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ================= RUTAS =================
app.use("/", router);

app.get("/api/menu", (req, res) => {
  res.json(menu);
});

// ================= ESTADO GLOBAL RESTAURANTE =================
let estado = {
  mesas: [
    { id: 1, ocupada: false, mesero: null },
    { id: 2, ocupada: false, mesero: null },
    { id: 3, ocupada: false, mesero: null }
  ],
  ordenes: {},
  historial: [],
  auditoria: []
};

// ================= ESTADO PARA REALTIME PRODUCTS =================
let productosRT = [];

// ================= GENERAR PDF =================
app.get("/ticket/:mesa", (req, res) => {
  const mesa = parseInt(req.params.mesa);
  const ordenesMesa = estado.ordenes[mesa] || [];

  if (ordenesMesa.length === 0) return res.send("No hay órdenes para esta mesa.");

  const total = ordenesMesa.reduce((acc, o) => acc + (o.precio * o.cantidad), 0);
  const doc = new PDFDocument({ margin: 30 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=ticket.pdf");

  doc.pipe(res);

  doc.fontSize(16).text("RESTAURANTE", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Mesa: ${mesa}`);
  doc.text(`Fecha: ${new Date().toLocaleString()}`);
  doc.moveDown();

  doc.text("-----------------------------------");
  ordenesMesa.forEach(o => {
    doc.text(`${o.cantidad} x ${o.nombre}  $${o.precio}`);
  });
  doc.text("-----------------------------------");
  doc.moveDown();

  doc.fontSize(14).text(`Total: $${total}`, { align: "right" });
  doc.moveDown();
  doc.fontSize(12).text("Gracias por su visita", { align: "center" });

  doc.end();
});

// ================= SOCKET.IO =================
io.on("connection", socket => {

  console.log("Nuevo cliente conectado");

  // Enviar estado inicial restaurante
  socket.emit("estado-inicial", estado);

  // ================= REALTIME PRODUCTS =================

  socket.emit("productos-actualizados", productosRT);

  socket.on("agregarProductoRT", producto => {
    productosRT.push(producto);
    io.emit("productos-actualizados", productosRT);
  });

  socket.on("eliminarProductoRT", index => {
    productosRT.splice(index, 1);
    io.emit("productos-actualizados", productosRT);
  });

  // ================= RESTAURANTE =================

  socket.on("ocuparMesa", ({ mesa, mesero }) => {
    const m = estado.mesas.find(x => x.id === mesa);
    if (!m) return;

    if (!m.ocupada) {
      m.ocupada = true;
      m.mesero = mesero;
    }
    if (!estado.ordenes[mesa]) estado.ordenes[mesa] = [];

    io.emit("estado-actualizado", estado);
  });

  socket.on("editarProducto", ({ mesa, index, nuevaCantidad, jefe }) => {
    const orden = estado.ordenes[mesa];
    if (!orden || !orden[index]) return;

    const cantidadOriginal = orden[index].cantidad;
    orden[index].cantidad = nuevaCantidad;

    estado.auditoria.push({
      fecha: new Date(),
      mesa,
      producto: orden[index].nombre,
      mesero: orden[index].entregadoPor || "-",
      jefe,
      tipo: "Cambio de cantidad",
      cantidadOriginal,
      nuevaCantidad
    });

    io.emit("estado-actualizado", estado);
  });

  socket.on("eliminarProducto", ({ mesa, index, jefe }) => {
    const orden = estado.ordenes[mesa];
    if (!orden || !orden[index]) return;

    const nombreProd = orden[index].nombre;
    const cantidadOriginal = orden[index].cantidad;

    estado.auditoria.push({
      fecha: new Date(),
      mesa,
      producto: nombreProd,
      mesero: orden[index].entregadoPor || "-",
      jefe,
      tipo: "Eliminación de producto",
      cantidadOriginal,
      nuevaCantidad: 0
    });

    orden.splice(index, 1);
    io.emit("estado-actualizado", estado);
  });

  socket.on("enviarPedido", ({ mesa, productos }) => {
    if (!estado.ordenes[mesa]) estado.ordenes[mesa] = [];

    productos.forEach(p => {
      const nuevoProducto = {
        ...p,
        estado: p.categoria === "bebida" ? "listo" : "preparando",
        entregadoPor: null,
        timestampPedido: Date.now(),
        timestampListo: null,
        timestampEntregado: null,
        tiempoPreparacion: null,
        tiempoTotal: null
      };
      estado.ordenes[mesa].push(nuevoProducto);
    });

    io.emit("estado-actualizado", estado);
  });

  socket.on("productoListo", ({ mesa, index }) => {
    const orden = estado.ordenes[mesa];
    if (!orden || !orden[index]) return;

    orden[index].estado = "listo";
    orden[index].timestampListo = Date.now();
    orden[index].tiempoPreparacion =
      (orden[index].timestampListo - orden[index].timestampPedido) / 1000;

    io.emit("estado-actualizado", estado);
  });

  socket.on("entregarProducto", ({ mesa, index, mesero }) => {
    const orden = estado.ordenes[mesa];
    if (!orden || !orden[index]) return;

    orden[index].estado = "entregado";
    orden[index].entregadoPor = mesero;
    orden[index].timestampEntregado = Date.now();
    orden[index].tiempoTotal =
      (orden[index].timestampEntregado - orden[index].timestampPedido) / 1000;

    estado.historial.push({ mesa, ...orden[index], fecha: new Date() });

    io.emit("estado-actualizado", estado);
  });

  socket.on("cerrarMesa", mesaId => {
    const m = estado.mesas.find(x => x.id === mesaId);
    if (!m) return;

    const orden = estado.ordenes[mesaId] || [];
    const pendientes = orden.some(
      item => item.estado === "preparando" || item.estado === "listo"
    );

    if (pendientes) {
      socket.emit(
        "errorCerrarMesa",
        "No puedes cerrar la mesa, hay pedidos pendientes."
      );
      return;
    }

    setTimeout(() => {
      m.ocupada = false;
      m.mesero = null;
      delete estado.ordenes[mesaId];
      io.emit("estado-actualizado", estado);
    }, 1000);
  });
});

// ================= SERVER =================
const PORT = 8080;

httpServer.listen(PORT, () => {
  console.log("=========================================");
  console.log("🚀 Servidor iniciado correctamente");
  console.log("");
  console.log(`🏠 Inicio:              http://localhost:${PORT}`);
  console.log(`📡 Tiempo Real:         http://localhost:${PORT}/realtimeproducts`);
  console.log("=========================================");
});