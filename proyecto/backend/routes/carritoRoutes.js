const express = require("express");
const router = express.Router();

const Carrito = require("../models/Carrito");
const Producto = require("../models/Producto");

const { verificarToken } = require("../middleware/auth");

function verificarComprador(req, res, next) {
    if (req.usuario.rol !== "consumidor") {
        return res.status(403).json({
            mensaje: "Solo los consumidores pueden utilizar el carrito"
        });
    }

    if (req.params.comprador !== req.usuario.id) {
        return res.status(403).json({
            mensaje: "No puedes acceder al carrito de otro usuario"
        });
    }

    next();
}


// AGREGAR PRODUCTO AL CARRITO
router.post("/:comprador/productos", verificarToken, verificarComprador, async (req, res) => {
    try {
        const { comprador } = req.params;
        const { productoId, cantidad = 1 } = req.body;

        if (!Number.isInteger(cantidad) || cantidad < 1) {
            return res.status(400).json({
                mensaje: "La cantidad debe ser un número entero mayor que cero"
            });
        }

        const producto = await Producto.findById(productoId);

        if (!producto) {
            return res.status(404).json({
                mensaje: "Producto no encontrado"
            });
        }

        let carrito = await Carrito.findOne({ comprador });

        if (!carrito) {
            carrito = new Carrito({
                comprador,
                productos: []
            });
        }

        const productoExistente = carrito.productos.find(
            item => item.producto.toString() === productoId
        );

        const cantidadTotal = productoExistente
            ? productoExistente.cantidad + cantidad
            : cantidad;

        if (cantidadTotal > producto.cantidad) {
            return res.status(400).json({
                mensaje: "No hay suficiente cantidad disponible"
            });
        }

        if (productoExistente) {
            productoExistente.cantidad = cantidadTotal;
        } else {
            carrito.productos.push({
                producto: productoId,
                cantidad
            });
        }

        await carrito.save();

        res.status(200).json({
            mensaje: "Producto agregado al carrito correctamente",
            carrito
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al agregar producto",
            error: error.message
        });
    }
});

// CONSULTAR CARRITO
router.get("/:comprador", verificarToken, verificarComprador, async (req, res) => {
    try {
        const carrito = await Carrito.findOne({
            comprador: req.params.comprador
        }).populate("productos.producto");

        if (!carrito) {
            return res.json({
                comprador: req.params.comprador,
                productos: []
            });
        }

        res.json(carrito);

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al consultar el carrito",
            error: error.message
        });
    }
});

// ELIMINAR PRODUCTO DEL CARRITO
router.delete("/:comprador/productos/:productoId", verificarToken, verificarComprador, async (req, res) => {
    try {
        const { comprador, productoId } = req.params;

        const carrito = await Carrito.findOne({ comprador });

        if (!carrito) {
            return res.status(404).json({
                mensaje: "Carrito no encontrado"
            });
        }

        const cantidadAnterior = carrito.productos.length;

        carrito.productos = carrito.productos.filter(
            item => item.producto.toString() !== productoId
        );

        if (carrito.productos.length === cantidadAnterior) {
            return res.status(404).json({
                mensaje: "Producto no encontrado en el carrito"
            });
        }

        await carrito.save();

        res.json({
            mensaje: "Producto eliminado del carrito correctamente",
            carrito
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al eliminar producto del carrito",
            error: error.message
        });
    }
});
// ACTUALIZAR CANTIDAD DE UN PRODUCTO DEL CARRITO
router.patch("/:comprador/productos/:productoId", verificarToken, verificarComprador, async (req, res) => {
    try {
        const { comprador, productoId } = req.params;
        const { cantidad } = req.body;

        if (!Number.isInteger(cantidad) || cantidad < 1) {
            return res.status(400).json({
                mensaje: "La cantidad debe ser un número entero mayor que cero"
            });
        }

        const producto = await Producto.findById(productoId);

        if (!producto) {
            return res.status(404).json({
                mensaje: "Producto no encontrado"
            });
        }

        if (cantidad > producto.cantidad) {
            return res.status(400).json({
                mensaje: "No hay suficiente cantidad disponible"
            });
        }

        const carrito = await Carrito.findOne({ comprador });

        if (!carrito) {
            return res.status(404).json({
                mensaje: "Carrito no encontrado"
            });
        }

        const item = carrito.productos.find(
            item => item.producto.toString() === productoId
        );

        if (!item) {
            return res.status(404).json({
                mensaje: "El producto no está en el carrito"
            });
        }

        item.cantidad = cantidad;
        await carrito.save();

        res.json({
            mensaje: "Cantidad actualizada correctamente",
            carrito
        });

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al actualizar la cantidad",
            error: error.message
        });
    }
});
module.exports = router;