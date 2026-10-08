# Bien Amargos + Bien Yerbados — V8.5

V8.5 mantiene el stack existente (React + TypeScript + Vite, Fastify, Node 22 y MySQL/MariaDB) y se concentra en estabilidad de imágenes, ficha de producto, descuentos visibles, controles y precios mayoristas.

## Cambios V8.5

- **Uploads persistentes:** en producción, si `UPLOAD_DIR` no está definido, las nuevas imágenes se guardan en `$HOME/.bienamargos/uploads`, fuera del release de Hostinger. Al iniciar, la API intenta recuperar archivos existentes desde el release actual y desde `~/hbuilds/versions/*/uploads` sin sobreescribir archivos ya recuperados.
- **Galerías seguras:** guardar un producto conserva por URL/ID las imágenes existentes y sincroniza sólo altas, bajas y orden. La carga múltiple conserva las fotos que sí subieron aunque otra del mismo lote falle.
- **Galería de producto:** viewport Embla al 100%, slides al 100%, sin sombra y con fotografía completa (`object-fit: contain`), swipe mobile, flechas desktop y miniaturas.
- **Ficha de producto V8.5:** mayor superficie para la imagen, bloque de información más compacto, precio/descuento con mejor jerarquía y CTA mobile redistribuido.
- **Descuentos:** las cards usadas en catálogo y destacados muestran porcentaje OFF, precio anterior tachado y precio vigente.
- **Botones:** mejor contraste, estados hover/focus y menos sombras.
- **Mayoristas:** nueva sección `/admin/mayoristas`, precio base, cantidad mínima y precio opcional por variante. No altera el precio minorista ni el carrito público.
- **Build seguro:** `npm run build` no ejecuta seed ni modifica datos.

## Actualización desde V8.4

V8.5 aplica al arrancar **solamente** las cuatro columnas mayoristas que necesita, comprobando primero `information_schema` y agregando únicamente las columnas ausentes. Es una migración idempotente y no destructiva: no ejecuta seed, `DROP` ni `TRUNCATE`.

`npm run setup` sigue disponible para inicialización manual del esquema, pero **no es necesario para un deploy normal de V8.5** y tampoco ejecuta `db:seed`.

Para controlar explícitamente dónde viven las imágenes en Hostinger, se recomienda definir `UPLOAD_DIR` apuntando a una carpeta persistente de la cuenta. Si se deja vacío en producción, V8.5 usa `$HOME/.bienamargos/uploads`.

---

# Bien Amargos + Bien Yerbados — Ronda Admin Pro V8.2

Esta versión evoluciona **sobre V8.1**. No reemplaza el ecommerce ni el stack: mantiene React + TypeScript + Vite, Fastify + Node 22 y MySQL/MariaDB, con `server.js` como entrypoint para Hostinger.

## V8.2 — Ronda Admin Pro

### Seguridad y operación
- RBAC server-side para `superadmin`, `manager` y `operator` mediante permisos centralizados.
- `brand_scope` aplicado en endpoints sensibles de productos, pedidos, inventario, clientes y métricas.
- Máquina de estados de pedidos: `pending → confirmed → preparing → ready → completed`, con cancelación validada y permiso independiente.
- Cancelación transaccional con restitución de stock y auditoría.
- Dashboard por marca calculado desde `order_items.line_total`, evitando duplicar el total de pedidos mixtos.
- Métricas de clientes excluyen pedidos cancelados/expirados.

### Nueva experiencia Ronda Admin
- Sidebar agrupado por Operación, Catálogo, Contenido, Comunidad y Sistema.
- Selector global de marca en la topbar.
- Centro de notificaciones real con stock bajo, pedidos pendientes/listos y productos sin imagen.
- Command Palette con navegación y búsqueda de productos, pedidos y clientes.
- Dashboard operativo con métricas, pipeline, alertas y productos destacados.

### Pedidos
- Vista Lista / Kanban.
- Drawer de detalle con cliente, productos, entrega, timeline, notas internas y acciones válidas.
- Transiciones inválidas rechazadas en backend.

### Productos
- Editor de producto de página completa: `/admin/productos/nuevo` y `/admin/productos/:id`.
- Secciones General, Multimedia, Variantes, Stock, SEO y Visibilidad.
- Preview real del storefront, estado de cambios sin guardar y `Ctrl/Cmd + S`.
- Conversión de producto con variantes a simple exige confirmación explícita.
- Variantes compactas con edición lateral, duplicado, archivado y reordenamiento táctil.

### Inventario
- Ajuste seguro de stock por Ingreso / Salida / Corrección.
- Vista de Actual / Reservado / Disponible / Mínimo.
- Historial con admin, antes, cambio, después y nota.

### Multimedia
- Biblioteca con búsqueda, dimensiones, MIME, peso y detalle de usos.
- Media Picker reutilizable en productos, categorías, carrusel y Materos por el Mundo.
- Bloqueo de borrado cuando una imagen está referenciada.
- Borrado de archivo físico para media sin uso.

### Clientes
- Mini CRM con historial, total válido, ticket promedio, última compra y productos frecuentes.
- Cancelados/expirados no inflan métricas.

### Cana y Materos
- **Cana Lab** para probar preguntas y ver qué FAQ coincide antes de publicar cambios.
- Materos por el Mundo mantiene CRUD, mapa, importador y ahora usa Media Picker y confirmación al eliminar.

### Auditoría y administración
- Feed legible de actividad, dejando el JSON técnico bajo “Ver detalles”.
- Gestión básica de usuarios admin con rol, alcance de marca y estado activo.
- Nunca se exponen hashes de contraseña.

## Migraciones V8.2
La migración es idempotente y no ejecuta `DROP`, `TRUNCATE` ni reseteos.

