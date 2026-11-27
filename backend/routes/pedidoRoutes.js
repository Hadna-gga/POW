const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Pedido = require("../models/Pedido");
const Producto = require("../models/Producto");
const Carrito = require("../models/Carrito");

const { verificarToken, soloConsumidor, soloProductor } = require("../middleware/auth");
const { validarObjectId } = require("../middleware/validar");
const { calcularResumen } = require("../config/comision");

const METODOS_PAGO = ["credito", "debito", "otro"];

// Error propio para avisar que un producto ya no tiene existencias suficientes
class SinExistencias extends Error {
    constructor(nombre) {
        super("No hay suficiente cantidad disponible de \"" + nombre + "\"");
        this.nombreProducto = nombre;
    }
}

// Devuelve al inventario lo que ya se había descontado (si algo falla a mitad del pedido)
async function devolverExistencias(descontados) {
    for (const item of descontados) {
        await Producto.updateOne(
            { _id: item.producto },
            { $inc: { cantidad: item.cantidad } }
        );
    }
}

// D5. SIMULAR EL PEDIDO de los productos del carrito (solo consumidores, con SU carrito)
// No hay cobro real: se valida el inventario, se descuenta, se guarda el pedido con el
// desglose (subtotal, envío, comisión solidaria y total) y se vacía el carrito.
router.post("/", verificarToken, soloConsumidor, async (req, res) => {
    const descontados = [];

    try {
        const { metodoPago } = req.body;

        if (typeof metodoPago !== "string" || !METODOS_PAGO.includes(metodoPago)) {
            return res.status(400).json({
                mensaje: "Elige un método de pago válido (credito, debito u otro)"
            });
        }

        // El carrito sale SIEMPRE del usuario del token, nunca de un id enviado en la petición
        const carrito = await Carrito.findOne({ comprador: req.usuario.id });

        if (!carrito || carrito.productos.length === 0) {
            return res.status(400).json({ mensaje: "Tu carrito está vacío" });
        }

        const lineas = [];

        try {
            for (const item of carrito.productos) {
                // Descuento atómico: solo se resta si todavía hay existencias suficientes.
                // findOneAndUpdate devuelve el producto como estaba ANTES de descontar,
                // y de ahí sale el precio con el que se cobra.
                const producto = await Producto.findOneAndUpdate(
                    { _id: item.producto, cantidad: { $gte: item.cantidad } },
                    { $inc: { cantidad: -item.cantidad } }
                );

                if (!producto) {
                    const existente = await Producto.findById(item.producto).select("nombre");
                    throw new SinExistencias(existente ? existente.nombre : "un producto del carrito");
                }

                descontados.push({ producto: producto._id, cantidad: item.cantidad });

                lineas.push({
                    producto: producto._id,
                    productorId: producto.productorId,
                    nombre: producto.nombre,
                    campesino: producto.campesino,
                    precioUnitario: producto.precio,
                    cantidad: item.cantidad,
                    subtotal: producto.precio * item.cantidad
                });
            }

            const resumen = calcularResumen(
                lineas.map(l => ({ precio: l.precioUnitario, cantidad: l.cantidad }))
            );

            const pedido = await Pedido.create({
                comprador: req.usuario.id,
                items: lineas,
                metodoPago,
                ...resumen
            });

            carrito.productos = [];
            await carrito.save();

            return res.status(201).json({
                mensaje: "Pedido simulado correctamente. No se realizó ningún cobro",
                pedido
            });

        } catch (error) {
            // Si algo falló, el inventario vuelve a como estaba
            await devolverExistencias(descontados);

            if (error instanceof SinExistencias) {
                return res.status(409).json({ mensaje: error.message });
            }

            throw error;
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al crear el pedido" });
    }
});

// F2. ESTADÍSTICAS DEL MES del productor: lo vendido en sus productos este mes.
// Debe ir antes de "/:id".
router.get("/ventas-mes", verificarToken, soloProductor, async (req, res) => {
    try {
        const ahora = new Date();
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const productorId = new mongoose.Types.ObjectId(req.usuario.id);

        const porProducto = await Pedido.aggregate([
            { $match: { createdAt: { $gte: inicioMes }, "items.productorId": productorId } },
            { $unwind: "$items" },
            { $match: { "items.productorId": productorId } },
            {
                $group: {
                    _id: "$items.producto",
                    nombre: { $first: "$items.nombre" },
                    unidades: { $sum: "$items.cantidad" },
                    ingresos: { $sum: "$items.subtotal" },
                    pedidos: { $addToSet: "$_id" }
                }
            },
            { $sort: { unidades: -1, nombre: 1 } }
        ]);

        const productos = porProducto.map(p => ({
            producto: p._id,
            nombre: p.nombre,
            unidades: p.unidades,
            ingresos: p.ingresos
        }));

        const pedidosDistintos = new Set();
        porProducto.forEach(p => p.pedidos.forEach(id => pedidosDistintos.add(id.toString())));

        res.json({
            mes: ahora.getFullYear() + "-" + String(ahora.getMonth() + 1).padStart(2, "0"),
            pedidos: pedidosDistintos.size,
            unidades: productos.reduce((suma, p) => suma + p.unidades, 0),
            // Lo que reciben los productores: el valor de sus productos.
            // La comisión solidaria se muestra aparte en el pedido y no se resta de aquí.
            ingresos: productos.reduce((suma, p) => suma + p.ingresos, 0),
            productos
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al consultar las estadísticas" });
    }
});

// LISTAR MIS PEDIDOS (solo consumidores; solo los suyos)
router.get("/", verificarToken, soloConsumidor, async (req, res) => {
    try {
        const pedidos = await Pedido.find({ comprador: req.usuario.id })
            .sort({ createdAt: -1 });

        res.json(pedidos);

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al consultar los pedidos" });
    }
});

// CONSULTAR EL DETALLE DE UN PEDIDO (solo su dueño)
router.get("/:id", verificarToken, soloConsumidor, validarObjectId("id"), async (req, res) => {
    try {
        const pedido = await Pedido.findById(req.params.id);

        if (!pedido) {
            return res.status(404).json({ mensaje: "Pedido no encontrado" });
        }

        if (pedido.comprador.toString() !== req.usuario.id) {
            return res.status(403).json({
                mensaje: "No puedes ver los pedidos de otro usuario"
            });
        }

        res.json(pedido);

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al consultar el pedido" });
    }
});

module.exports = router;