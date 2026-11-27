# Lista de características (FDD)

Cada característica se redacta con la plantilla de FDD: **\<acción\> \<resultado\> \<objeto\>**. Aquí, el **recurso** principal es el **producto**.

> ⚠️ **COMPLETAR antes de entregar:** la columna *Responsable* (quién construyó cada característica) y las ramas o commits reales de cada una. El estado y el código indicados corresponden al contenido del repositorio; confirma cada característica ejecutándola (ver "Cómo se verificó").

**Estados:** *Implementada* (existe en el código) · *No implementada* (se dejó fuera del alcance).

## Características mínimas

### Conjunto A: Gestión de productos

| ID | Característica | Conjunto | Responsable | Estado | Dónde está en el código |
|---|---|---|---|---|---|
| A1 | Listar los productos | A | (completar) | Implementada | `GET /api/productos` · `frontend/index.html` (catálogo) |
| A2 | Consultar el detalle de un producto | A | (completar) | Implementada (API) | `GET /api/productos/:id` |
| A3 | Crear un producto | A | (completar) | Implementada | `POST /api/productos` · `frontend/agregar-producto.html` |
| A4 | Modificar los datos de un producto | A | (completar) | Implementada | `PUT /api/productos/:id` · `frontend/editar-producto.html` |
| A5 | Eliminar un producto | A | (completar) | Implementada | `DELETE /api/productos/:id` · `frontend/productos-productor.html` |

### Conjunto B: Autenticación

| ID | Característica | Conjunto | Responsable | Estado | Dónde está en el código |
|---|---|---|---|---|---|
| B1 | Registrar un usuario | B | (completar) | Implementada | `POST /api/usuarios/registro` · `frontend/registro-consumidor.html`, `registro-productor.html` |
| B2 | Iniciar la sesión de un usuario (JWT) | B | (completar) | Implementada | `POST /api/usuarios/login` · `frontend/login.html` |
| B3 | Consultar el perfil del usuario autenticado | B | (completar) | Implementada | `GET /api/usuarios/perfil` · `frontend/perfil-productor.html` |
| B4 | Cerrar la sesión de un usuario | B | (completar) | Implementada (en el cliente) | `Sesion.cerrarSesion()` en `frontend/js/sesion.js` · botones "Cerrar sesión" |

### Conjunto C: Autorización

| ID | Característica | Conjunto | Responsable | Estado | Dónde está en el código |
|---|---|---|---|---|---|
| C1 | Restringir la creación, modificación y eliminación de productos a los roles autorizados | C | (completar) | Implementada | `soloProductor` en `backend/middleware/auth.js` · `backend/routes/productoRoutes.js` |
| C2 | Restringir a cada usuario el acceso a sus propios recursos | C | (completar) | Implementada | Dueño del producto en `productoRoutes.js` · `verificarComprador` en `carritoRoutes.js` · perfil por `req.usuario.id` |
| C3 | Adaptar las opciones de la interfaz según el rol del usuario | C | (completar) | Implementada | `exigirSesion(rol)` en `js/sesion.js` · menú por rol en `frontend/index.html` · barra lateral del productor |

## Características adicionales

Se agregaron **después** de cubrir las mínimas (ninguna mínima se eliminó).

### Conjunto B (continuación): acceso y perfil

| ID | Característica | Conjunto | Responsable | Estado | Dónde está en el código |
|---|---|---|---|---|---|
| B5 | Modificar los datos del perfil del usuario autenticado | B | (completar) | Implementada | `PUT /api/usuarios/perfil` · `frontend/perfil-productor.html` |
| B6 | Iniciar la sesión de un usuario con Google (opcional) | B | (completar) | Implementada | `GET /api/usuarios/google` y `/google/callback` · `backend/config/passport.js` · `frontend/login-exitoso.html` |

### Conjunto D: Carrito de compras

| ID | Característica | Conjunto | Responsable | Estado | Dónde está en el código |
|---|---|---|---|---|---|
| D1 | Agregar un producto al carrito | D | (completar) | Implementada | `POST /api/carrito/:comprador/productos` · botón "Agregar al carrito" en `index.html` |
| D2 | Consultar el carrito de un consumidor | D | (completar) | Implementada | `GET /api/carrito/:comprador` · `frontend/carrito.html` |
| D3 | Modificar la cantidad de un producto del carrito | D | (completar) | Implementada | `PATCH /api/carrito/:comprador/productos/:productoId` · botones "+" y "−" |
| D4 | Quitar un producto del carrito | D | (completar) | Implementada | `DELETE /api/carrito/:comprador/productos/:productoId` · botón "Eliminar" |
| D5 | Simular el pedido de los productos del carrito | D | (completar) | **No implementada** | El botón "Realizar compra" existe en `carrito.html`, pero no ejecuta ninguna acción (es parte del MVP: "simulación de pedido") |
| D6 | Calcular y mostrar la comisión solidaria en el carrito | D | (completar) | **No implementada** | La comisión (5 %) se menciona en el registro y en el pie de página, pero el resumen del carrito solo muestra subtotal, envío y total |

