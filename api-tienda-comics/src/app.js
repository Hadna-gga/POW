
import "dotenv/config";
import express from "express";
import cors from "cors";
import passport from "passport";

import { conectarDB } from "./config/db.js";
import autoresRoutes from "./routes/autores.routes.js";
import comicsRoutes from "./routes/comics.routes.js";
import authRoutes from "./routes/auth.routes.js";

import "./config/passport.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
app.use(express.static("public"));
app.use(passport.initialize());

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ mensaje: "API de la Tienda de Cómics funcionando" });
});

// Rutas de la API
app.use("/api/autores", autoresRoutes);
app.use("/api/comics", comicsRoutes);
app.use("/api/auth", authRoutes);

// Middleware para rutas inexistentes
app.use((req, res) => {
  res.status(404).json({ mensaje: "Ruta no encontrada" });
});

const PORT = process.env.PORT || 3000;

conectarDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error("Error de conexión a MongoDB:", err);
});
