
const jwt = require("jsonwebtoken");

function verificarToken(req, res, next) {
    const autorizacion = req.headers.authorization;

    if (!autorizacion || !autorizacion.startsWith("Bearer ")) {
        return res.status(401).json({
            mensaje: "Debes iniciar sesión"
        });
    }

    const token = autorizacion.split(" ")[1];

    try {
        const datos = jwt.verify(token, process.env.JWT_SECRET);

        req.usuario = datos;
        next();
    } catch (error) {
        return res.status(401).json({
            mensaje: "Sesión inválida o vencida"
        });
    }
}

function soloProductor(req, res, next) {
    if (req.usuario.rol !== "productor") {
        return res.status(403).json({
            mensaje: "Solo los productores pueden realizar esta acción"
        });
    }

    next();
}

module.exports = {
    verificarToken,
    soloProductor
};
