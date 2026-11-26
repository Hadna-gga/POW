(function () {
    var CLAVE = "mensajePendiente";
    var DURACION = 4500;
    var contenedor = null;
    var visibles = [];

    // Decide el color según el texto: verde (éxito), rojo (error) o neutro (info)
    function detectarTipo(texto) {
        var t = String(texto).toLowerCase();
        var esError = /(error|no se pudo|debes|inv[aá]lid|no v[aá]lid|expir|no hay|selecciona|no se encontr|no encontrad|incorrect|obligatori|ocurri[oó]|ya est[aá]|debe |solo |no puedes|no tienes|no tiene)/.test(t);
        if (esError) return "error";
        var esExito = /(correctamente|correcto|creada|guardado|actualizado|eliminado|agregado)/.test(t);
        return esExito ? "exito" : "info";
    }

    function obtenerContenedor() {
        if (!contenedor) {
            contenedor = document.createElement("div");
            contenedor.className = "contenedor-mensajes";
            document.body.appendChild(contenedor);
        }
        return contenedor;
    }

    function mostrarMensaje(texto, tipo) {
        tipo = tipo || "info";

        var caja = document.createElement("div");
        caja.className = "mensaje mensaje-" + tipo;
        caja.setAttribute("role", tipo === "error" ? "alert" : "status");

        var icono = document.createElement("span");
        icono.className = "mensaje-icono";
        icono.setAttribute("aria-hidden", "true");
        icono.textContent = tipo === "exito" ? "✔" : tipo === "error" ? "✖" : "ℹ";

        // textContent (no innerHTML): el texto nunca se interpreta como HTML (evita XSS)
        var contenido = document.createElement("span");
        contenido.className = "mensaje-texto";
        contenido.textContent = String(texto);

        var cerrar = document.createElement("button");
        cerrar.type = "button";
        cerrar.className = "mensaje-cerrar";
        cerrar.setAttribute("aria-label", "Cerrar mensaje");
        cerrar.textContent = "×";

        var registro = { texto: String(texto), tipo: tipo };
        visibles.push(registro);

        function quitar() {
            var i = visibles.indexOf(registro);
            if (i !== -1) visibles.splice(i, 1);
            caja.classList.add("mensaje-saliendo");
            setTimeout(function () {
                if (caja.parentNode) caja.parentNode.removeChild(caja);
            }, 250);
        }

        cerrar.addEventListener("click", quitar);
        caja.appendChild(icono);
        caja.appendChild(contenido);
        caja.appendChild(cerrar);
        obtenerContenedor().appendChild(caja);

        setTimeout(quitar, DURACION);
    }

    // Todos los alert("...") existentes ahora se muestran como mensaje flotante
    window.alert = function (texto) {
        mostrarMensaje(texto, detectarTipo(texto));
    };
    window.mostrarMensaje = mostrarMensaje;

    // Si la página cambia mientras hay un mensaje visible (por ejemplo, al redirigir
    // después de guardar), lo guardamos para mostrarlo en la página siguiente.
    window.addEventListener("pagehide", function () {
        if (visibles.length === 0) return;
        try {
            sessionStorage.setItem(CLAVE, JSON.stringify({
                mensajes: visibles.slice(),
                hora: Date.now()
            }));
        } catch (error) { /* sin almacenamiento: se ignora */ }
    });

    document.addEventListener("DOMContentLoaded", function () {
        try {
            var guardado = JSON.parse(sessionStorage.getItem(CLAVE) || "null");
            sessionStorage.removeItem(CLAVE);

            if (guardado && Date.now() - guardado.hora < 8000) {
                guardado.mensajes.forEach(function (m) {
                    mostrarMensaje(m.texto, m.tipo);
                });
            }
        } catch (error) { /* se ignora */ }
    });
})();