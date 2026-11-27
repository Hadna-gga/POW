// D6. COMISIÓN SOLIDARIA TRANSPARENTE
// Un solo lugar define el porcentaje y cómo se calcula el resumen de una compra.
// Lo usan el carrito (para mostrarlo), el pedido (para guardarlo) y /api/comision (público).

function leerPorcentaje() {
    const valor = Number(process.env.COMISION_PORCENTAJE);

    // Si la variable no existe o no es válida, se usa el 5 % de la propuesta
    if (process.env.COMISION_PORCENTAJE === undefined ||
        process.env.COMISION_PORCENTAJE === "" ||
        !Number.isFinite(valor) || valor < 0 || valor > 100) {
        return 5;
    }

    return valor;
}

const COMISION_PORCENTAJE = leerPorcentaje();
const COSTO_ENVIO = 0; // el MVP no cobra envío (se muestra en $0)

// items: [{ precio, cantidad }]  ->  resumen de la compra (valores en pesos enteros)
//   subtotal : lo que suman los productos (todo esto es para los productores)
//   comision : subtotal * porcentaje, visible y separada (sostiene la plataforma)
//   total    : subtotal + envío + comisión
function calcularResumen(items) {
    const subtotal = items.reduce(function (suma, item) {
        return suma + item.precio * item.cantidad;
    }, 0);

    const comision = Math.round(subtotal * COMISION_PORCENTAJE / 100);

    return {
        subtotal: subtotal,
        envio: COSTO_ENVIO,
        comisionPorcentaje: COMISION_PORCENTAJE,
        comision: comision,
        total: subtotal + COSTO_ENVIO + comision
    };
}

module.exports = { COMISION_PORCENTAJE, COSTO_ENVIO, calcularResumen };