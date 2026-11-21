const mongoose = require("mongoose");

const carritoSchema = new mongoose.Schema({
    comprador: {
        type: String,
        required: true
    },
    productos: [
        {
            producto: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Producto",
                required: true
            },
            cantidad: {
                type: Number,
                required: true,
                min: 1,
                default: 1
            }
        }
    ]
}, {
    timestamps: true
});

module.exports = mongoose.model("Carrito", carritoSchema);