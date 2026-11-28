# Lista de características (FDD)

Cada característica se redacta con la plantilla de FDD: **\<acción\> \<resultado\> \<objeto\>**. Aquí, el **recurso** principal es el **producto**.

Estados: *Implementada* (existe en el código) · *No implementada* (se dejó fuera del alcance).

## Características mínimas

### Conjunto A: Gestión de productos

| ID | Característica | Conjunto | Estado | Dónde está en el código |
|---|---|---|---|---|
| A1 | Listar los productos | A | Implementada | `GET /api/productos` · `frontend/index.html` (catálogo) |
| A2 | Consultar el detalle de un producto | A | Implementada (API) | `GET /api/productos/:id` |
| A3 | Crear un producto | A | Implementada | `POST /api/productos` · `frontend/agregar-producto.html` |
| A4 | Modificar los datos de un producto | A | Implementada | `PUT /api/productos/:id` · `frontend/editar-producto.html` |
| A5 | Eliminar un producto | A | Implementada | `DELETE /api/productos/:id` · `frontend/productos-productor.html` |

### Conjunto B: Autenticación

| ID | Característica | Conjunto | Estado | Dónde está en el código |
|---|---|---|---|---|
| B1 | Registrar un usuario | B | Implementada | `POST /api/usuarios/registro` · `frontend/registro-consumidor.html`, `registro-productor.html` |
| B2 | Iniciar la sesión de un usuario (JWT) | B | Implementada | `POST /api/usuarios/login` · `frontend/login.html` |
| B3 | Consultar el perfil del usuario autenticado | B | Implementada | `GET /api/usuarios/perfil` · `frontend/perfil-productor.html` |
| B4 | Cerrar la sesión de un usuario | B | Implementada (en el cliente) | `Sesion.cerrarSesion()` en `frontend/js/sesion.js` · botones «Cerrar sesión» |

### Conjunto C: Autorización

| ID | Característica | Conjunto | Estado | Dónde está en el código |
|---|---|---|---|---|
| C1 | Restringir la creación, modificación y eliminación de productos a los roles autorizados | C | Implementada | `soloProductor` en `backend/middleware/auth.js` · `backend/routes/productoRoutes.js` |
| C2 | Restringir a cada usuario el acceso a sus propios recursos | C | Implementada | Dueño del producto en `productoRoutes.js` · `verificarComprador` en `carritoRoutes.js` · perfil por `req.usuario.id` |
| C3 | Adaptar las opciones de la interfaz según el rol del usuario | C | Implementada | `exigirSesion(rol)` en `js/sesion.js` · menú por rol en `frontend/index.html` · barra lateral del productor |

## Características adicionales

Se agregaron después de cubrir las mínimas, sin eliminar las características mínimas.

### Conjunto B (continuación): acceso y perfil

| ID | Característica | Conjunto | Estado | Dónde está en el código |
|---|---|---|---|---|
| B5 | Modificar los datos del perfil del usuario autenticado | B | Implementada | `PUT /api/usuarios/perfil` · `frontend/perfil-productor.html` |
| B6 | Iniciar la sesión de un usuario con Google (opcional) | B | Implementada | `GET /api/usuarios/google` y `/google/callback` · `backend/config/passport.js` · `frontend/login-exitoso.html` |

### Conjunto D: Carrito de compras

| ID | Característica | Conjunto | Estado | Dónde está en el código |
|---|---|---|---|---|
| D1 | Agregar un producto al carrito | D | Implementada | `POST /api/carrito/:comprador/productos` · botón «Agregar al carrito» en `index.html` |
| D2 | Consultar el carrito de un consumidor | D | Implementada | `GET /api/carrito/:comprador` · `frontend/carrito.html` |
| D3 | Modificar la cantidad de un producto del carrito | D | Implementada | `PATCH /api/carrito/:comprador/productos/:productoId` · botones «+» y «−» |
| D4 | Quitar un producto del carrito | D | Implementada | `DELETE /api/carrito/:comprador/productos/:productoId` · botón «Eliminar» |
| D5 | Simular el pedido de los productos del carrito | D | Implementada | `POST /api/pedidos` · botón «Realizar compra» en `frontend/carrito.html` |
| D6 | Calcular y mostrar la comisión solidaria en el carrito | D | Implementada | `backend/config/comision.js` · `GET /api/comision` · resumen en `frontend/carrito.html` |
| D7 | Consultar el historial de pedidos | D | Implementada | `GET /api/pedidos` y `GET /api/pedidos/:id` · `frontend/pedidos.html` |

