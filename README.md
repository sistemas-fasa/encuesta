# Encuestas FASA

Aplicación React/Vite servida junto con la API PHP y MySQL. La imagen `Dockerfile` compila el frontend y ejecuta Apache/PHP; la API PHP conserva las rutas que usa la versión actual de producción.

## Producción en Coolify

- Proyecto y entorno: `Encuestas FASA` / `production`.
- Repositorio: `sistemas-fasa/encuesta`, rama `main`.
- Build: Dockerfile del repositorio; puerto interno `80`.
- Dominio: `https://encuestas.fasa.ar` en la raíz.
- Variables de runtime requeridas: `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`.
- Volúmenes persistentes: `/var/www/html/public/uploads` y `/var/lib/php/sessions`.
- Health check: `/health.php`; verifica la conexión MySQL con `SELECT 1` y no muestra detalles de conexión.

No importes `db_production.sql` al iniciar la app. La API PHP ejecuta migraciones automáticas al atender solicitudes; respalda y revisa la base existente antes de conectarla.

## Desarrollo local

- Frontend: `npm ci` y `npm run dev`.
- API Node local: copiá `backend/.env.example` a `backend/.env`, completá las variables desde un gestor seguro y ejecutá `node server.js` desde `backend/`.
- No guardes `.env` en Git. Los archivos `.env` que estuvieron en el historial público deben revocarse; quitarlos del checkout no invalida credenciales anteriores.

La API Node local y la API PHP usada por producción no tienen el mismo contrato completo. La imagen de Coolify empaqueta la API PHP.
