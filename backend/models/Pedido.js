const mongoose = require("mongoose");

// Cada línea del pedido guarda una "foto" del producto al momento de comprar:
// si el productor cambia el precio o borra el producto después, el pedido no se altera.
const itemPedidoSchema = new mongoose.Schema({
    producto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Producto",
        required: true
    },
    productorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario"
    },
    nombre: {
        type: String,
        required: true
    },
    campesino: {
        type: String,
        default: ""
    },
    precioUnitario: {
        type: Number,
        required: true,
        min: 0
    },
    cantidad: {
        type: Number,
        required: true,
        min: 1
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });

const pedidoSchema = new mongoose.Schema({
    comprador: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario",
        required: true
    },
    items: {
        type: [itemPedidoSchema],
        validate: [function (items) { return items.length > 0; }, "El pedido no tiene productos"]
    },
    metodoPago: {
        type: String,
        enum: ["credito", "debito", "otro"],
        required: true
    },

    // Desglose transparente (D6)
    subtotal: { type: Number, required: true, min: 0 },
    envio: { type: Number, required: true, min: 0 },
    comisionPorcentaje: { type: Number, required: true, min: 0 },
    comision: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },

    // El MVP solo SIMULA el pedido: no hay cobro real ni pasarela de pago
    estado: {
        type: String,
        enum: ["simulado"],
        default: "simulado"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Pedido", pedidoSchema);