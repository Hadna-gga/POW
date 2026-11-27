// Datos de prueba para la demostración: un productor, un consumidor y algunos productos.
// Uso (desde la carpeta backend, con el .env configurado):   npm run seed
// Es idempotente: si los usuarios o productos ya existen, no los duplica.

require("dotenv").config();

const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const Usuario = require("../models/Usuario");
const Producto = require("../models/Producto");

const CLAVE_DEMO = "Demo12345";

async function crearUsuario(datos) {
    let usuario = await Usuario.findOne({ correo: datos.correo });

    if (usuario) {
        console.log("Ya existe:", datos.correo);
        return usuario;
    }

    usuario = await Usuario.create({
        ...datos,
        contrasena: await bcrypt.hash(CLAVE_DEMO, 10)
    });

    console.log("Creado:", datos.correo, "(" + datos.rol + ")");
    return usuario;
}

async function main() {
    if (!process.env.MONGO_URI) {
        console.error("Falta MONGO_URI en backend/.env");
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);

    const productor = await crearUsuario({
        nombre: "Productor Demo",
        correo: "productor@demo.com",
        ciudad: "Cali",
        telefono: "3001234567",
        rol: "productor"
    });

    await crearUsuario({
        nombre: "Consumidor Demo",
        correo: "consumidor@demo.com",
        ciudad: "Cali",
        rol: "consumidor"
    });

    const productos = [
        { nombre: "Tomate chonto", descripcion: "Tomate fresco cosechado esta semana", precio: 4500, cantidad: 40, categoria: "hortalizas" },
        { nombre: "Mora de Castilla", descripcion: "Mora orgánica, sin intermediarios", precio: 9000, cantidad: 25, categoria: "frutas" },
        { nombre: "Queso campesino", descripcion: "Queso artesanal de finca", precio: 18000, cantidad: 15, categoria: "lacteos" }
    ];

    for (const datos of productos) {
        const existe = await Producto.findOne({ nombre: datos.nombre, productorId: productor._id });

        if (existe) {
            console.log("Ya existe el producto:", datos.nombre);
            continue;
        }

        await Producto.create({
            ...datos,
            ciudad: productor.ciudad,
            campesino: productor.nombre,
            productorId: productor._id
        });

        console.log("Producto creado:", datos.nombre);
    }

    console.log("\nListo. Contraseña de los usuarios demo:", CLAVE_DEMO);
    await mongoose.disconnect();
}

main().catch(function (error) {
    console.error(error);
    process.exit(1);
});