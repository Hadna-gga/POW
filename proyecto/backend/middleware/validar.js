const mongoose = require("mongoose");

function validarObjectId(nombreParametro) {
    return function (req, res, next) {
        if (!mongoose.isValidObjectId(req.params[nombreParametro])) {
            return res.status(400).json({ mensaje: "El identificador no es válido" });
        }
        next();
    };
}

module.exports = { validarObjectId };