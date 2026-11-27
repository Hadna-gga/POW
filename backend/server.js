require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const passport = require("passport"); // NUEVO
const conectarDB = require("./config/db");
const { COMISION_PORCENTAJE } = require("./config/comision");
const { completarCiudadProductos } = require("./config/migraciones");
require("./config/passport"); // NUEVO: estrategia de Google (OAuth 2.0)

const app = express();

// Middlewares
app.use(cors());
// Límite mayor: las imágenes de los productos viajan como data URL (base64)
app.use(express.json({ limit: "6mb" }));
app.use(passport.initialize()); // NUEVO: sin sesiones del servidor, la API sigue usando JWT

// Servir el front-end (la carpeta /frontend) desde el mismo servidor
app.use(express.static(path.join(__dirname, "..", "frontend")));

// Conectar MongoDB (y, ya conectado, completar la ciudad de productos antiguos)
conectarDB().then(completarCiudadProductos);

// Rutas de productos
const productoRoutes = require("./routes/productoRoutes");
app.use("/api/productos", productoRoutes);

// Rutas de pedidos (simulación de pedido y estadísticas del productor)
const pedidoRoutes = require("./routes/pedidoRoutes");
app.use("/api/pedidos", pedidoRoutes);

// Comisión solidaria: porcentaje público y visible para cualquier visitante
app.get("/api/comision", (req, res) => {
    res.json({ porcentaje: COMISION_PORCENTAJE });
});

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