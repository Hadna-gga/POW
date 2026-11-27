const express = require("express");
const bcrypt = require("bcrypt");
const Usuario = require("../models/Usuario");
const Producto = require("../models/Producto");
const jwt = require("jsonwebtoken");
const passport = require("passport"); // NUEVO
const { verificarToken } = require("../middleware/auth");

const router = express.Router();

// NUEVO: un solo lugar para firmar el JWT (lo usan el login normal y el de Google)
function generarToken(usuario) {
    return jwt.sign(
        {
            id: usuario._id.toString(),
            rol: usuario.rol
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "2h"
        }
    );
}

// B1. REGISTRAR USUARIO
router.post("/registro", async (req, res) => {
    try {
        const { nombre, correo, contrasena, rol, ciudad = "" } = req.body;

        if (!nombre || !correo || !contrasena || !rol) {
            return res.status(400).json({
                mensaje: "Todos los campos son obligatorios"
            });
        }

        if (
            typeof nombre !== "string" || typeof correo !== "string" ||
            typeof contrasena !== "string" || typeof rol !== "string"
        ) {
            return res.status(400).json({
                mensaje: "Los datos enviados no son válidos"
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
            return res.status(400).json({
                mensaje: "El correo no tiene un formato válido"
            });
        }

        if (!["consumidor", "productor"].includes(rol)) {
            return res.status(400).json({
                mensaje: "Tipo de usuario no válido"
            });
        }

        if (contrasena.length < 8) {
            return res.status(400).json({
                mensaje: "La contraseña debe tener al menos 8 caracteres"
            });
        }

        // NUEVO: ciudad (ubicación). Opcional, pero obligatoria para productores:
        // es la ubicación de sus productos en el filtro de la tienda.
        if (typeof ciudad !== "string" || ciudad.trim().length > 60) {
            return res.status(400).json({
                mensaje: "La ciudad no es válida"
            });
        }

        if (rol === "productor" && !ciudad.trim()) {
            return res.status(400).json({
                mensaje: "La ciudad es obligatoria para los productores"
            });
        }

        const correoNormalizado = correo.trim().toLowerCase();

        const usuarioExistente = await Usuario.findOne({
            correo: correoNormalizado
        });

        if (usuarioExistente) {
            return res.status(400).json({
                mensaje: "Este correo ya está registrado"
            });
        }

        const contrasenaEncriptada = await bcrypt.hash(contrasena, 10);

        const nuevoUsuario = new Usuario({
            nombre,
            correo: correoNormalizado,
            contrasena: contrasenaEncriptada,
            ciudad: ciudad.trim(),
            rol
        });

        await nuevoUsuario.save();

        res.status(201).json({
            mensaje: "Usuario registrado correctamente",
            usuario: {
                id: nuevoUsuario._id,
                nombre: nuevoUsuario.nombre,
                correo: nuevoUsuario.correo,
                rol: nuevoUsuario.rol
            }
        });

    } catch (error) {
        console.error(error);

        if (error.code === 11000) {
            return res.status(400).json({
                mensaje: "Este correo ya está registrado"
            });
        }

        res.status(500).json({
            mensaje: "Error al registrar el usuario"
        });
    }
});

// B2. INICIAR SESIÓN
router.post("/login", async (req, res) => {
    try {
        const { correo, contrasena } = req.body;

        if (!correo || !contrasena) {
            return res.status(400).json({
                mensaje: "Ingresa tu correo y contraseña"
            });
        }

        if (typeof correo !== "string" || typeof contrasena !== "string") {
            return res.status(400).json({
                mensaje: "Los datos enviados no son válidos"
            });
        }

        const usuario = await Usuario.findOne({
            correo: correo.trim().toLowerCase()
        });

        // NUEVO: las cuentas creadas solo con Google no tienen contraseña
        if (!usuario || !usuario.contrasena) {
            return res.status(401).json({
                mensaje: "Correo o contraseña incorrectos"
            });
        }

        const contrasenaCorrecta = await bcrypt.compare(
            contrasena,
            usuario.contrasena
        );

        if (!contrasenaCorrecta) {
            return res.status(401).json({
                mensaje: "Correo o contraseña incorrectos"
            });
        }

        const token = generarToken(usuario);

        res.json({
            mensaje: "Inicio de sesión correcto",
            token: token,
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: "Error al iniciar sesión"
        });
    }
});

// ===== NUEVO — B2-bis. INICIAR SESIÓN / REGISTRARSE CON GOOGLE (OAuth 2.0) =====

function googleConfigurado(req, res, next) {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.status(503).json({
            mensaje: "El inicio de sesión con Google no está configurado"
        });
    }
    next();
}

// Paso 1: redirige al usuario a Google.
// ?rol=productor|consumidor solo se usa si la cuenta aún no existe (registro).
// El rol viaja dentro de "state", firmado con el JWT_SECRET, para que no se pueda alterar.
router.get("/google", googleConfigurado, (req, res, next) => {
    const payload = { proposito: "google-oauth" };

    if (["consumidor", "productor"].includes(req.query.rol)) {
        payload.rol = req.query.rol;
    }

    const state = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "10m" });

    passport.authenticate("google", {
        scope: ["profile", "email"],
        session: false,
        state: state
    })(req, res, next);
});

