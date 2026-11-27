(function () {
    var CLAVE = "mensajePendiente";
    var DURACION = 7000; // más tiempo de lectura; además se pausa al pasar el mouse o enfocar
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
            // NUEVO (4.1.3 Mensajes de estado): región "en vivo" para lectores de pantalla
            contenedor.setAttribute("role", "status");
            contenedor.setAttribute("aria-live", "polite");
            contenedor.setAttribute("aria-relevant", "additions");
            document.body.appendChild(contenedor);
        }
        return contenedor;
    }

    function mostrarMensaje(texto, tipo) {
        tipo = tipo || "info";

        var caja = document.createElement("div");
        caja.className = "mensaje mensaje-" + tipo;
        // (el contenedor ya es una región en vivo: no hace falta un role en cada mensaje)

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

        // NUEVO: el mensaje no desaparece mientras el usuario lo está leyendo
        var temporizador = setTimeout(quitar, DURACION);
        function pausar() { clearTimeout(temporizador); }
        function reanudar() { temporizador = setTimeout(quitar, DURACION); }
        caja.addEventListener("mouseenter", pausar);
        caja.addEventListener("mouseleave", reanudar);
        caja.addEventListener("focusin", pausar);
        caja.addEventListener("focusout", reanudar);
    }

    // Todos los alert("...") existentes ahora se muestran como mensaje flotante
    window.alert = function (texto) {
        mostrarMensaje(texto, detectarTipo(texto));
    };
    window.mostrarMensaje = mostrarMensaje;

    // Cuadro de confirmación dentro de la app (reemplaza al confirm() del navegador).
    // Uso: if (!(await confirmarAccion("¿Seguro?"))) return;
    window.confirmarAccion = function (texto, textoAceptar, textoCancelar) {
        return new Promise(function (resolver) {
            var anterior = document.activeElement;

            var fondo = document.createElement("div");
            fondo.className = "dialogo-fondo";

            var caja = document.createElement("div");
            caja.className = "dialogo";
            caja.setAttribute("role", "alertdialog");
            caja.setAttribute("aria-modal", "true");
            caja.setAttribute("aria-label", String(texto));

            var mensaje = document.createElement("p");
            mensaje.className = "dialogo-texto";
            mensaje.textContent = String(texto); // textContent: evita XSS

            var botones = document.createElement("div");
            botones.className = "dialogo-botones";

            var cancelar = document.createElement("button");
            cancelar.type = "button";
            cancelar.className = "dialogo-cancelar";
            cancelar.textContent = textoCancelar || "Cancelar";

            var aceptar = document.createElement("button");
            aceptar.type = "button";
            aceptar.className = "dialogo-aceptar";
            aceptar.textContent = textoAceptar || "Aceptar";

            function cerrar(resultado) {
                document.removeEventListener("keydown", teclado);
                if (fondo.parentNode) fondo.parentNode.removeChild(fondo);
                if (anterior && anterior.focus) anterior.focus();
                resolver(resultado);
            }

            function teclado(e) {
                if (e.key === "Escape") cerrar(false);
            }

            cancelar.addEventListener("click", function () { cerrar(false); });
            aceptar.addEventListener("click", function () { cerrar(true); });
            fondo.addEventListener("click", function (e) {
                if (e.target === fondo) cerrar(false);
            });
            document.addEventListener("keydown", teclado);

            botones.append(cancelar, aceptar);
            caja.append(mensaje, botones);
            fondo.appendChild(caja);
            document.body.appendChild(fondo);
            aceptar.focus();
        });
    };

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

    // ===== NUEVO: botón de alto contraste (1.4.3 Contraste) =====
    var CLAVE_CONTRASTE = "altoContraste";

    function leerContraste() {
        try { return localStorage.getItem(CLAVE_CONTRASTE) === "1"; } catch (e) { return false; }
    }

    function guardarContraste(activo) {
        try { localStorage.setItem(CLAVE_CONTRASTE, activo ? "1" : "0"); } catch (e) { /* se ignora */ }
    }

    function aplicarContraste(activo) {
        document.documentElement.classList.toggle("alto-contraste", activo);
    }

    // Se aplica de inmediato para evitar el "parpadeo" del tema normal
    aplicarContraste(leerContraste());

    function crearBotonContraste() {
        var boton = document.createElement("button");
        boton.type = "button";
        boton.className = "btn-contraste";
        boton.textContent = "◐ Alto contraste";

        function actualizar() {
            boton.setAttribute("aria-pressed", String(document.documentElement.classList.contains("alto-contraste")));
        }

        boton.addEventListener("click", function () {
            var activo = !document.documentElement.classList.contains("alto-contraste");
            aplicarContraste(activo);
            guardarContraste(activo);
            actualizar();
        });

        actualizar();
        document.body.appendChild(boton);
    }

    document.addEventListener("DOMContentLoaded", function () {
        crearBotonContraste();
        obtenerContenedor(); // la región en vivo existe desde el inicio

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