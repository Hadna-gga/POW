# API REST: referencia de endpoints

**URL base:** `http://localhost:3000`  ·  **Formato:** JSON (`Content-Type: application/json`)

## Convenciones

**Autenticación.** Las rutas protegidas exigen el encabezado:

```
Authorization: Bearer <token>
```

El token (JWT, vigencia de 2 horas) se obtiene en `POST /api/usuarios/login`.

**Errores.** Todas las respuestas de error tienen la misma forma:

```json
{ "mensaje": "Texto explicativo" }
```

**Códigos de estado usados**

| Código | Significado en este proyecto |
|---|---|
| `200 OK` | Consulta, modificación o eliminación correcta. |
| `201 Created` | Recurso creado (registro de usuario, producto nuevo). |
| `400 Bad Request` | Datos inválidos o faltantes, id mal formado, stock insuficiente. |
| `401 Unauthorized` | Falta el token, es inválido, venció, o el usuario ya no existe. **No se sabe quién eres.** |
| `403 Forbidden` | Estás autenticado, pero tu rol o el dueño del recurso no te permite la acción. |
| `404 Not Found` | El recurso (producto, carrito) no existe. |
| `500 Internal Server Error` | Error inesperado; el detalle queda en el log del servidor, no en la respuesta. |

**Resumen de endpoints**

| Método | Ruta | Autenticación | Roles permitidos |
|---|---|---|---|
| POST | `/api/usuarios/registro` | No | Público |
| POST | `/api/usuarios/login` | No | Público |
| GET | `/api/usuarios/google` | No | Público (opcional) |
| GET | `/api/usuarios/google/callback` | No | Público (opcional) |
| GET | `/api/usuarios/perfil` | Sí | consumidor, productor |
| PUT | `/api/usuarios/perfil` | Sí | consumidor, productor |
| GET | `/api/productos` | No | Público |
| GET | `/api/productos/:id` | No | Público |
| GET | `/api/productos/mis-productos` | Sí | productor |
| POST | `/api/productos` | Sí | productor |
| PUT | `/api/productos/:id` | Sí | productor (solo el dueño) |
| DELETE | `/api/productos/:id` | Sí | productor (solo el dueño) |
| POST | `/api/carrito/:comprador/productos` | Sí | consumidor (solo su carrito) |
| GET | `/api/carrito/:comprador` | Sí | consumidor (solo su carrito) |
| PATCH | `/api/carrito/:comprador/productos/:productoId` | Sí | consumidor (solo su carrito) |
| DELETE | `/api/carrito/:comprador/productos/:productoId` | Sí | consumidor (solo su carrito) |

> **Cerrar sesión (B4)** no tiene endpoint: el JWT no se guarda en el servidor, así que el cliente simplemente descarta el token.

Los ejemplos usan `curl` (en PowerShell, `curl.exe`). Para reutilizar el token:

```bash
TOKEN="pega-aquí-el-token-del-login"
```

---

## Usuarios

### `POST /api/usuarios/registro`: registrar un usuario (B1)

Público. El rol es `consumidor` o `productor` (cualquier otro valor se rechaza).

**Cuerpo**

| Campo | Tipo | Reglas |
|---|---|---|
| `nombre` | texto | Obligatorio |
| `correo` | texto | Obligatorio, formato de correo; se guarda en minúsculas y es único |
| `contrasena` | texto | Obligatorio, mínimo 8 caracteres; se guarda con bcrypt |
| `rol` | texto | `"consumidor"` o `"productor"` |

```bash
curl -X POST http://localhost:3000/api/usuarios/registro \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Ana Ruiz","correo":"ana@demo.com","contrasena":"Demo12345","rol":"consumidor"}'
```

**201 Created**

```json
{
  "mensaje": "Usuario registrado correctamente",
  "usuario": { "id": "66a1f0c2b3e4d5a6b7c8d9e0", "nombre": "Ana Ruiz", "correo": "ana@demo.com", "rol": "consumidor" }
}
```

**Errores:** `400` "Todos los campos son obligatorios" · "Los datos enviados no son válidos" · "El correo no tiene un formato válido" · "Tipo de usuario no válido" · "La contraseña debe tener al menos 8 caracteres" · "Este correo ya está registrado".

