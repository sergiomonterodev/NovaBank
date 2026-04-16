# Documentacion de la App NovaBank

## 1. Resumen

NovaBank es una aplicacion web de simulacion bancaria con:

- Frontend: Lit + Vite
- Backend: Node.js + Express
- Base de datos: MySQL
- Testing: Vitest (cliente) y Jest + Supertest (servidor)

Permite registro/login, consulta de movimientos, transferencias entre cuentas, resumen grafico y gestion de roles para administradores.

## 2. Estructura del Proyecto

- `novabank/client`: aplicacion frontend
- `novabank/server`: API REST y logica de negocio
- `package.json` (raiz): scripts unificados para ejecutar tests en cliente y servidor

## 3. Arquitectura

### Frontend

El estado global vive en `BankStore` en `novabank/client/src/store.js`.

Responsabilidades principales del store:

- Gestionar sesion de usuario (login, logout, persistencia en localStorage)
- Cargar movimientos y datos de usuario (balance y numero de cuenta)
- Crear, editar y borrar movimientos mediante la API
- Gestionar usuarios y roles cuando el rol autenticado es admin
- Exponer sistema de notificaciones global
- Ejecutar refresco automatico de datos cada 10 segundos

Componentes clave:

- `app-main.js`: shell principal y navegacion por tabs
- `movimientos-table.js`: tabla de movimientos y acciones
- `transferir-form.js`: formulario de transferencias
- `resumen-grafico.js`: grafica de resumen
- `admin-panel.js`: gestion de roles y revision de movimientos por usuario
- `login-view.js` y `register-view.js`: autenticacion
- `notification-system.js`: toasts/notificaciones globales

### Backend

API en `novabank/server/index.js` con Express.

Responsabilidades principales:

- Registro y login
- CRUD parcial de movimientos
- Reglas de permisos por rol
- Gestion de usuarios para panel admin
- Generacion automatica de movimientos (cron simulado)

La conexion a MySQL se hace mediante pool (`mysql2/promise`) para optimizar concurrencia.

## 4. Roles y Permisos

Roles soportados:

- `admin`
- `user`
- `reader`

Permisos funcionales:

- Admin:
  - Gestion de roles de usuarios
  - Puede editar/borrar movimientos con reglas de backend
  - Accede a panel de gestion
- User:
  - Opera sobre su informacion y sus movimientos
  - Puede transferir
- Reader:
  - Solo lectura de datos
  - No puede crear, editar ni borrar movimientos

## 5. API REST Principal

Autenticacion:

- `POST /api/register`
- `POST /api/login`

Usuario:

- `GET /api/user/:id`

Movimientos:

- `GET /api/movements?userId=...&userRole=...`
- `POST /api/movements`
- `PUT /api/movements/:id`
- `DELETE /api/movements/:id?userRole=...&userId=...`

Administracion:

- `GET /api/admin/users`
- `PUT /api/admin/users/:id/role`

## 6. Flujo Funcional

1. Registro o login desde frontend.
2. El backend devuelve `token`, `role` y `userId` en login.
3. El store persiste sesion y carga:
   - Movimientos del usuario
   - Balance y numero de cuenta
4. La UI se renderiza segun rol.
5. El store refresca datos automaticamente cada 10 segundos.
6. En transferencias, backend:
   - Valida saldo y cuenta destino
   - Crea movimiento de salida (`expense`) para origen
   - Crea movimiento de entrada (`income`) para destino
   - Actualiza balances en ambos usuarios

## 7. Configuracion de Entorno

Variables relevantes en servidor:

- `PORT` (default 3000)
- `DB_HOST` (default localhost)
- `DB_USER` (default root)
- `DB_PASSWORD` (default vacio)
- `DB_NAME` (default novabank)
- `DB_PORT` (default 3306)
- `JWT_SECRET` (default `novabank_secret_key`)

## 8. Ejecucion y Scripts

Desde raiz del repo:

- Tests completos:
  - `npm test`
- Cobertura completa:
  - `npm run test:coverage`

Frontend (`novabank/client`):

- `npm run dev`
- `npm run build`
- `npm run test`

Backend (`novabank/server`):

- `npm run dev`
- `npm start`
- `npm run test`

## 9. Comentarios en Funciones Principales

Se revisaron y dejaron comentadas las funciones principales en los puntos de mayor impacto funcional:

- Store global: `novabank/client/src/store.js`
  - Sesion, carga de datos, CRUD de movimientos, gestion de roles y notificaciones.
- Componente principal: `novabank/client/src/components/app-main.js`
  - Renderizado por tabs y rol.
- Panel de administracion: `novabank/client/src/components/admin-panel.js`
  - Cambio de rol, carga de movimientos por usuario, edicion y borrado.
- Formulario de transferencias: `novabank/client/src/components/transferir-form.js`
  - Validaciones y envio de transferencia.
- Utilidades backend: `novabank/server/index.js`
  - Seleccion de transaccion aleatoria y cron de movimientos automaticos.

## 10. Consideraciones Tecnicas

- El backend aplica validaciones de rol para proteger operaciones sensibles.
- El frontend tambien valida reglas de negocio para mejorar UX (saldo, cuenta destino, etc.).
- El token JWT se genera en login; si se quiere endurecer seguridad, se recomienda middleware de verificacion JWT en endpoints privados.
