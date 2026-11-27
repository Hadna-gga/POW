const express = require("express");
const router = express.Router();

const Producto = require("../models/Producto");
const Usuario = require("../models/Usuario");
const { verificarToken, soloProductor } = require("../middleware/auth");
const { validarObjectId } = require("../middleware/validar");

// NUEVO
const CATEGORIAS = ["hortalizas", "frutas", "carnes", "lacteos", "granos", "otros"];
const MAX_IMAGEN = 3 * 1024 * 1024; // 3 MB como texto base64

// Convierte un texto en una expresión regular literal (para filtrar sin que
// caracteres como "." o "(" cambien el significado de la búsqueda)
function escaparRegex(texto) {
    return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Valida el cuerpo de un producto. Devuelve un mensaje de error o null si es válido.
function validarDatosProducto({ nombre, descripcion, precio, cantidad, imagen, categoria }) {
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
    // NUEVO: validación de la imagen
    if (imagen !== undefined) {
        if (typeof imagen !== "string") {
            return "La imagen no es válida";
        }
        if (imagen !== "" && !/^data:image\/(png|jpe?g|webp|gif);base64,/.test(imagen)) {
            return "La imagen debe ser PNG, JPG, WEBP o GIF";
        }
        if (imagen.length > MAX_IMAGEN) {
            return "La imagen es demasiado pesada";
        }
    }
    // NUEVO: validación de la categoría
    if (categoria !== undefined && !CATEGORIAS.includes(categoria)) {
        return "La categoría no es válida";
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

        const { nombre, descripcion, precio, imagen, cantidad, categoria } = req.body;

        const usuario = await Usuario.findById(req.usuario.id);

        const nuevoProducto = new Producto({
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            precio,
            imagen,
            categoria: categoria || "otros", // NUEVO
            cantidad,
            ciudad: usuario.ciudad || "", // NUEVO: la ubicación del producto es la de su productor
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
// Filtros opcionales: ?categoria=frutas  y  ?ciudad=Cali (ubicación)
router.get("/", async (req, res) => {
    try {
        const filtro = {};
        const { categoria, ciudad } = req.query;

        if (categoria !== undefined && categoria !== "") {
            if (typeof categoria !== "string" || !CATEGORIAS.includes(categoria)) {
                return res.status(400).json({ mensaje: "La categoría no es válida" });
            }
            filtro.categoria = categoria;
        }

        if (ciudad !== undefined && ciudad !== "") {
            if (typeof ciudad !== "string" || ciudad.length > 60) {
                return res.status(400).json({ mensaje: "La ciudad no es válida" });
            }
            filtro.ciudad = new RegExp("^" + escaparRegex(ciudad.trim()) + "$", "i");
        }

        const productos = await Producto.find(filtro);
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

        const { nombre, descripcion, precio, cantidad, imagen, categoria } = req.body;

        producto.nombre = nombre.trim();
        producto.descripcion = descripcion.trim();
        producto.precio = precio;
        producto.cantidad = cantidad;
        if (imagen !== undefined) {
            producto.imagen = imagen;
        }
        // NUEVO
        if (categoria !== undefined) {
            producto.categoria = categoria;
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