### `POST /api/usuarios/login`: iniciar sesión (B2)

Público.

```bash
curl -X POST http://localhost:3000/api/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"ana@demo.com","contrasena":"Demo12345"}'
```

**200 OK**

```json
{
  "mensaje": "Inicio de sesión correcto",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": { "id": "66a1f0c2b3e4d5a6b7c8d9e0", "nombre": "Ana Ruiz", "correo": "ana@demo.com", "rol": "consumidor" }
}
```

**Errores:** `400` "Ingresa tu correo y contraseña" · "Los datos enviados no son válidos". `401` "Correo o contraseña incorrectos" (el mismo mensaje si el correo no existe, si la contraseña falla o si la cuenta se creó solo con Google, para no revelar qué correos están registrados).

### `GET /api/usuarios/google` y `GET /api/usuarios/google/callback`: Google OAuth 2.0 (opcional)

Públicos. Solo funcionan si las variables `GOOGLE_*` están configuradas; si no, responden **503** "El inicio de sesión con Google no está configurado".

- `GET /api/usuarios/google?rol=productor|consumidor` redirige al usuario a Google (flujo *Authorization Code*). El `rol` solo se usa si la cuenta aún no existe y viaja en el parámetro `state`, firmado con `JWT_SECRET` (vigencia de 10 minutos) para que no se pueda alterar.
- `GET /api/usuarios/google/callback` recibe el código de Google, obtiene el perfil y redirige a `/login-exitoso.html#token=<JWT>`. El token va en el fragmento (`#`), que el navegador no envía a ningún servidor, y la página lo borra de la barra de direcciones. Si algo falla, redirige a `/login.html?error=google` o a `/registro.html?error=google-sin-cuenta`.
- Solo se aceptan cuentas de Google con correo verificado. Si ya existe una cuenta con ese correo, se vincula.

### `GET /api/usuarios/perfil`: consultar el perfil del usuario autenticado (B3)

Requiere token. Roles: consumidor y productor. La contraseña nunca se devuelve.

```bash
curl http://localhost:3000/api/usuarios/perfil -H "Authorization: Bearer $TOKEN"
```

**200 OK**

```json
{
  "id": "66a1f0c2b3e4d5a6b7c8d9e0",
  "nombre": "Ana Ruiz",
  "correo": "ana@demo.com",
  "rol": "consumidor",
  "ciudad": "",
  "telefono": "",
  "creadoEn": "2026-11-26T15:04:11.000Z"
}
```

**Errores:** `401` "Debes iniciar sesión" / "Sesión inválida o vencida" · `404` "Usuario no encontrado".

### `PUT /api/usuarios/perfil`: editar el perfil del usuario autenticado (B5)

Requiere token. Roles: consumidor y productor.

| Campo | Reglas |
|---|---|
| `nombre` | Obligatorio |
| `correo` | Obligatorio, formato válido y no usado por otra cuenta |
| `ciudad` | Opcional (texto) |
| `telefono` | Opcional; si se envía, de 7 a 20 caracteres entre dígitos, `+`, espacios, `()` y `-` |

```bash
curl -X PUT http://localhost:3000/api/usuarios/perfil \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"nombre":"Ana Ruiz","correo":"ana@demo.com","ciudad":"Cali","telefono":"3001234567"}'
```

**200 OK**

```json
{
  "mensaje": "Perfil actualizado correctamente",
  "usuario": { "id": "66a1f0c2b3e4d5a6b7c8d9e0", "nombre": "Ana Ruiz", "correo": "ana@demo.com", "rol": "consumidor", "ciudad": "Cali", "telefono": "3001234567" }
}
```

Si quien edita es un productor, el nombre se actualiza también en todos sus productos.

**Errores:** `400` "El nombre es obligatorio" · "El correo no tiene un formato válido" · "Los datos enviados no son válidos" · "El teléfono no es válido" · "Este correo ya está registrado" · `401` · `404`.

---

## Productos

**Objeto producto**

