# CHANGELOG V10 — source-only

## 10.0.0
- Home: se unifica Hero y EditorialBannerCarousel sin perder título editable de cada marca ni banners del admin.
- Carousel: primera foto de alta prioridad, autoplay condicionado por visibilidad, controles de 44px, CSS responsive para object-position sin <style> dinámico.
- Producto: SEO separado en `useProductSeo` y selector accesible de variantes extraído a `ProductVariantSelector`.
- Multimedia: `productMediaUrls` reutilizable por ProductPage y ProductCard, eliminación de repetidas con orden determinista.
- Tipografía comercial: corrección de etiquetas críticas de 7–9px en principales pantallas storefront.
- Pedidos: se resuelve teléfono de WhatsApp *antes* de confirmar la transacción, evitando falso error post-commit.
- Pedidos: `makeWhatsappMessage` extraído a módulo tipado y testeable.
- Administración: tipado explícito `flatMap<Row>` para filas de stock sin variante.
- Tests: 6 tests de lógica de imágenes y mensajes; 3 smoke tests Playwright de Home, carousel y producto mobile con mocks de API.
- CI: tests + typecheck + build en Node 22, packaging source-only con ZIP raíz compatible con Hostinger.
- Docs: auditoría, design system, rendimiento, QA, deploy y changelog.

## Compatibilidad
Se conservan React/Vite/TypeScript/Fastify/MySQL, dos marcas, carrito único, variantes, imágenes, pedidos y administración. Sin seeds, migraciones destructivas o reemplazo de contenido existente.

## Pendientes declarados
Refactor completo de `server/routes/admin.ts`, pruebas E2E visuales, validación de índices, medición Lighthouse de producción e idempotencia transaccional de pedidos. Estos pendientes no se ocultan ni se reportan como completados.
