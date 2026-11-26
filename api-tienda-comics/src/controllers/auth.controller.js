
import Usuario from "../models/Usuario.js";
import { generarToken } from "../utils/jwt.js";

const datosPublicos = (u) => ({
  id: u._id,
  nombre: u.nombre,
  email: u.email,
  rol: u.rol,
});

export const registrar = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        mensaje: "Nombre, email y contraseña son obligatorios",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        mensaje: "La contraseña debe tener al menos 8 caracteres",
      });
    }

    const existe = await Usuario.findOne({ email });

    if (existe) {
      return res.status(409).json({
        mensaje: "El correo ya está registrado",
      });
    }

    const usuario = await Usuario.create({ nombre, email, password });

    res.status(201).json({
      usuario: datosPublicos(usuario),
      token: generarToken(usuario),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        mensaje: "Email y contraseña son obligatorios",
      });
    }

    const usuario = await Usuario.findOne({ email }).select("+password");

    const valido =
      usuario &&
      usuario.password &&
      (await usuario.compararPassword(password));

    if (!valido) {
      return res.status(401).json({
        mensaje: "Credenciales inválidas",
      });
    }

    res.json({
      usuario: datosPublicos(usuario),
      token: generarToken(usuario),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
};

export const perfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id);

    if (!usuario) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    res.json(datosPublicos(usuario));
  } catch (error) {
    res.status(500).json({
      mensaje: "Error en el servidor",
    });
  }
};
