
const mongoose = require("mongoose");

const productoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    descripcion: {
        type: String,
        required: true
    },
    precio: {
        type: Number,
        required: true,
        min: 0
    },
    imagen: {
        type: String,
        default: ""
    },
    cantidad: {
        type: Number,
        required: true,
        min: 0
    },

    campesino: {
        type: String,
        required: true
    },
    productorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario"
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Producto", productoSchema);
