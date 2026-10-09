BIEN AMARGOS / BIEN YERBADOS — V9.1 SOURCE

Esta entrega contiene el CODIGO FUENTE.
No fue compilada en esta entrega.

STACK
- Node.js 22
- React + TypeScript + Vite
- Fastify
- MySQL

DEPLOY EN HOSTINGER
1. Usar Node 22.
2. npm install
3. npm run build
4. Entry file: server.js

IMPORTANTE
- No ejecutar npm run db:seed sobre producción.
- La migración runtime V9 es incremental e idempotente.
- No contiene DROP TABLE, DROP DATABASE ni TRUNCATE.
- Conserva productos, imágenes, variantes, stock, pedidos, clientes, categorías, usuarios, auditorías y mayoristas.
- Los uploads de producción continúan usando el almacenamiento persistente definido por UPLOAD_DIR o $HOME/.bienamargos/uploads.
- Los índices V9 se crean sólo si todavía no existen.

CAMBIOS CENTRALES V9
- DTO liviano para listados y DTO completo para detalle.
- Menos requests iniciales.
- Búsqueda del header bajo demanda.
- Catálogo progresivo.
- ProductPage full-bleed.
- Galería única.
- CSS V8 versionado eliminado.
- Design system consolidado.
- Optimización WebP para nuevas cargas grandes JPG/PNG.
- Cache HTTP y cache de uploads.
- Sin Lenis / RAF global permanente.
- CanaBot y CartDrawer diferidos.
- Admin multimedia permite convertir una foto en principal.

Leer PERFORMANCE.md para el detalle técnico.

VERSION: 9.1.0


V9.1 VISUAL / UX
- Fondo atmosférico del Home reutilizado en páginas internas con overlays livianos.
- ProductPage desktop con rail integrado y galería full-bleed.
- Cart Peek no bloqueante al agregar.
- Drawer del carrito con motion más corto y touch targets mayores.
- No abre el carrito completo en cada add.
- Sin cambios destructivos de datos.

GitHub Actions genera el artefacto bienamargos-v9.1-HOSTINGER-SOURCE con package.json en la raíz para el importador de Hostinger.
