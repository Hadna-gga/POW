<<<<<<< HEAD
# Del Campo a Tu Mesa

Sitio web que conecta a productores del campo con consumidores: los productores publican sus productos (con foto, categoría, precio y cantidad disponible) y los consumidores los buscan, los filtran por categoría y los agregan a su carrito.

Proyecto final del curso Programación Web (Grupo POW03): sitio web con API REST, autenticación y autorización por roles, construido con un proceso basado en Feature-Driven Development (FDD).

## Tecnologías

| Capa | Tecnología |
|---|---|
| Servidor | Node.js + Express 5 (API REST, respuestas en JSON) |
| Base de datos | MongoDB (con Mongoose) |
| Autenticación | JWT (jsonwebtoken) con contraseñas con hash (bcrypt). Opcional: Google OAuth 2.0 (passport-google-oauth20) |
| Cliente web | HTML5, CSS y JavaScript (fetch asíncrono), sin frameworks |
| Configuración | Variables de entorno (dotenv) |

## Requisitos

- Node.js 20 o superior (incluye npm). Comprueba con `node -v`.
- Git.
- Una base de datos MongoDB: una cuenta gratuita de MongoDB Atlas o MongoDB instalado en tu equipo.

## Estructura del repositorio

```text
/
├── README.md
├── .gitignore
├── backend/                 API REST (Node.js + Express)
│   ├── server.js            punto de entrada
│   ├── config/              conexión a MongoDB, estrategia de Google, comision.js y migraciones.js
│   ├── middleware/          auth.js (JWT y roles) y validar.js (ids)
│   ├── models/              Usuario, Producto, Carrito, Pedido
│   ├── routes/              usuarioRoutes, productoRoutes, carritoRoutes, pedidoRoutes
│   ├── scripts/             seed.js (datos de prueba)
│   ├── package.json
│   └── .env.example         plantilla de variables de entorno
├── frontend/                cliente web (HTML, CSS, JS)
│   ├── index.html           tienda (catálogo, búsqueda y filtro por categoría)
│   ├── login.html, registro*.html, carrito.html, ...
│   ├── style.css
│   └── js/                  sesion.js, mensajes.js, productos.js
└── docs/
    ├── lista-de-caracteristicas.md
    ├── modelo-general.md
    ├── roles-y-permisos.md
    └── api.md
```

## Instalación y ejecución

El servidor Express también entrega el front-end: solo hay que arrancar el backend. No usar Live Server ni abrir los `.html` con doble clic, porque las llamadas a `/api/...` solo funcionan si la página sale del propio servidor.

1. Clonar el repositorio (y, si se evalúa una versión concreta, ubicarse en su etiqueta):

   ```bash
   git clone https://github.com/Hadna-gga/POW.git
   cd POW
   git checkout v1.0
   ```

2. Instalar las dependencias del backend:

   ```bash
   cd backend
   npm install
   ```

3. Crear el archivo `.env` a partir de la plantilla:

   ```bash
   # Linux / macOS / Git Bash
   cp .env.example .env
   # Windows (PowerShell o CMD)
   copy .env.example .env
   ```

   Abre `backend/.env` y completa, como mínimo, `MONGO_URI` y `JWT_SECRET` (ver la sección siguiente).
4. Arrancar el servidor:

   ```bash
   npm start
   ```

   (Para desarrollo con reinicio automático: `npm run dev`.) Debes ver en la terminal:

   ```text
   Servidor funcionando en el puerto 3000
   MongoDB conectado correctamente
   ```

5. Abrir el sitio: http://localhost:3000

### Variables de entorno

Se definen en `backend/.env` (este archivo no se sube al repositorio; la plantilla es `backend/.env.example`).

| Variable | Obligatoria | Descripción |
|---|---|---|
| `PORT` | No (por defecto 3000) | Puerto del servidor. |
| `MONGO_URI` | Sí | Cadena de conexión de MongoDB. Si falta o es inválida, el servidor se detiene al arrancar. |
| `JWT_SECRET` | Sí | Secreto para firmar los tokens. Genera uno con `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. |
| `GOOGLE_CLIENT_ID` | No | Solo para el inicio de sesión con Google. |
| `GOOGLE_CLIENT_SECRET` | No | Solo para el inicio de sesión con Google. |
| `GOOGLE_CALLBACK_URL` | No | Debe ser `http://localhost:3000/api/usuarios/google/callback` y estar registrada como URI de redirección en Google Cloud. |

### Base de datos

- **MongoDB Atlas (recomendado):** crea un cluster gratuito (M0), un usuario de base de datos (contraseña solo con letras y números), permite tu IP en Network Access (por ejemplo `0.0.0.0/0` para pruebas) y copia la cadena de Connect → Drivers. Reemplaza `<password>` por tu contraseña y agrega el nombre de la base antes del `?`:

  ```text
  mongodb+srv://USUARIO:CLAVE@cluster0.xxxxx.mongodb.net/delcampo?retryWrites=true&w=majority
  ```

