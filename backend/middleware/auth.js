const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");

// AUTENTICACIÓN: ¿quién es el usuario? (verifica el JWT)
async function verificarToken(req, res, next) {
    const autorizacion = req.headers.authorization;

    if (!autorizacion || !autorizacion.startsWith("Bearer ")) {
        return res.status(401).json({
            mensaje: "Debes iniciar sesión"
        });
    }

    const token = autorizacion.split(" ")[1];

    let datos;
    try {
        datos = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({
            mensaje: "Sesión inválida o vencida"
        });
    }

    try {
        // El rol se lee SIEMPRE de la base de datos, no del token:
        // así un cambio o eliminación de usuario surte efecto de inmediato.
        const usuario = await Usuario.findById(datos.id).select("rol");

        if (!usuario) {
            return res.status(401).json({
                mensaje: "Sesión inválida o vencida"
            });
        }

        req.usuario = { id: usuario._id.toString(), rol: usuario.rol };
        next();
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            mensaje: "Error al verificar la sesión"
        });
    }
}

// AUTORIZACIÓN: ¿qué puede hacer? (verifica el rol)
function soloProductor(req, res, next) {
    if (req.usuario.rol !== "productor") {
        return res.status(403).json({
            mensaje: "Solo los productores pueden realizar esta acción"
        });
    }

    next();
}

function soloConsumidor(req, res, next) {
    if (req.usuario.rol !== "consumidor") {
        return res.status(403).json({
            mensaje: "Solo los consumidores pueden realizar esta acción"
        });
    }

    next();
}

module.exports = {
    verificarToken,
    soloProductor,
    soloConsumidor
};