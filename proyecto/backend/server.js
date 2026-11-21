require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const conectarDB = require("./config/db");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
// Mostrar las páginas HTML del proyecto
app.use(express.static(path.join(__dirname, "..")));

// Conectar MongoDB
conectarDB();

// Ruta principal
app.get("/", (req, res) => {
    res.send("Backend de Del Campo a tu Mesa funcionando");
});

// Rutas de productos
const productoRoutes = require("./routes/productoRoutes");
app.use("/api/productos", productoRoutes);

// Rutas de usuarios
const usuarioRoutes = require("./routes/usuarioRoutes");
app.use("/api/usuarios", usuarioRoutes);

// Rutas del carrito de compras
const carritoRoutes = require("./routes/carritoRoutes");
app.use("/api/carrito", carritoRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor funcionando en el puerto ${PORT}`);
});
