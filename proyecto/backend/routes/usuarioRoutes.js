const express = require("express");
const bcrypt = require("bcrypt");
const Usuario = require("../models/Usuario");
const jwt = require("jsonwebtoken");
const { verificarToken } = require("../middleware/auth");

const router = express.Router();

// B1. REGISTRAR USUARIO
router.post("/registro", async (req, res) => {
    try {
        const { nombre, correo, contrasena, rol } = req.body;

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

        if (!usuario) {
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

        const token = jwt.sign(
            {
                id: usuario._id.toString(),
                rol: usuario.rol
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "2h"
            }
        );

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

// B3. CONSULTAR EL PERFIL DEL USUARIO AUTENTICADO
router.get("/perfil", verificarToken, async (req, res) => {
    try {
        // .select() excluye la contraseña: el hash nunca sale de la API
        const usuario = await Usuario.findById(req.usuario.id)
            .select("nombre correo rol createdAt");

        if (!usuario) {
            return res.status(404).json({ mensaje: "Usuario no encontrado" });
        }

        res.json({
            id: usuario._id,
            nombre: usuario.nombre,
            correo: usuario.correo,
            rol: usuario.rol,
            creadoEn: usuario.createdAt
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al consultar el perfil" });
    }
});

module.exports = router;