- **MongoDB local:** `MONGO_URI=mongodb://127.0.0.1:27017/delcampo`

Las colecciones se crean solas la primera vez que se usan. La base empieza vacía; `npm run seed` carga los datos de prueba.

### Inicio de sesión con Google (opcional)

Está desactivado hasta que se completen las tres variables `GOOGLE_*`. Sin ellas, el servidor muestra una advertencia al arrancar, el registro y el inicio de sesión con correo y contraseña funcionan con normalidad y los botones de Google responden "no está configurado". Para activarlo: en Google Cloud Console crea un ID de cliente OAuth de tipo "Aplicación web", agrega como URI de redirección autorizada `http://localhost:3000/api/usuarios/google/callback` y copia el ID y el secreto al `.env`.

## Usuarios de prueba por rol

Con el `.env` configurado, ejecuta desde la carpeta backend:

```bash
npm run seed
```

Crea un usuario por rol y tres productos de ejemplo (es seguro repetirlo: no duplica nada).

| Rol | Correo | Contraseña |
|---|---|---|
| Productor | productor@demo.com | Demo12345 |
| Consumidor | consumidor@demo.com | Demo12345 |

Sobre el administrador: este sistema tiene dos roles (productor y consumidor) y ninguno es administrador. El rol se elige al registrarse (formulario o botón de Google) y el servidor solo acepta esos dos valores. Ningún rol puede ver ni modificar lo que pertenece a otro usuario (ver [roles-y-permisos.md](docs/roles-y-permisos.md)).

## Qué probar en la demostración

1. Entrar como productor: publicar un producto con foto y categoría, editarlo y eliminarlo.
2. Entrar como consumidor: filtrar por categoría, agregar al carrito y cambiar cantidades.
3. Entrar como consumidor: realizar una compra y consultar sus pedidos.
4. Entrar como productor: consultar las estadísticas del mes.
5. Acción denegada: con el token del consumidor, intentar `POST /api/productos` → responde 403. Sin token → 401.

## Autenticación y autorización (resumen)

- **Autenticación:** el login devuelve un JWT firmado con `JWT_SECRET` (vigencia de 2 horas). El cliente lo guarda en `sessionStorage` y lo envía en `Authorization: Bearer <token>`. Las contraseñas se guardan con bcrypt. El mensaje de login fallido es el mismo si el correo no existe o la contraseña es incorrecta.
- **Autorización:** el middleware `verificarToken` valida el token y lee el rol desde la base de datos (no del token); `soloProductor` y `verificarComprador` restringen cada operación. Un token ausente o inválido responde 401; un rol o un recurso ajeno responde 403.
- **Cerrar sesión (B4):** con JWT el servidor no guarda sesión, así que el cliente descarta el token.

Detalle completo en [roles-y-permisos.md](docs/roles-y-permisos.md) y [api.md](docs/api.md).

## Seguridad aplicada

- Secretos solo en variables de entorno; `.env` y `node_modules` excluidos con `.gitignore`.
- Contraseñas con hash (bcrypt) y nunca devueltas por la API.
- Validación en el servidor (tipos, formatos, rangos, ids) además de la del cliente.
- Los errores internos no se envían al cliente: se registran en el servidor y se responde con mensajes genéricos.
- El front pinta los datos con `textContent` (no inserta HTML con datos de la API), lo que evita XSS.
- Las imágenes se validan (formato y tamaño máximo) antes de guardarse.

## Documentación

| Documento | Contenido |
|---|---|
| [lista-de-caracteristicas.md](docs/lista-de-caracteristicas.md) | Lista FDD: identificador, nombre, conjunto, responsable y estado. |
| [modelo-general.md](docs/modelo-general.md) | Arquitectura y modelo entidad-relación. |
| [roles-y-permisos.md](docs/roles-y-permisos.md) | Matriz de roles por operación y dónde se aplica en el código. |
| [api.md](docs/api.md) | Endpoints con método, ruta, autenticación, roles y ejemplos. |


## Limitaciones conocidas

- El token se guarda en `sessionStorage`: es accesible desde JavaScript, por lo que una vulnerabilidad XSS lo expondría. La alternativa sería una cookie `HttpOnly`.
- No hay revocación de tokens: un JWT sigue siendo válido hasta que vence (2 horas), aunque se cierre la sesión en el cliente. Como el rol se consulta en la base de datos, borrar a un usuario sí invalida su token de inmediato.
- Las fotos se guardan en MongoDB como texto (base64); para mucho volumen convendría un almacenamiento de archivos externo.
- El filtro por categoría y el buscador se aplican en el cliente sobre la lista completa de productos (sin paginación).
=======
"mongodb+srv://cluster0.9mpvucu.mongodb.net/" --username user_db_comics
"mongodb+srv://cluster0.9mpvucu.mongodb.net/" --username usr_db_comics
//123

git add .
git commit -m
git push
>>>>>>> 19e570aa33582afee77a74e9b498f591b7f0fc40
