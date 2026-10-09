# PERFORMANCE — Bien Amargos / Bien Yerbados V9.0

## Objetivo

V9.0 prioriza tiempo real hasta interacción, estabilidad visual y reducción de trabajo innecesario en red, JavaScript, imágenes y MySQL.

> Esta entrega es código fuente sin compilar. No se ejecutaron Lighthouse ni benchmarks de producción en este entorno, por pedido de mantener la entrega source-only. Los objetivos LCP < 2.5 s, CLS < 0.1, INP < 200 ms y Lighthouse mobile > 90 quedan como metas a validar en el deploy real.

## ANTES

Hallazgos estructurales en V8.6.2:

- La Home pedía hasta 80 productos completos sólo para resolver imágenes alternativas de categorías.
- Abrir la búsqueda del Header disparaba una consulta de hasta 120 productos y luego filtraba en el cliente.
- `GET /api/products` enriquecía cada listado con todas las imágenes de producto, todas las variantes y las galerías de variantes, aunque una card sólo necesita información resumida.
- El catálogo solicitaba hasta 120 productos desde el primer render.
- El fondo fotográfico global cargaba la playa también en catálogo, producto y checkout.
- Lenis mantenía un `requestAnimationFrame` continuo durante toda la sesión.
- CanaBot y CartDrawer formaban parte del grafo inicial de la aplicación.
- La ProductPage V8 acumulaba varias capas CSS versionadas y una implementación de galería adicional.
- La galería de producto procesaba la misma foto como imagen principal y fondo desenfocado, aumentando trabajo de pintura/decodificación.
- React Query tenía una política global corta y no cancelaba GET obsoletos.
- Las cargas JPG/PNG grandes se almacenaban tal como llegaban al admin.
- Faltaban índices compuestos específicos para los patrones de lectura del storefront.

## DESPUÉS

### API y MySQL

- `GET /api/products` ahora funciona como DTO de listado:
  - sin descripción larga;
  - sin metadata SEO;
  - sin galerías completas de variantes;
  - sólo variantes activas necesarias para precio/stock/opciones de card;
  - como máximo las primeras imágenes adicionales necesarias para listado.
- `GET /api/products/:slug` conserva el DTO completo para ProductPage.
- Las consultas de imágenes y variantes independientes del listado se ejecutan en paralelo.
- Se agregaron índices no destructivos e idempotentes para:
  - products por active/brand/sort;
  - products destacados;
  - product_images;
  - product_variants;
  - product_variant_images;
  - categories.
- Se agregaron cabeceras de caché pública con stale-while-revalidate para contenido de tienda.
- Los uploads reciben caché larga e immutable.

### Requests iniciales

- Home dejó de descargar hasta 80 productos sólo para categorías.
- Header dejó de consultar store-settings sin usarlos.
- Header Search ya no descarga 120 productos:
  - espera al menos 2 caracteres;
  - envía la búsqueda al servidor;
  - limita la respuesta a 8.
- Catálogo comienza con 48 productos y permite expansión progresiva.
- Footer posterga su consulta de configuración hasta acercarse al viewport.

### React / JavaScript

- Se eliminó Lenis y su loop permanente de RAF.
- CartDrawer pasó a lazy chunk.
- CanaBot pasó a lazy chunk y se carga en idle.
- ProductCard dejó de crear una animación Motion por card.
- ProductCard prefetchéa el detalle sólo al hover/focus real del usuario.
- GET públicos importantes reciben AbortSignal de React Query para cancelar respuestas que dejaron de ser necesarias.
- React Query usa staleTime/gcTime más razonables y evita refetch automático por focus/reconnect.

### Imágenes

- El fondo global ya no descarga hero-beach en todas las rutas.
- Hero es el propietario de la imagen LCP y la marca como eager/high priority.
- ProductPage no duplica la imagen para generar un fondo blur.
- Primera foto del producto: eager/high priority.
- Resto del carrusel: lazy/low priority.
- Sólo se precarga/decodifica la siguiente foto.
- Nuevas cargas grandes JPG/PNG desde admin se intentan convertir a WebP en navegador:
  - borde máximo 2200 px;
  - calidad 0.86;
  - sólo se usa la optimización si reduce el peso de forma útil.
- WebP/AVIF existentes permanecen intactos.

### ProductPage

- Galería full-bleed real de ancho viewport.
- La ficha de compra en desktop flota sobre el lateral sin reducir el ancho del carrusel.
- Mobile tiene composición propia y barra de compra sticky con safe-area.
- Swipe, drag, flechas, miniaturas, contador, teclado y lightbox.
- Soporta una o múltiples imágenes sin duplicar principal/galería.
- Se eliminó ProductGalleryV86 y queda una sola implementación activa.

### CSS / UI

- Se eliminaron los archivos CSS V8.6 fragmentados.
- Se quitaron los bloques añadidos V8.4/V8.5 del final de styles.css.
- Se consolidaron tokens de color, surface, border, radius, shadow y motion.
- Button tiene variantes primary, secondary, outline, ghost, danger, success e icon.
- Touch targets principales parten de aproximadamente 44 px.
- Se eliminó el override de Bien Yerbados que podía degradar el contraste del CTA.
- Acciones de tienda/admin tienen una jerarquía de color más coherente.

### Admin multimedia

- Principal y galería siguen siendo conceptos separados.
- No se guarda la principal duplicada como secundaria.
- Una foto de galería puede convertirse en principal sin volver a subirla.
- Las cargas múltiples conservan el comportamiento por lote.

## DECISIONES

- No se agregó Redux, Redis, GraphQL ni microservicios.
- No se agregó Sharp al servidor para evitar una dependencia nativa adicional en Hostinger.
- La optimización inicial de imágenes se hace en el navegador al subir; es segura y tiene fallback.
- No se implementó paginación de cursor porque el catálogo actual sigue siendo de escala moderada; se adoptó carga progresiva de 48 hasta 120.
- Se conserva Fastify + MySQL + React Query.
- Se conservó Embla para interacciones de carrusel.
- Se eliminaron efectos continuos antes de agregar nuevos efectos visuales.

## PUNTOS PENDIENTES / VALIDACIÓN EN PRODUCCIÓN

- Ejecutar build de producción y revisar tamaños de chunks.
- Ejecutar Lighthouse / PageSpeed en la URL real después del deploy.
- Revisar Network con conexión móvil simulada para medir LCP real del Hero.
- Medir peso medio de uploads históricos: la optimización automática aplica a nuevas cargas; los archivos viejos no se recomprimen destructivamente.
- Confirmar versión MySQL/MariaDB del hosting para el uso de ROW_NUMBER en la consulta resumida de imágenes.
- Validar caché efectiva servida por LiteSpeed/Hostinger y compresión Brotli/Gzip de transporte.
- Si el catálogo supera ampliamente los 120 productos por marca, migrar la carga progresiva a paginación real con cursor.

## Pruebas estáticas realizadas en esta entrega

- Se verificó que el paquete informa 9.0.0.
- Se verificó que main.tsx ya no importa CSS V8.6.
- Se verificó que ProductPage usa la única ProductGallery.
- Se eliminaron ProductGalleryV86 y SmoothScroll.
- Se verificó que Home no hace el request de 80 productos.
- Se verificó que Header Search pide hasta 8 resultados.
- Se verificó que la migración de DB es aditiva: no contiene DROP/TRUNCATE/reset/seed.
- Se verificó que la arquitectura mantiene productos, variantes, pedidos, stock, multimedia, mayoristas y configuración existentes.

No se ejecutó compilación ni Lighthouse en esta entrega source-only.
