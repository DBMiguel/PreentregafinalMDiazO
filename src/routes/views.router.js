import { Router } from "express";
import { menu } from "../data/menu.js";

const router = Router();

router.get("/", (req, res) => {
    res.render("home");
});


router.get("/realtimeproducts", (req, res) => {
    res.render("realTimeProducts");
  });
  
  router.get("/mesero", (req, res) => {
    res.render("mesero", {
        css: "mesero.css",
        js: "mesero.js"
    });
});

router.get("/cocinero", (req, res) => {
    res.render("cocinero", {
        css: "cocinero.css",
        js: "cocinero.js"
    });
});

router.get("/jefe", (req, res) => {
    res.render("jefe", {
        css: "jefe.css",
        js: "jefe.js"
    });
});

router.get("/api/menu", (req, res) => {
    res.json(menu);
});


router.get("/administrador", (req, res) => {
    res.render("administrador");
  });

  
export default router;
