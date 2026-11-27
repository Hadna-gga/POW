# Roles y permisos

## Roles

| Rol | Quién es | Qué puede hacer |
|---|---|---|
| **Visitante** (sin sesión) | Cualquier persona que entra al sitio | Ver el catálogo de productos, buscar y filtrar, registrarse e iniciar sesión. |
| **consumidor** | Usuario registrado que compra | Todo lo del visitante, más usar **su propio** carrito y ver o editar **su propio** perfil. |
| **productor** | Usuario registrado que vende | Todo lo del visitante, más publicar, modificar y eliminar **sus propios** productos, y ver o editar **su propio** perfil. |

El sistema tiene **dos roles** y ninguno es administrador. El rol se guarda en el campo `rol` del usuario (`"consumidor"` o `"productor"`).

## Matriz de permisos por operación

✅ permitido · ❌ denegado (con el código HTTP que devuelve el servidor)

| Operación | Característica | Visitante | consumidor | productor |
|---|---|:---:|:---:|:---:|
| Listar los productos (`GET /api/productos`) | A1 | ✅ | ✅ | ✅ |
| Consultar un producto (`GET /api/productos/:id`) | A2 | ✅ | ✅ | ✅ |
| Listar mis productos (`GET /api/productos/mis-productos`) | A1 | ❌ 401 | ❌ 403 | ✅ |
| Crear un producto (`POST /api/productos`) | A3 | ❌ 401 | ❌ 403 | ✅ |
| Modificar un producto (`PUT /api/productos/:id`) | A4 | ❌ 401 | ❌ 403 | ✅ solo si es suyo, si no ❌ 403 |
| Eliminar un producto (`DELETE /api/productos/:id`) | A5 | ❌ 401 | ❌ 403 | ✅ solo si es suyo, si no ❌ 403 |
| Registrarse (`POST /api/usuarios/registro`) | B1 | ✅ | ✅ | ✅ |
| Iniciar sesión (`POST /api/usuarios/login`, Google) | B2 | ✅ | ✅ | ✅ |
| Consultar mi perfil (`GET /api/usuarios/perfil`) | B3 | ❌ 401 | ✅ | ✅ |
| Editar mi perfil (`PUT /api/usuarios/perfil`) | B5 | ❌ 401 | ✅ | ✅ |
| Carrito: agregar, consultar, cambiar cantidad, quitar (`/api/carrito/:comprador/...`) | D1 a D4 | ❌ 401 | ✅ solo el suyo, si no ❌ 403 | ❌ 403 |

La característica **B4 (cerrar sesión)** no tiene endpoint: el cliente descarta el token.

## 401 y 403: cuál es la diferencia

| | **401 Unauthorized** | **403 Forbidden** |
|---|---|---|
| Significa | "No sé quién eres": no hay token, es inválido, venció, o el usuario ya no existe. | "Sé quién eres, pero no tienes permiso para esto". |
| Se arregla | Iniciando sesión de nuevo. | No se arregla iniciando sesión: hace falta otro rol o ser el dueño del recurso. |
| Mensajes | "Debes iniciar sesión" · "Sesión inválida o vencida" | "Solo los productores pueden realizar esta acción" · "Solo puedes editar tus propios productos" · "Solo puedes eliminar tus propios productos" · "Solo los consumidores pueden utilizar el carrito" · "No puedes acceder al carrito de otro usuario" |

**Cómo demostrar cada uno** (con el servidor encendido):

```bash
# 401: sin token
curl -i -X POST http://localhost:3000/api/productos -H "Content-Type: application/json" -d '{}'

# 403: con el token de un consumidor
curl -i -X POST http://localhost:3000/api/productos \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN_CONSUMIDOR" -d '{}'
```

En el sitio, las llamadas hechas con `Sesion.llamarAPI` (`frontend/js/sesion.js`) muestran al usuario el mensaje del servidor en un aviso flotante y, ante un **401**, borran la sesión y llevan a `login.html`; un **403** se muestra sin cerrar la sesión.

