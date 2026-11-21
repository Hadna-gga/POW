
const express = require("express");
const router = express.Router();

const Producto = require("../models/Producto");
const Usuario = require("../models/Usuario");
const { verificarToken, soloProductor } = require("../middleware/auth");

// PUBLICAR PRODUCTO
router.post("/", verificarToken, soloProductor, async (req, res) => {
    try {

        const { nombre, descripcion, precio, imagen, cantidad } = req.body;

        const usuario = await Usuario.findById(req.usuario.id);

        if (!usuario || usuario.rol !== "productor") {
            return res.status(403).json({
                mensaje: "No tienes permiso para publicar productos"
            });
        }

        const nuevoProducto = new Producto({
            nombre,
            descripcion,
            precio,
            imagen,
            cantidad,
            campesino: usuario.nombre,
            productorId: usuario._id
        });


        await nuevoProducto.save();

        res.status(201).json({
            mensaje: "Producto publicado correctamente",
            producto: nuevoProducto
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al publicar el producto",
            error: error.message
        });
    }
});

// CONSULTAR PRODUCTOS
router.get("/", async (req, res) => {
    try {
        const productos = await Producto.find();

        res.json(productos);

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al consultar los productos",
            error: error.message
        });
    }
});

// CONSULTAR MIS PRODUCTOS
router.get("/mis-productos", verificarToken, soloProductor, async (req, res) => {
    try {
        const productos = await Producto.find({
            productorId: req.usuario.id
        });

        res.json(productos);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: "Error al consultar tus productos"
        });
    }
});

// ELIMINAR PRODUCTO
router.delete("/:id", verificarToken, soloProductor, async (req, res) => {
    try {

        const producto = await Producto.findById(req.params.id);

        if (!producto) {
            return res.status(404).json({
                mensaje: "Producto no encontrado"
            });
        }

        if (!producto.productorId ||
            producto.productorId.toString() !== req.usuario.id) {
            return res.status(403).json({
                mensaje: "Solo puedes eliminar tus propios productos"
            });
        }

        await Producto.findByIdAndDelete(req.params.id);

        res.json({
            mensaje: "Producto eliminado correctamente"
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al eliminar el producto",
            error: error.message
        });
    }
});

// ACTUALIZAR PRODUCTO
router.put("/:id", verificarToken, soloProductor, async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id);

        if (!producto) {
            return res.status(404).json({
                mensaje: "Producto no encontrado"
            });
        }

        if (!producto.productorId ||
            producto.productorId.toString() !== req.usuario.id) {
            return res.status(403).json({
                mensaje: "Solo puedes editar tus propios productos"
            });
        }

        const { nombre, descripcion, precio, cantidad } = req.body;

        if (
            typeof nombre !== "string" || !nombre.trim() ||
            typeof descripcion !== "string" || !descripcion.trim() ||
            typeof precio !== "number" || !Number.isFinite(precio) || precio < 0 ||
            !Number.isInteger(cantidad) || cantidad < 0
        ) {
            return res.status(400).json({
                mensaje: "Revisa los datos del producto"
            });
        }

        producto.nombre = nombre.trim();
        producto.descripcion = descripcion.trim();
        producto.precio = precio;
        producto.cantidad = cantidad;

        await producto.save();

        res.json({
            mensaje: "Producto actualizado correctamente",
            producto
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al actualizar el producto",
            error: error.message
        });
    }
});

module.exports = router;
