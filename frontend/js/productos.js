(function () {
    // Categorías disponibles (el valor es lo que se guarda en la base de datos)
    var CATEGORIAS = [
        { valor: "hortalizas", etiqueta: "Hortalizas", icono: "🥬" },
        { valor: "frutas", etiqueta: "Frutas", icono: "🍎" },
        { valor: "carnes", etiqueta: "Carnes", icono: "🥩" },
        { valor: "lacteos", etiqueta: "Lácteos", icono: "🥛" },
        { valor: "granos", etiqueta: "Granos", icono: "🌾" },
        { valor: "otros", etiqueta: "Otros", icono: "📦" }
    ];

    function datosCategoria(valor) {
        return CATEGORIAS.find(function (c) { return c.valor === valor; }) ||
            CATEGORIAS[CATEGORIAS.length - 1];
    }

    // Llena un <select> con las categorías
    function llenarSelectCategorias(select, conTodas) {
        select.innerHTML = "";
        if (conTodas) {
            var todas = document.createElement("option");
            todas.value = "";
            todas.textContent = "Todas las categorías";
            select.appendChild(todas);
        }
        CATEGORIAS.forEach(function (c) {
            var op = document.createElement("option");
            op.value = c.valor;
            op.textContent = c.icono + " " + c.etiqueta;
            select.appendChild(op);
        });
    }

    // Pinta la imagen del producto dentro de un contenedor.
    // Si no tiene imagen, muestra el icono de su categoría.
    function pintarImagen(contenedor, producto) {
        contenedor.textContent = "";
        if (producto && producto.imagen) {
            contenedor.removeAttribute("aria-hidden");
            var img = document.createElement("img");
            img.src = producto.imagen;
            img.alt = producto.nombre || "";
            img.className = "imagen-real";
            contenedor.appendChild(img);
        } else {
            // NUEVO: sin foto, el emoji es decorativo y se oculta a los lectores de pantalla
            contenedor.setAttribute("aria-hidden", "true");
            contenedor.textContent = datosCategoria(producto && producto.categoria).icono;
        }
    }

    // Lee una imagen, la reduce (máx. 800 px) y la devuelve como data URL JPEG.
    // Así no se sube una foto de varios MB a la base de datos.
    function reducirImagen(archivo) {
        return new Promise(function (resolve, reject) {
            if (!archivo || !/^image\//.test(archivo.type)) {
                reject(new Error("El archivo debe ser una imagen"));
                return;
            }
            var lector = new FileReader();
            lector.onerror = function () { reject(new Error("No se pudo leer la imagen")); };
            lector.onload = function () {
                var img = new Image();
                img.onerror = function () { reject(new Error("La imagen no es válida")); };
                img.onload = function () {
                    var max = 800;
                    var escala = Math.min(1, max / Math.max(img.width, img.height));
                    var canvas = document.createElement("canvas");
                    canvas.width = Math.round(img.width * escala);
                    canvas.height = Math.round(img.height * escala);
                    var ctx = canvas.getContext("2d");
                    ctx.fillStyle = "#fff"; // fondo para PNG con transparencia
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL("image/jpeg", 0.8));
                };
                img.src = lector.result;
            };
            lector.readAsDataURL(archivo);
        });
    }

    // Vista previa en vivo al elegir un archivo. Devuelve un objeto con
    // obtener(): la imagen elegida (data URL) o null si no se eligió otra.
    function conectarSelectorImagen(inputArchivo, contenedorVista) {
        var estado = { dataUrl: null };

        inputArchivo.addEventListener("change", async function () {
            var archivo = inputArchivo.files[0];
            if (!archivo) { return; }
            try {
                estado.dataUrl = await reducirImagen(archivo);
                pintarImagen(contenedorVista, { imagen: estado.dataUrl, nombre: "Vista previa" });
            } catch (error) {
                estado.dataUrl = null;
                inputArchivo.value = "";
                alert(error.message);
            }
        });

        return { obtener: function () { return estado.dataUrl; } };
    }

    window.Productos = {
        CATEGORIAS: CATEGORIAS,
        datosCategoria: datosCategoria,
        llenarSelectCategorias: llenarSelectCategorias,
        pintarImagen: pintarImagen,
        conectarSelectorImagen: conectarSelectorImagen
    };
})();