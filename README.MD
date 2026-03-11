# 🍽️ Sistema de Gestión de Restaurante (Backend)

Proyecto desarrollado como **Entrega Final del curso de Programación Backend**.
La aplicación simula el funcionamiento de un restaurante con **gestión de mesas, pedidos en tiempo real, productos y carritos**, utilizando tecnologías modernas de backend.

---

# 🚀 Tecnologías utilizadas

* Node.js
* Express.js
* MongoDB
* Mongoose
* Socket.io
* Handlebars
* PDFKit

---


# 📦 Funcionalidades principales

✅ Gestión de productos con **MongoDB**
✅ Consultas con **paginación, filtros y ordenamiento**
✅ Gestión de **carritos de compra**
✅ Comunicación en **tiempo real con WebSockets**
✅ Sistema de **roles del restaurante**

Roles disponibles:

* 👨‍🍳 Cocinero
* 🧑‍💼 Jefe
* 🧑‍🍽️ Mesero
* 🧑‍💻 Administrador

Además incluye:

* Generación de **tickets en PDF**
* Control de **mesas del restaurante**
* Auditoría de cambios en pedidos

---

# 🔌 Endpoints principales

### Productos

```
GET /api/products
GET /api/products/:pid
POST /api/products
```

Consultas avanzadas:

```
/api/products?limit=10
/api/products?page=2
/api/products?sort=asc
/api/products?query=bebida
```

---

### Carritos

```
POST /api/carts
GET /api/carts/:cid
POST /api/carts/:cid/products/:pid
DELETE /api/carts/:cid/products/:pid
PUT /api/carts/:cid/products/:pid
DELETE /api/carts/:cid
```

Los carritos utilizan **populate de MongoDB** para traer los productos completos.

---

# 📡 Sistema en tiempo real

La aplicación utiliza **Socket.io** para:

* Actualizar pedidos en cocina
* Entregar productos
* Controlar estado de mesas
* Sincronizar información entre roles

---

# 📂 Estructura del proyecto

```
public/
 └── js/
      └── index.js

src/
 ├── app.js
 ├── data/
 │    ├── estado.js
 │    └── menu.js
 │
 ├── models/
 │    ├── product.model.js
 │    └── cart.model.js
 │
 ├── routes/
 │    ├── views.router.js
 │    ├── products.router.js
 │    └── carts.router.js
 │
 ├── sockets/
 │    └── taqueria.socket.js
 │
 ├── public/
 │    └── js/
 │         └── jefe.js
 │
 └── views/
      ├── home.handlebars
      └── layouts/
           └── main.handlebars
```

---

# 👨‍💻 Autor

**Miguel Díaz**

Proyecto desarrollado como práctica de desarrollo backend utilizando Node.js y MongoDB.
