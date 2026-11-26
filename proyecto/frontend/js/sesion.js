(function () {
    // ===== Sesión (guardada en sessionStorage: se borra al cerrar la pestaña) =====
    function obtenerToken() {
        return sessionStorage.getItem("token");
    }

    function obtenerUsuario() {
        try {
            return JSON.parse(sessionStorage.getItem("usuario") || "null");
        } catch (error) {
            return null;
        }
    }

    function guardarSesion(token, usuario) {
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("usuario", JSON.stringify(usuario));
    }

    function limpiarSesion() {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("usuario");
    }

    // B4. Cerrar sesión: con JWT el servidor no guarda sesión, así que basta
    // con que el cliente descarte el token.
    function cerrarSesion(destino) {
        limpiarSesion();
        window.location.replace(destino || "login.html");
    }

    // C3. Protege una página: exige sesión y, si se indica, un rol.
    // Devuelve el usuario, o null si redirigió al login.
    // OJO: esto es solo comodidad de la interfaz; la seguridad real la hace el servidor.
    function exigirSesion(rol) {
        var usuario = obtenerUsuario();

        if (!usuario || !obtenerToken() || (rol && usuario.rol !== rol)) {
            alert(rol ? "Debes iniciar sesión como " + rol : "Debes iniciar sesión");
            window.location.replace("login.html");
            return null;
        }

        return usuario;
    }

    // ===== Llamadas a la API =====
    // Agrega el token, convierte el cuerpo a JSON y maneja en UN solo lugar:
    //   - sin conexión        -> mensaje claro
    //   - 401 (token vencido) -> borra la sesión, avisa y manda al login
    //   - 403 (sin permiso)   -> muestra el mensaje del servidor
    // Si todo sale bien devuelve los datos (JSON). Si falla lanza un error con
    // .status y .mensaje; si .manejado es true, el usuario ya vio el mensaje.
    async function llamarAPI(url, opciones) {
        opciones = Object.assign({}, opciones);
        var publica = opciones.publica === true;   // login y registro: sin token
        delete opciones.publica;

        var headers = Object.assign({}, opciones.headers);
        var token = obtenerToken();

        if (token && !publica) {
            headers["Authorization"] = "Bearer " + token;
        }

        if (opciones.body !== undefined && typeof opciones.body !== "string") {
            headers["Content-Type"] = "application/json";
            opciones.body = JSON.stringify(opciones.body);
        }

        opciones.headers = headers;

        var respuesta;
        try {
            respuesta = await fetch(url, opciones);
        } catch (error) {
            throw crearError(0, "No se pudo conectar con el servidor", false);
        }

        var datos = null;
        try {
            datos = await respuesta.json();
        } catch (error) {
            datos = null;
        }

        if (respuesta.ok) {
            return datos;
        }

        var mensaje = (datos && datos.mensaje) || "Ocurrió un error inesperado";

        if (respuesta.status === 401 && token && !publica) {
            limpiarSesion();
            alert("Tu sesión expiró. Inicia sesión de nuevo");
            window.location.replace("login.html");
            throw crearError(401, mensaje, true);
        }

        if (respuesta.status === 403) {
            alert(mensaje);
            throw crearError(403, mensaje, true);
        }

        throw crearError(respuesta.status, mensaje, false);
    }

    function crearError(status, mensaje, manejado) {
        var error = new Error(mensaje);
        error.status = status;
        error.mensaje = mensaje;
        error.manejado = manejado;
        return error;
    }

    // Úsala en los catch: muestra el mensaje solo si aún no se mostró.
    function mostrarError(error) {
        console.error(error);
        if (!error || !error.manejado) {
            alert((error && error.message) || "Ocurrió un error inesperado");
        }
    }

    window.Sesion = {
        obtenerToken: obtenerToken,
        obtenerUsuario: obtenerUsuario,
        guardarSesion: guardarSesion,
        cerrarSesion: cerrarSesion,
        exigirSesion: exigirSesion,
        llamarAPI: llamarAPI,
        mostrarError: mostrarError
    };
})();