### Conjunto E: Catálogo

| ID | Característica | Conjunto | Responsable | Estado | Dónde está en el código |
|---|---|---|---|---|---|
| E1 | Buscar productos por texto | E | (completar) | Implementada (en el cliente) | Buscador de `frontend/index.html` |
| E2 | Filtrar los productos por categoría | E | (completar) | Implementada (en el cliente) | Botones de categoría de `frontend/index.html` · `frontend/js/productos.js` |
| E3 | Clasificar un producto en una categoría | E | (completar) | Implementada | Campo `categoria` en `models/Producto.js` y en los formularios de producto |
| E4 | Adjuntar una foto a un producto | E | (completar) | Implementada | Campo `imagen` (base64) · validación en `productoRoutes.js` · reducción de la foto en `frontend/js/productos.js` |

### Conjunto F: Panel del productor

| ID | Característica | Conjunto | Responsable | Estado | Dónde está en el código |
|---|---|---|---|---|---|
| F1 | Consultar el inventario de productos del productor | F | (completar) | Implementada | `GET /api/productos/mis-productos` · `frontend/inventario-productor.html` |
| F2 | Consultar las estadísticas del mes del productor | F | (completar) | **No implementada** | Recuadro "Estadísticas del mes" en `inventario-productor.html`, sin datos |

## Correspondencia con el MVP de la propuesta

La propuesta del primer corte definió siete funcionalidades. Así quedó cada una:

| Funcionalidad del MVP | Características | Estado |
|---|---|---|
| Registro de productores y consumidores | B1, B6 | Cubierta |
| Creación de perfil del productor | B3, B5 | Cubierta (perfil con ciudad y teléfono, editable) |
| Publicación y edición de productos (precio, descripción, imagen) | A3, A4, E4 | Cubierta |
| Carrito de compras básico: simulación de pedido | D1 a D4 (carrito) · D5 (pedido) | **Parcial:** el carrito funciona; la simulación de pedido no |
| Filtro por ubicación o categoría | E2, E3 | Cubierta por **categoría**; el filtro por ubicación no se implementó |
| Panel de gestión de inventario básico | F1, F2 | **Parcial:** el inventario funciona; las estadísticas no |
| Comisión solidaria transparente (porcentaje mínimo y visible) | D6 | **Parcial:** se anuncia y se acepta al registrarse, pero no se calcula en el carrito |

## Cómo se aplicaron los cinco procesos de FDD

| Proceso FDD | Dónde queda evidencia en el repositorio |
|---|---|
| 1. Desarrollar un modelo general | [`modelo-general.md`](modelo-general.md): arquitectura y modelo entidad-relación. |
| 2. Construir la lista de características | Este documento. |
| 3. Planificar por característica | Columnas *Responsable* y *Estado* de este documento. ⚠️ Completar con el orden y las fechas acordadas. |
| 4. Diseñar por característica | Contratos de cada endpoint en [`api.md`](api.md) y reglas de acceso en [`roles-y-permisos.md`](roles-y-permisos.md). |
| 5. Construir por característica | Código del backend y del front indicado en la última columna. ⚠️ Completar con las ramas y commits reales (por ejemplo `feature/A3-crear-producto`). |

## Cómo se priorizó y qué quedó fuera

- **Criterio:** primero las **características mínimas** (conjuntos A, B y C), porque condicionan todo lo demás (la autenticación y los roles afectan a todas las rutas); después las adicionales. ⚠️ Ajustar si el equipo siguió otro criterio.
- **Quedaron fuera:** la simulación de pedido (D5), la comisión visible en el carrito (D6), las estadísticas del productor (F2), el filtro por ubicación, pedidos e historial, recuperación de contraseña, paginación del catálogo, revocación de tokens y almacenamiento externo de imágenes.

## Cómo se verificó que una característica estaba terminada

Cada característica se comprobó de extremo a extremo (base de datos, API e interfaz) y con peticiones directas a la API. Los ejemplos de `curl` de [`api.md`](api.md) permiten repetir las pruebas, y la sección *Qué probar en la demostración* del [`README`](../README.md) resume el flujo completo: autenticación, operaciones del CRUD según el rol y una acción denegada (401 y 403). ⚠️ Si el equipo hizo otras pruebas, anotarlas aquí.