Bien Amargos + Bien Yerbados — HOSTINGER V8.5

1) Subir el ZIP como aplicación Node.js 22.
2) Mantener las mismas variables DB/JWT/ADMIN actuales.
3) No hace falta correr seed ni resetear la base.
   - V8.5 crea automáticamente, al arrancar, sólo las columnas mayoristas faltantes.
   - la migración comprueba las columnas existentes y sólo agrega las ausentes; no borra productos, pedidos, clientes ni imágenes.
   - `npm run setup` queda disponible si necesitás aplicar todo schema.sql manualmente, pero no es obligatorio para este deploy.
4) Build de Hostinger: `npm run build`
5) Entry file: `server.js`

IMÁGENES
- Si UPLOAD_DIR está definido, se usa esa carpeta.
- Si no está definido y NODE_ENV=production, V8.5 usa:
  $HOME/.bienamargos/uploads
- Al arrancar, intenta recuperar imágenes que hayan quedado dentro de releases viejos:
  $HOME/hbuilds/versions/*/uploads
  sin reemplazar archivos ya existentes.
- Las imágenes incluidas en public/catalog siguen disponibles como fallback visual para productos legacy.

IMPORTANTE
Si un archivo físico de una imagen ya fue eliminado también de todos los releases anteriores de Hostinger, el código no puede reconstruir sus bytes originales. En ese caso la URL de la base puede conservarse, pero hay que volver a subir ese archivo. V8.5 evita que las nuevas cargas queden atadas al release actual.

MAYORISTAS
- Panel: /admin/mayoristas
- Precio mayorista base por producto
- Cantidad mínima
- Precio opcional por variante
- No modifica precios públicos ni checkout minorista

VERSIÓN: 8.5.0
