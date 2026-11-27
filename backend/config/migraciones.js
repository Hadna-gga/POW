const Producto = require("../models/Producto");
const Usuario = require("../models/Usuario");

// Los productos publicados antes del filtro por ubicación no tienen "ciudad".
// Al arrancar se les copia la ciudad de su productor. Es idempotente: si no hay
// nada pendiente, no hace nada.
async function completarCiudadProductos() {
    try {
        const pendientes = await Producto.find({
            $or: [{ ciudad: { $exists: false } }, { ciudad: "" }],
            productorId: { $ne: null }
        }).select("productorId");

        if (pendientes.length === 0) {
            return;
        }

        const ids = [...new Set(pendientes.map(p => p.productorId.toString()))];
        const productores = await Usuario.find({ _id: { $in: ids } }).select("ciudad");

        let actualizados = 0;

        for (const productor of productores) {
            if (!productor.ciudad) continue;

            const resultado = await Producto.updateMany(
                {
                    productorId: productor._id,
                    $or: [{ ciudad: { $exists: false } }, { ciudad: "" }]
                },
                { ciudad: productor.ciudad }
            );

            actualizados += resultado.modifiedCount;
        }

        if (actualizados > 0) {
            console.log("Ciudad completada en " + actualizados + " producto(s)");
        }
    } catch (error) {
        // No es crítico: el sitio funciona igual, solo faltaría la ciudad en esos productos
        console.error("No se pudo completar la ciudad de los productos:", error.message);
    }
}

module.exports = { completarCiudadProductos };