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
    // NUEVO: categoría del producto (para el filtro de la tienda)
    categoria: {
        type: String,
        enum: ["hortalizas", "frutas", "carnes", "lacteos", "granos", "otros"],
        default: "otros"
    },
    cantidad: {
        type: Number,
        required: true,
        min: 0
    },
    // NUEVO: ubicación del producto (la ciudad de su productor), para el filtro por ubicación
    ciudad: {
        type: String,
        trim: true,
        default: ""
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