### Conjunto E: Catálogo

| ID | Característica | Conjunto | Estado | Dónde está en el código |
|---|---|---|---|---|
| E1 | Buscar productos por texto | E | Implementada (en el cliente) | Buscador de `frontend/index.html` |
| E2 | Filtrar los productos por categoría | E | Implementada (en el cliente) | Botones de categoría de `frontend/index.html` · `frontend/js/productos.js` |
| E3 | Clasificar un producto en una categoría | E | Implementada | Campo `categoria` en `models/Producto.js` y en los formularios de producto |
| E4 | Adjuntar una foto a un producto | E | Implementada | Campo `imagen` (base64) · validación en `productoRoutes.js` · reducción de la foto en `frontend/js/productos.js` |
| E5 | Filtrar los productos por ubicación | E | Implementada | `GET /api/productos?ciudad=` · filtro en `frontend/index.html` |

### Conjunto F: Panel del productor

| ID | Característica | Conjunto | Estado | Dónde está en el código |
|---|---|---|---|---|
| F1 | Consultar el inventario de productos del productor | F | Implementada | `GET /api/productos/mis-productos` · `frontend/inventario-productor.html` |
| F2 | Consultar las estadísticas del mes del productor | F | Implementada | `GET /api/pedidos/ventas-mes` · `frontend/inventario-productor.html` |

## Correspondencia con el MVP de la propuesta

La propuesta del primer corte definió siete funcionalidades. La correspondencia con las características implementadas queda así:

| Funcionalidad del MVP | Características | Estado |
|---|---|---|
| Registro de productores y consumidores | B1, B6 | Cubierta |
| Creación de perfil del productor | B3, B5 | Cubierta (perfil con ciudad y teléfono, editable) |
| Publicación y edición de productos (precio, descripción, imagen) | A3, A4, E4 | Cubierta |
| Carrito de compras básico: simulación de pedido | D1 a D5 | Cubierta |
| Filtro por ubicación o categoría | E2, E3, E5 | Cubierta |
| Panel de gestión de inventario básico | F1, F2 | Cubierta |
| Comisión solidaria transparente (porcentaje mínimo y visible) | D6 | Cubierta |

## Cómo se aplicaron los cinco procesos de FDD

| Proceso FDD | Evidencia o actividad en el proyecto |
|---|---|
| 1. Desarrollar un modelo general | `modelo-general.md` documenta la arquitectura y el modelo entidad-relación. |
| 2. Construir la lista de características | Este documento reúne las características, organizadas por conjuntos y con sus estados. |
| 3. Planificar por característica | La lista de características se organizó por conjuntos y prioridades: A, B y C como base, seguidos por las características adicionales de D, E y F. |
| 4. Diseñar por característica | Los contratos de los endpoints están documentados en `api.md` y las reglas de acceso en `roles-y-permisos.md`. |
| 5. Construir por característica | Las características se implementaron en el backend y el frontend, y el trabajo se gestionó mediante ramas y pull requests en Git. |

## Cómo se priorizó y qué quedó fuera

- **Priorización:** primero se desarrollaron las características mínimas de gestión de productos (A), autenticación (B) y autorización (C), que constituyen la base del sistema. Después se abordaron las características adicionales de carrito (D), catálogo (E) y panel del productor (F).
- **Quedaron fuera:** recuperación de contraseña, paginación del catálogo, revocación de tokens y almacenamiento externo de imágenes.

## Cómo se verificó que una característica estaba terminada

Las características se verificaron mediante pruebas de los flujos de la aplicación y solicitudes directas a la API, según el alcance de cada una. Los ejemplos de `curl` documentados en `api.md` permiten repetir las pruebas de los endpoints. La sección «Qué probar en la demostración» del `README.md` resume los flujos de autenticación, las operaciones CRUD según el rol y las respuestas de acceso denegado (401 y 403).