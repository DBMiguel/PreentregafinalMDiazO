import { Router } from "express";
import { Product } from "../models/product.model.js";

const router = Router();

/* ======================================
   GET PRODUCTOS CON PAGINACIÓN
====================================== */

router.get("/", async (req, res) => {

  try {

    let { limit = 10, page = 1, sort, query } = req.query;

    let filter = {};

    // filtro por categoría o disponibilidad
    if (query) {

      if (query === "available") {
        filter.stock = { $gt: 0 };
      } else {
        filter.category = query;
      }

    }

    let options = {
      limit: parseInt(limit),
      page: parseInt(page),
      lean: true
    };

    // ordenamiento por precio
    if (sort) {
      options.sort = {
        price: sort === "asc" ? 1 : -1
      };
    }

    const result = await Product.paginate(filter, options);

    res.json({

      status: "success",
      payload: result.docs,
      totalPages: result.totalPages,
      prevPage: result.prevPage,
      nextPage: result.nextPage,
      page: result.page,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,

      prevLink: result.hasPrevPage
        ? `/api/products?page=${result.prevPage}`
        : null,

      nextLink: result.hasNextPage
        ? `/api/products?page=${result.nextPage}`
        : null

    });

  } catch (error) {

    res.status(500).json({
      status: "error",
      error: error.message
    });

  }

});


/* ======================================
   GET PRODUCTO POR ID
====================================== */

router.get("/:pid", async (req, res) => {

  try {

    const product = await Product.findById(req.params.pid);

    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Producto no encontrado"
      });
    }

    res.json({
      status: "success",
      payload: product
    });

  } catch (error) {

    res.status(500).json({
      status: "error",
      error: error.message
    });

  }

});


/* ======================================
   CREAR PRODUCTO
====================================== */

router.post("/", async (req, res) => {

  try {

    const newProduct = await Product.create(req.body);

    res.json({
      status: "success",
      payload: newProduct
    });

  } catch (error) {

    res.status(500).json({
      status: "error",
      error: error.message
    });

  }

});


export default router;