// Paso 2: Google vuelve aquí con un código; Passport lo canjea por el perfil.
router.get("/google/callback", googleConfigurado, (req, res, next) => {
    passport.authenticate("google", { session: false }, (error, usuario, info) => {
        if (error) {
            console.error(error);
            return res.redirect("/login.html?error=google");
        }

        if (!usuario) {
            if (info && info.motivo === "sin-cuenta") {
                return res.redirect("/registro.html?error=google-sin-cuenta");
            }
            return res.redirect("/login.html?error=google");
        }

        // El token viaja en el fragmento (#): el navegador no lo envía a ningún servidor
        res.redirect("/login-exitoso.html#token=" + generarToken(usuario));
    })(req, res, next);
});

// B3. CONSULTAR EL PERFIL DEL USUARIO AUTENTICADO
router.get("/perfil", verificarToken, async (req, res) => {
    try {
        // .select() excluye la contraseña: el hash nunca sale de la API
        const usuario = await Usuario.findById(req.usuario.id)
            .select("nombre correo rol ciudad telefono createdAt");

        if (!usuario) {
            return res.status(404).json({ mensaje: "Usuario no encontrado" });
        }

        res.json({
            id: usuario._id,
            nombre: usuario.nombre,
            correo: usuario.correo,
            rol: usuario.rol,
            ciudad: usuario.ciudad || "",
            telefono: usuario.telefono || "",
            creadoEn: usuario.createdAt
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al consultar el perfil" });
    }
});

// B5. EDITAR EL PERFIL DEL USUARIO AUTENTICADO
router.put("/perfil", verificarToken, async (req, res) => {
    try {
        const { nombre, correo, ciudad = "", telefono = "" } = req.body;

        if (typeof nombre !== "string" || !nombre.trim()) {
            return res.status(400).json({ mensaje: "El nombre es obligatorio" });
        }

        if (typeof correo !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
            return res.status(400).json({ mensaje: "El correo no tiene un formato válido" });
        }

        if (typeof ciudad !== "string" || typeof telefono !== "string") {
            return res.status(400).json({ mensaje: "Los datos enviados no son válidos" });
        }

        if (ciudad.trim().length > 60) {
            return res.status(400).json({ mensaje: "La ciudad es demasiado larga" });
        }

        if (telefono.trim() && !/^[0-9+\s()-]{7,20}$/.test(telefono.trim())) {
            return res.status(400).json({ mensaje: "El teléfono no es válido" });
        }

        const correoNormalizado = correo.trim().toLowerCase();

        const otro = await Usuario.findOne({
            correo: correoNormalizado,
            _id: { $ne: req.usuario.id }
        });

        if (otro) {
            return res.status(400).json({ mensaje: "Este correo ya está registrado" });
        }

        const usuario = await Usuario.findById(req.usuario.id);

        if (!usuario) {
            return res.status(404).json({ mensaje: "Usuario no encontrado" });
        }

        usuario.nombre = nombre.trim();
        usuario.correo = correoNormalizado;
        usuario.ciudad = ciudad.trim();
        usuario.telefono = telefono.trim();
        await usuario.save();

        // Los productos guardan el nombre y la ciudad del productor: se mantienen al día
        if (usuario.rol === "productor") {
            await Producto.updateMany(
                { productorId: usuario._id },
                { campesino: usuario.nombre, ciudad: usuario.ciudad }
            );
        }

        res.json({
            mensaje: "Perfil actualizado correctamente",
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol,
                ciudad: usuario.ciudad,
                telefono: usuario.telefono
            }
        });

    } catch (error) {
        console.error(error);

        if (error.code === 11000) {
            return res.status(400).json({ mensaje: "Este correo ya está registrado" });
        }

        res.status(500).json({ mensaje: "Error al actualizar el perfil" });
    }
});

module.exports = router;