## Dónde se aplica cada regla en el código

| Regla | Archivo | Qué hace |
|---|---|---|
| **Autenticación** (¿quién eres?) | `backend/middleware/auth.js` → `verificarToken` | Verifica el JWT y responde **401** si falta o es inválido. Después busca al usuario en la base de datos y guarda `req.usuario = { id, rol }`. |
| **Rol productor** (C1) | `backend/middleware/auth.js` → `soloProductor` | Responde **403** si `req.usuario.rol` no es `productor`. Se aplica a crear, modificar, eliminar y "mis productos". |
| **Dueño del producto** (C2) | `backend/routes/productoRoutes.js` (rutas `PUT` y `DELETE`) | Compara `producto.productorId` con `req.usuario.id`; si no coinciden, **403**. "Mis productos" filtra por `productorId`. |
| **Rol consumidor y carrito propio** (C1, C2) | `backend/routes/carritoRoutes.js` → `verificarComprador` | Responde **403** si el rol no es `consumidor` y **403** si `:comprador` de la URL no es el id del usuario del token. |
| **Perfil propio** (C2) | `backend/routes/usuarioRoutes.js` | El perfil se busca siempre con `req.usuario.id` (el del token), nunca con un id recibido en la petición. |
| **Interfaz según el rol** (C3) | `frontend/js/sesion.js` → `exigirSesion(rol)`; `frontend/index.html` | Las páginas de productor y de consumidor exigen sesión y rol y, si no se cumple, redirigen al login. El menú del encabezado cambia (productor: "Mi panel"; consumidor: "Mi carrito") y a los productores se les ocultan el botón de comprar y el carrito. |

> **Ocultar un botón no es seguridad.** La interfaz solo adapta lo que se ve por comodidad. Aunque alguien reactive un botón desde las herramientas del navegador, el servidor vuelve a verificar token, rol y dueño en cada petición y responde 401 o 403.

## Cómo se asigna el rol

- **Registro con contraseña:** el formulario envía `rol` y el servidor **solo acepta `consumidor` o `productor`**; cualquier otro valor (por ejemplo `admin`) se rechaza con 400. La página de registro tiene un formulario para cada tipo de cuenta.
- **Registro con Google:** el rol viaja dentro del parámetro `state` de OAuth, **firmado por el servidor** con `JWT_SECRET` y con vigencia de 10 minutos, así que no puede alterarse. Solo se usa si la cuenta aún no existe.
- **No existe un rol administrador**, por lo que no hay un "primer administrador" que crear ni forma de escalar privilegios: un productor tiene poder únicamente sobre sus propios productos.
- **Decisión de diseño:** el rol llega en el cuerpo del registro porque aquí es una elección de negocio (vender o comprar), no un privilegio sobre otras personas. Si hubiera un rol administrativo, **no** debería poder elegirse al registrarse (se asignaría por un script o directamente en la base de datos).

## Qué pasa si cambia el rol de un usuario con un token vigente

El token contiene el rol, pero **el servidor no se fía de él**: en cada petición `verificarToken` consulta el rol actual en la base de datos. Por eso, si se cambia el rol de un usuario o se elimina su cuenta, el efecto es inmediato aunque su token no haya vencido (un usuario eliminado recibe 401).

## Cómo se agregaría un tercer rol con permisos intermedios

1. **Modelo:** añadir el valor al `enum` de `rol` en `backend/models/Usuario.js`.
2. **Registro:** incluirlo en la lista de roles válidos de `usuarioRoutes.js` (y en `passport.js`, si usará Google).
3. **Middleware:** crear una función como `soloProductor` (o generalizar a `permitirRoles("productor", "nuevo")`) en `auth.js`.
4. **Rutas:** aplicar ese middleware a las operaciones que le correspondan.
5. **Interfaz:** ajustar el menú y `exigirSesion(...)` en el front.
6. **Documentación:** actualizar esta matriz.