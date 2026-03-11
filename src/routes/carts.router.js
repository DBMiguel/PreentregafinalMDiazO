import { Router } from "express";
import { Cart } from "../models/cart.model.js";

const router = Router();


/* ======================================
   CREAR CARRITO
====================================== */

router.post("/", async (req, res) => {

  try {

    const newCart = await Cart.create({ products: [] });

    res.json({
      status: "success",
      payload: newCart
    });

  } catch (error) {

    res.status(500).json({
      status: "error",
      error: error.message
    });

  }

});


/* ======================================
   OBTENER CARRITO CON POPULATE
====================================== */

router.get("/:cid", async (req, res) => {

  try {

    const cart = await Cart
      .findById(req.params.cid)
      .populate("products.product");

    if (!cart) {

      return res.status(404).json({
        status: "error",
        message: "Carrito no encontrado"
      });

    }

    res.json({
      status: "success",
      payload: cart
    });

  } catch (error) {

    res.status(500).json({
      status: "error",
      error: error.message
    });

  }

});


/* ======================================
   AGREGAR PRODUCTO AL CARRITO
====================================== */

router.post("/:cid/products/:pid", async (req, res) => {

  try {

    const { cid, pid } = req.params;

    const cart = await Cart.findById(cid);

    const existingProduct = cart.products.find(
      p => p.product.toString() === pid
    );

    if (existingProduct) {

      existingProduct.quantity += 1;

    } else {

      cart.products.push({
        product: pid,
        quantity: 1
      });

    }

    await cart.save();

    res.json({
      status: "success",
      payload: cart
    });

  } catch (error) {

    res.status(500).json({
      status: "error",
      error: error.message
    });

  }

});


/* ======================================
   ELIMINAR PRODUCTO DEL CARRITO
====================================== */

router.delete("/:cid/products/:pid", async (req, res) => {

  try {

    const { cid, pid } = req.params;

    const cart = await Cart.findById(cid);

    cart.products = cart.products.filter(
      p => p.product.toString() !== pid
    );

    await cart.save();

    res.json({
      status: "success",
      payload: cart
    });

  } catch (error) {

    res.status(500).json({
      status: "error",
      error: error.message
    });

  }

});


/* ======================================
   ACTUALIZAR CANTIDAD DE PRODUCTO
====================================== */

router.put("/:cid/products/:pid", async (req, res) => {

  try {

    const { cid, pid } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findById(cid);

    const product = cart.products.find(
      p => p.product.toString() === pid
    );

    if (product) {
      product.quantity = quantity;
    }

    await cart.save();

    res.json({
      status: "success",
      payload: cart
    });

  } catch (error) {

    res.status(500).json({
      status: "error",
      error: error.message
    });

  }

});


/* ======================================
   ACTUALIZAR TODO EL CARRITO
====================================== */

router.put("/:cid", async (req, res) => {

  try {

    const { products } = req.body;

    const cart = await Cart.findByIdAndUpdate(

      req.params.cid,
      { products },
      { new: true }

    );

    res.json({
      status: "success",
      payload: cart
    });

  } catch (error) {

    res.status(500).json({
      status: "error",
      error: error.message
    });

  }

});


/* ======================================
   VACIAR CARRITO
====================================== */

router.delete("/:cid", async (req, res) => {

  try {

    const cart = await Cart.findByIdAndUpdate(

      req.params.cid,
      { products: [] },
      { new: true }

    );

    res.json({
      status: "success",
      payload: cart
    });

  } catch (error) {

    res.status(500).json({
      status: "error",
      error: error.message
    });

  }

});


export default router;