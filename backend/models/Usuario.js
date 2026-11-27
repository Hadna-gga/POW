const mongoose = require("mongoose");

const usuarioSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    correo: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    // NUEVO: la contraseña solo es obligatoria si el usuario NO se registró con Google
    contrasena: {
        type: String,
        required: function () {
            return !this.googleId;
        }
    },
    // NUEVO: identificador del usuario en Google (vacío si se registró con contraseña)
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    ciudad: {
        type: String,
        trim: true,
        default: ""
    },
    telefono: {
        type: String,
        trim: true,
        default: ""
    },
    rol: {
        type: String,
        enum: ["consumidor", "productor"],
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Usuario", usuarioSchema);