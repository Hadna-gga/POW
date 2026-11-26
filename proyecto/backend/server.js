require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const conectarDB = require("./config/db");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Servir el front-end (la carpeta /frontend) desde el mismo servidor
app.use(express.static(path.join(__dirname, "..", "frontend")));

// Conectar MongoDB
conectarDB();

// Rutas de productos
const productoRoutes = require("./routes/productoRoutes");
app.use("/api/productos", productoRoutes);

// Rutas de usuarios
const usuarioRoutes = require("./routes/usuarioRoutes");
app.use("/api/usuarios", usuarioRoutes);

// Rutas del carrito de compras
const carritoRoutes = require("./routes/carritoRoutes");
app.use("/api/carrito", carritoRoutes);

// Rutas de la API inexistentes: 404 en JSON
app.use("/api", (req, res) => {
    res.status(404).json({ mensaje: "Ruta no encontrada" });
});

// Manejo de errores no controlados (por ejemplo, JSON mal formado).
// Tiene 4 parámetros: así Express sabe que es un middleware de errores.
app.use((error, req, res, next) => {
    if (error.type === "entity.parse.failed") {
        return res.status(400).json({
            mensaje: "El cuerpo de la petición no es un JSON válido"
        });
    }

    console.error(error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor funcionando en el puerto ${PORT}`);
});