- `orders.internal_note`
- `order_events`

## Hostinger
Configuración esperada:

- Framework: Fastify
- Node: 22.x
- Root: `./`
- Package manager: npm
- Build: `npm run build`
- Entry: `server.js`

Después del deploy, `/api/health` debe devolver `version: 8.4.0`.

## QA recomendado tras deploy
1. Verificar dashboard con un pedido solo Amargos, uno solo Yerbados y uno mixto.
2. Probar `superadmin`, `manager` y `operator`.
3. Intentar acceder por API a una marca fuera del `brand_scope` y confirmar `403`.
4. Probar el flujo completo de pedido y una transición inválida.
5. Cancelar un pedido y confirmar que el stock se repone una sola vez.
6. Crear/editar producto simple y producto con variantes.
7. Probar cambios sin guardar y Media Picker.
8. Ajustar stock desde Inventario.
9. Probar Cana Lab y Materos por el Mundo.
10. Revisar consola, red y responsive mobile.


## V8.2.2 — Subida directa de imágenes

- Productos: imagen principal desde dispositivo, drag & drop o Biblioteca.
- Galería de producto: permite subir varias fotos de una vez; se agregan automáticamente a Multimedia y quedan vinculadas al producto al guardar.
- Variantes: imagen principal y galería directamente desde el dispositivo o Biblioteca.
- Categorías, carrusel y Materos por el mundo también pueden subir imágenes sin salir del editor.
- El Media Picker permite subir y seleccionar en el mismo diálogo.
- Los archivos se validan como JPG, PNG, WEBP o AVIF, máximo 8 MB.
- Para fotos de producto se advierte cuando la resolución es menor a 1200×1200.
- El endpoint de upload limpia el archivo físico si falla el registro en la base para evitar huérfanos.

Flujo esperado en Productos: Subir desde mi dispositivo → upload → registro automático en Multimedia → asignación inmediata → preview → Guardar producto.

## V8.3 — Storefront Flow + Variant Fix + SEO

- Colecciones se conserva en base para compatibilidad futura, pero se retiró de navegación y experiencia pública. URLs antiguas redirigen a `/catalogo`.
- Home: Favoritos aparece antes que "Todo para tu ronda".
- Categorías: carrusel horizontal táctil con Embla en mobile; grid en desktop.
- Variantes: IDs de cliente estables, persistencia de IDs reales después de guardar, validación server-side de pertenencia al producto y guardado transaccional más seguro.
- SEO de producción:
  - HTML inicial con `title`, description, canonical, robots, Open Graph y Twitter Cards por ruta.
  - páginas de producto con JSON-LD `Product` / `ProductGroup`, ofertas, stock, SKU, marca e imágenes.
  - Breadcrumb JSON-LD en productos.
  - `/sitemap.xml` dinámico con productos y categorías activas.
  - `robots.txt` con sitemap y bloqueo de `/admin`, `/checkout` y `/api/`.
  - búsquedas internas (`?q=`), checkout y admin usan `noindex`.
  - redirecciones SEO 301 para `/tienda`, `/enyerbados`, `/colecciones` y URLs antiguas `collection=1`.
  - `PUBLIC_URL` permite definir el dominio canónico; por defecto `https://bienamargos.com.ar`.
  - `GOOGLE_SITE_VERIFICATION` permite agregar el token de Google Search Console sin modificar código.

### Activar indexación en Google

1. Publicar la aplicación en `https://bienamargos.com.ar`.
2. Confirmar que `https://bienamargos.com.ar/sitemap.xml` responde correctamente.
3. Crear/verificar la propiedad en Google Search Console.
4. Si Google solicita meta verification, copiar el valor en `GOOGLE_SITE_VERIFICATION` dentro de las variables de entorno de Hostinger y redeployar/reiniciar.
5. En Search Console enviar `https://bienamargos.com.ar/sitemap.xml`.
6. Usar Inspección de URL para solicitar indexación de Home y productos prioritarios.

La indexación no es instantánea ni garantizada: estas mejoras hacen el sitio rastreable y proporcionan a Google señales técnicas correctas.


## V8.4 — Galerías estables + deploy seguro + UI refinada

- `npm run build` ya **no ejecuta** `db:init` ni `db:seed`. Un deploy normal en Hostinger compila frontend/backend sin tocar productos, stock, pedidos, clientes ni imágenes existentes.
- `npm run setup` queda reservado a migraciones idempotentes (`db:init`).
- `npm run setup:demo` es el flujo local que además carga datos demo. `db:seed` queda bloqueado en `NODE_ENV=production` salvo `ALLOW_DEMO_SEED=1`.
- Las galerías de producto y variante se sincronizan de forma diferencial dentro de la transacción: se conservan filas existentes, se insertan solo las nuevas, se actualiza el orden y se eliminan solo las que el usuario quitó.
- La carga múltiple desde el admin se aplica como lote para evitar estados parciales; las URLs duplicadas se descartan.
- El editor muestra miniaturas ordenables y permite quitar imágenes sin borrar las demás.
- El carrusel de producto ocupa más superficie, no usa sombra, mantiene `object-fit: contain`, soporta swipe/drag, miniaturas y navegación más discreta.
- Botones y hovers de storefront/admin fueron unificados con una paleta más sobria y estados `hover`, `active`, `disabled` y `focus-visible` consistentes.

### Deploy seguro en Hostinger

Configuración:

- Node: 22.x
- Build: `npm run build`
- Entry: `server.js`

En una base existente no ejecutes `npm run db:seed`. Si en el futuro hubiera una migración de esquema, ejecutar manualmente `npm run setup` una sola vez.