```json
{
  "_id": "66a1f1d4b3e4d5a6b7c8da01",
  "nombre": "Tomate chonto",
  "descripcion": "Tomates frescos de la finca",
  "precio": 3500,
  "imagen": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "categoria": "hortalizas",
  "cantidad": 20,
  "campesino": "Juan Pérez",
  "productorId": "66a1f0c2b3e4d5a6b7c8d9e1",
  "createdAt": "2026-11-26T15:10:00.000Z",
  "updatedAt": "2026-11-26T15:10:00.000Z"
}
```

`categoria` es una de: `hortalizas`, `frutas`, `carnes`, `lacteos`, `granos`, `otros` (por defecto `otros`). `imagen` es `""` o una imagen en base64 (`data:image/png|jpeg|webp|gif;base64,...`, máximo 3 MB como texto).

### `GET /api/productos`: listar los productos (A1)

Público. Devuelve un arreglo con todos los productos.

```bash
curl http://localhost:3000/api/productos
```

**200 OK:** `[ { ...producto }, { ...producto } ]`  ·  **Errores:** `500`.

### `GET /api/productos/:id`: consultar el detalle de un producto (A2)

Público.

```bash
curl http://localhost:3000/api/productos/66a1f1d4b3e4d5a6b7c8da01
```

**200 OK:** el objeto producto.
**Errores:** `400` "El identificador no es válido" (id mal formado) · `404` "Producto no encontrado" (id con formato correcto que no existe).

### `GET /api/productos/mis-productos`: listar los productos del productor autenticado

Requiere token. Rol: productor. Devuelve solo los productos cuyo `productorId` es el del usuario.

```bash
curl http://localhost:3000/api/productos/mis-productos -H "Authorization: Bearer $TOKEN"
```

**200 OK:** arreglo de productos  ·  **Errores:** `401` · `403` "Solo los productores pueden realizar esta acción".

### `POST /api/productos`: crear un producto (A3)

Requiere token. Rol: productor. El nombre del productor y su id se toman del token, no del cuerpo.

| Campo | Tipo | Reglas |
|---|---|---|
| `nombre` | texto | Obligatorio |
| `descripcion` | texto | Obligatorio |
| `precio` | número | Mayor o igual a 0 |
| `cantidad` | entero | Mayor o igual a 0 |
| `categoria` | texto | Opcional; una de las categorías válidas (por defecto `otros`) |
| `imagen` | texto | Opcional; `""` o imagen base64 PNG/JPG/WEBP/GIF de hasta 3 MB |

```bash
curl -X POST http://localhost:3000/api/productos \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"nombre":"Tomate chonto","descripcion":"Tomates frescos de la finca","precio":3500,"cantidad":20,"categoria":"hortalizas"}'
```

**201 Created**

```json
{ "mensaje": "Producto publicado correctamente", "producto": { "_id": "66a1f1d4b3e4d5a6b7c8da01", "nombre": "Tomate chonto", "...": "..." } }
```

**Errores:** `400` "El nombre es obligatorio" · "La descripción es obligatoria" · "El precio debe ser un número mayor o igual a cero" · "La cantidad debe ser un número entero mayor o igual a cero" · "La imagen debe ser PNG, JPG, WEBP o GIF" · "La imagen es demasiado pesada" · "La categoría no es válida" · `401` · `403` (rol consumidor).

### `PUT /api/productos/:id`: modificar un producto (A4)

Requiere token. Rol: productor, **solo el dueño del producto**. Se usa `PUT` porque el cuerpo reemplaza los campos del producto (nombre, descripción, precio y cantidad son obligatorios); `categoria` e `imagen` solo cambian si se envían.

```bash
curl -X PUT http://localhost:3000/api/productos/66a1f1d4b3e4d5a6b7c8da01 \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"nombre":"Tomate chonto","descripcion":"Tomates frescos","precio":3800,"cantidad":15,"categoria":"hortalizas"}'
```

**200 OK:** `{ "mensaje": "Producto actualizado correctamente", "producto": { ... } }`
**Errores:** `400` (id mal formado o datos inválidos, con los mismos mensajes de la creación) · `401` · `403` "Solo los productores pueden realizar esta acción" / "Solo puedes editar tus propios productos" · `404` "Producto no encontrado".

### `DELETE /api/productos/:id`: eliminar un producto (A5)

Requiere token. Rol: productor, **solo el dueño del producto**.

