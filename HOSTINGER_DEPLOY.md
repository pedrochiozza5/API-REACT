# Hostinger — despliegue de V10.0 SOURCE

## Preparación
1. Crear un backup exportado de MySQL y conservar los uploads persistentes antes de intervenir producción.
2. Descargar el artefacto `bienamargos-v10-HOSTINGER-SOURCE` desde GitHub Actions de la rama `v10-source`; **NO** usar el ZIP de `Code → Download ZIP` porque agrega una carpeta contenedora.
3. Comprobar que el ZIP contiene directamente `package.json`, `server.js`, `src/`, `server/` y `public/`.
4. Subirlo a una aplicación **staging** o preview primero.
5. Configurar Node.js 22, `npm install`, `npm run build` y entrada `server.js`.
6. Configurar las variables de entorno y credenciales en Hostinger, NO dentro del ZIP.
7. Confirmar persistencia de `UPLOAD_DIR` / almacenamiento `$HOME/.bienamargos/uploads` antes de publicar.
8. Verificar /api/health (si está disponible en esta instalación), Home de ambas marcas, imágenes antiguas, editor, carrito, stock y pedido a WhatsApp con datos de prueba.
9. Desplegar en producción solo tras comprobar la base y el flujo completo.

## Seguridad
- No ejecutar `npm run db:seed`, `setup:demo`, DROP, TRUNCATE ni reset sobre la DB real.
- No agregar archivos .env con contraseñas al repo o al artifact.
- El pipeline corre unit tests, Playwright en Chromium, typecheck y build para validar, pero el artifact entregado **no contiene dist ni dist-server**; Hostinger los crea en su propio entorno.
- Mantener una copia de la versión anterior para rollback.
- Aislar staging de WhatsApp real y del stock real si se hacen compras simuladas.

## Seguimiento
GitHub → Actions → “Validate and package V10 source” → último run verde → Artifacts → `bienamargos-v10-HOSTINGER-SOURCE`. Si CI falla, leer los logs y no desplegar una rama sin validar.
