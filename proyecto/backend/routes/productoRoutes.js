const express = require("express");
const router = express.Router();

const Producto = require("../models/Producto");
const Usuario = require("../models/Usuario");
const { verificarToken, soloProductor } = require("../middleware/auth");
const { validarObjectId } = require("../middleware/validar");

// Valida el cuerpo de un producto. Devuelve un mensaje de error o null si es válido.
function validarDatosProducto({ nombre, descripcion, precio, cantidad, imagen }) {
    if (typeof nombre !== "string" || !nombre.trim()) {
        return "El nombre es obligatorio";
    }
    if (typeof descripcion !== "string" || !descripcion.trim()) {
        return "La descripción es obligatoria";
    }
    if (typeof precio !== "number" || !Number.isFinite(precio) || precio < 0) {
        return "El precio debe ser un número mayor o igual a cero";
    }
    if (!Number.isInteger(cantidad) || cantidad < 0) {
        return "La cantidad debe ser un número entero mayor o igual a cero";
    }
    if (imagen !== undefined && typeof imagen !== "string") {
        return "La imagen no es válida";
    }
    return null;
}

// A3. CREAR PRODUCTO (solo productores)
router.post("/", verificarToken, soloProductor, async (req, res) => {
    try {
        const error = validarDatosProducto(req.body);

        if (error) {
            return res.status(400).json({ mensaje: error });
        }

        const { nombre, descripcion, precio, imagen, cantidad } = req.body;

        const usuario = await Usuario.findById(req.usuario.id);

        const nuevoProducto = new Producto({
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
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
        console.error(error);
        res.status(500).json({ mensaje: "Error al publicar el producto" });
    }
});

// A1. LISTAR PRODUCTOS (público)
router.get("/", async (req, res) => {
    try {
        const productos = await Producto.find();
        res.json(productos);

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al consultar los productos" });
    }
});

// LISTAR MIS PRODUCTOS (solo productores). Debe ir antes de "/:id"
router.get("/mis-productos", verificarToken, soloProductor, async (req, res) => {
    try {
        const productos = await Producto.find({
            productorId: req.usuario.id
        });

        res.json(productos);

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al consultar tus productos" });
    }
});

// A2. CONSULTAR EL DETALLE DE UN PRODUCTO (público)
router.get("/:id", validarObjectId("id"), async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id);

        if (!producto) {
            return res.status(404).json({ mensaje: "Producto no encontrado" });
        }

        res.json(producto);

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al consultar el producto" });
    }
});

// A5. ELIMINAR PRODUCTO (solo el productor dueño)
router.delete("/:id", verificarToken, soloProductor, validarObjectId("id"), async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id);

        if (!producto) {
            return res.status(404).json({ mensaje: "Producto no encontrado" });
        }

        if (!producto.productorId ||
            producto.productorId.toString() !== req.usuario.id) {
            return res.status(403).json({
                mensaje: "Solo puedes eliminar tus propios productos"
            });
        }

        await Producto.findByIdAndDelete(req.params.id);

        res.json({ mensaje: "Producto eliminado correctamente" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al eliminar el producto" });
    }
});

// A4. MODIFICAR PRODUCTO (solo el productor dueño). Reemplaza los campos: PUT
router.put("/:id", verificarToken, soloProductor, validarObjectId("id"), async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id);

        if (!producto) {
            return res.status(404).json({ mensaje: "Producto no encontrado" });
        }

        if (!producto.productorId ||
            producto.productorId.toString() !== req.usuario.id) {
            return res.status(403).json({
                mensaje: "Solo puedes editar tus propios productos"
            });
        }

        const error = validarDatosProducto(req.body);

        if (error) {
            return res.status(400).json({ mensaje: error });
        }

        const { nombre, descripcion, precio, cantidad, imagen } = req.body;

        producto.nombre = nombre.trim();
        producto.descripcion = descripcion.trim();
        producto.precio = precio;
        producto.cantidad = cantidad;
        if (imagen !== undefined) {
            producto.imagen = imagen;
        }

        await producto.save();

        res.json({
            mensaje: "Producto actualizado correctamente",
            producto
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al actualizar el producto" });
    }
});

module.exports = router;