```bash
curl -X DELETE http://localhost:3000/api/productos/66a1f1d4b3e4d5a6b7c8da01 -H "Authorization: Bearer $TOKEN"
```

**200 OK:** `{ "mensaje": "Producto eliminado correctamente" }`
**Errores:** `400` "El identificador no es válido" · `401` · `403` "Solo puedes eliminar tus propios productos" · `404` "Producto no encontrado".

---

## Carrito

Solo los **consumidores** usan el carrito, y cada uno solo accede al **suyo**: el parámetro `:comprador` debe ser el `id` del usuario autenticado. Un productor recibe `403` "Solo los consumidores pueden utilizar el carrito"; un consumidor que use el id de otro recibe `403` "No puedes acceder al carrito de otro usuario". En los ejemplos, `ID` es el id del usuario.

### `POST /api/carrito/:comprador/productos`: agregar un producto

Cuerpo: `productoId` (id válido) y `cantidad` (entero mayor que 0, por defecto 1). Si el producto ya está en el carrito, se suma la cantidad.

```bash
curl -X POST http://localhost:3000/api/carrito/$ID/productos \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"productoId":"66a1f1d4b3e4d5a6b7c8da01","cantidad":2}'
```

**200 OK:** `{ "mensaje": "Producto agregado al carrito correctamente", "carrito": { ... } }`
**Errores:** `400` "El identificador del producto no es válido" · "La cantidad debe ser un número entero mayor que cero" · "No hay suficiente cantidad disponible" · `401` · `403` · `404` "Producto no encontrado".

### `GET /api/carrito/:comprador`: consultar el carrito

```bash
curl http://localhost:3000/api/carrito/$ID -H "Authorization: Bearer $TOKEN"
```

**200 OK** (con los productos completos):

```json
{
  "_id": "66a1f2e5b3e4d5a6b7c8db10",
  "comprador": "66a1f0c2b3e4d5a6b7c8d9e0",
  "productos": [
    { "producto": { "_id": "66a1f1d4b3e4d5a6b7c8da01", "nombre": "Tomate chonto", "precio": 3500, "...": "..." }, "cantidad": 2 }
  ]
}
```

Si el consumidor aún no tiene carrito: `{ "comprador": "<id>", "productos": [] }`.

### `PATCH /api/carrito/:comprador/productos/:productoId`: cambiar la cantidad

Se usa `PATCH` porque solo cambia un campo (la cantidad) de un elemento del carrito. Cuerpo: `{ "cantidad": 3 }` (entero mayor que 0 y sin superar el stock).

```bash
curl -X PATCH http://localhost:3000/api/carrito/$ID/productos/66a1f1d4b3e4d5a6b7c8da01 \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"cantidad":3}'
```

**200 OK:** `{ "mensaje": "Cantidad actualizada correctamente", "carrito": { ... } }`
**Errores:** `400` (id mal formado, cantidad inválida, "No hay suficiente cantidad disponible") · `401` · `403` · `404` "Producto no encontrado" / "Carrito no encontrado" / "El producto no está en el carrito".

### `DELETE /api/carrito/:comprador/productos/:productoId`: quitar un producto

```bash
curl -X DELETE http://localhost:3000/api/carrito/$ID/productos/66a1f1d4b3e4d5a6b7c8da01 -H "Authorization: Bearer $TOKEN"
```

**200 OK:** `{ "mensaje": "Producto eliminado del carrito correctamente", "carrito": { ... } }`
**Errores:** `400` · `401` · `403` · `404` "Carrito no encontrado" / "Producto no encontrado en el carrito".

---

## Rutas inexistentes y errores generales

- Cualquier ruta bajo `/api` que no exista responde `404` `{ "mensaje": "Ruta no encontrada" }`.
- Un cuerpo que no sea JSON válido responde `400` `{ "mensaje": "El cuerpo de la petición no es un JSON válido" }`.
- El servidor acepta cuerpos de hasta **6 MB**. Un cuerpo mayor no tiene un mensaje propio y termina en el manejador general (`500`, "Error interno del servidor"). El cliente ya reduce las fotos a un tamaño pequeño antes de enviarlas, por lo que no debería ocurrir en el uso normal.