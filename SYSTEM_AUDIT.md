# SYSTEM_AUDIT — Bien Amargos / Bien Yerbados V10

**Base inspeccionada:** `v9.2-source`. **Rama de trabajo:** `v10-source`.
**Alcance:** inventario de 146 archivos de la base, análisis de rutas, flujos críticos y componentes seleccionados. No confundir inventario con validación visual individual de cada archivo.

## Hallazgos y decisiones

| Riesgo | Evidencia en la base | Acción V10 | Estado |
| --- | --- | --- | --- |
| P0 — falso error tras guardar un pedido | `server/routes/orders.ts` consultaba la configuración WhatsApp después de `conn.commit()` | Configuración y URL se resuelven dentro de la transacción, antes del commit | Corregido en código |
| P1 — dos protagonistas en Home | `BrandHome.tsx` montaba `Hero` y `EditorialBannerCarousel` consecutivamente | Un único carrusel editorial full-bleed, conservando titular editable de ambas marcas | Corregido en código |
| P1 — diferencias de media en Card y ficha | Ambas tenían código propio de deduplicación/orden | `productMediaUrls()` compartido, cubierta principal única y variantes | Corregido + tests |
| P1 — sin suite automatizada en V9.2 | No existían `*.test.*` / `*.spec.*` en el árbol base | Pruebas Node de media y formato de pedidos; ver `QA_REPORT.md` | Cobertura inicial, no completa |
| P1 — errores TypeScript stock | `AdminStock.tsx` infiere el tipo de `flatMap` como variante no nula, pero hay productos sin variante | `flatMap<Row>` y modelo de filas tipado | Corregido en código |
| P1 — paneles operativos monolíticos | `server/routes/admin.ts` ~66 KB, `AdminProductEditor.tsx` ~40 KB | Recomendada separación por dominios y contratos; no tocar sin pruebas E2E | Pendiente |
| P2 — ProductPage acopla SEO y UI | `ProductPage.tsx` manejaba metadatos + selección + UI | SEO a `useProductSeo`, variantes a `ProductVariantSelector` | Corregido parcialmente |
| P2 — tipografía demasiado pequeña | Storefront usaba texto comercial a 7, 8 y 9 px | Escala a al menos 10–11px en controles seleccionados | Aplicado; falta revisión visual |
| P2 — estilos extensos | `src/styles.css` ~46 KB y numerosas clases inline | Añadidas reglas del banner sin `<style>` dinámico | Simplificación mayor pendiente |
| P2 — persistencia Hostinger | Source ZIP de GitHub añade directorio contenedor | Workflow crea artifact con `package.json` y `server.js` en raíz | Automatizado |
| P1 — stock/precio percibido | El catálogo usa cache HTTP; precio/stock se valida otra vez en backend | Revisar invalidez de caches ante cambios de inventario | Requiere prueba real |
| P1 — reintentos del cliente | El backend no expone clave idempotente de pedido | Evaluar idempotencia transaccional para red inestable | Pendiente, no se inventó migración |

## Arquitectura preservada

- React 19, TypeScript, Vite 7, Tailwind 4, Embla 8, Motion y React Query.
- Backend Fastify 5, MySQL y Node 22.
- Carrito único Bien Amargos / Bien Yerbados; WhatsApp como cierre de pedido.
- Administración, clientes, productos, variantes, imágenes, stock, mayoristas y auditoría.
- Ninguna migración destructiva, seed o reset de producción introducido por V10.

## Matriz de riesgos que todavía requieren staging

- **Admin:** alta/baja de imágenes, ordenamiento, edición de variantes, permisos por marca, roles y ajustes masivos de stock.
- **Pedidos:** concurrencia, reintento de WhatsApp, reserva/expiración, stock agregado y cancelaciones.
- **SEO:** comparación de HTML server-side y metadatos cliente, preview real de WhatsApp.
- **UI:** iPhone safe area, historial del catálogo, desplazamiento horizontal, foco de modal, contraste por fotografía.
- **Performance:** Lighthouse, INP y LCP bajo condiciones reales de Hostinger.

## Inventario del repositorio base

La siguiente tabla enumera todos los archivos recuperados del árbol Git de la V9.2. Su inclusión no significa que cada archivo haya sido modificado o probado.

| Archivo | Área / responsabilidad | Tamaño |
| --- | --- | --- |
| `.env.example` | Configuración o documentación | 0.9 KB |
| `.github/workflows/hostinger-source.yml` | Empaquetado / CI | 1.1 KB |
| `.gitignore` | Configuración o documentación | 0.1 KB |
| `01_INSTALAR_LOCAL.bat` | Configuración o documentación | 0.8 KB |
| `01_INSTALAR_LOCAL.sh` | Configuración o documentación | 0.2 KB |
| `02_INICIAR_LOCAL.bat` | Configuración o documentación | 0.3 KB |
| `02_INICIAR_LOCAL.sh` | Configuración o documentación | 0.1 KB |
| `database/schema.sql` | Esquema SQL / base de datos | 15.6 KB |
| `index.html` | Configuración o documentación | 2.1 KB |
| `package.json` | Configuración o documentación | 1.9 KB |
| `PERFORMANCE.md` | Configuración o documentación | 9.6 KB |
| `public/brand/apple-touch-icon.png` | Imagen o recurso público | 16.7 KB |
| `public/brand/bien-amargos-mark.png` | Imagen o recurso público | 280.6 KB |
| `public/brand/cana.webp` | Imagen o recurso público | 39.4 KB |
| `public/brand/chicos.webp` | Imagen o recurso público | 248.3 KB |
| `public/brand/favicon-192.png` | Imagen o recurso público | 18.2 KB |
| `public/brand/favicon-32.png` | Imagen o recurso público | 2.1 KB |
| `public/brand/favicon-512.png` | Imagen o recurso público | 65.0 KB |
| `public/brand/hero-beach-mobile.webp` | Imagen o recurso público | 160.9 KB |
| `public/brand/hero-beach.webp` | Imagen o recurso público | 268.9 KB |
| `public/brand/mate-outline.png` | Imagen o recurso público | 18.0 KB |
| `public/brand/repisa.webp` | Imagen o recurso público | 192.7 KB |
| `public/brand/varios.webp` | Imagen o recurso público | 145.0 KB |
| `public/brand/yerba-outline.png` | Imagen o recurso público | 18.9 KB |
| `public/brand/yerbas-stock.webp` | Imagen o recurso público | 150.8 KB |
| `public/catalog/categories/accesorios.webp` | Imagen o recurso público | 25.3 KB |
| `public/catalog/categories/bombillas.webp` | Imagen o recurso público | 107.5 KB |
| `public/catalog/categories/canastas.webp` | Imagen o recurso público | 57.7 KB |
| `public/catalog/categories/combos.webp` | Imagen o recurso público | 38.4 KB |
| `public/catalog/categories/dispensers.webp` | Imagen o recurso público | 120.2 KB |
| `public/catalog/categories/mates.webp` | Imagen o recurso público | 45.2 KB |
| `public/catalog/categories/termos.webp` | Imagen o recurso público | 23.6 KB |
| `public/catalog/categories/yerbas.webp` | Imagen o recurso público | 89.0 KB |
| `public/catalog/categories/yerberos.webp` | Imagen o recurso público | 88.2 KB |
| `public/catalog/products/bombilla-acero.webp` | Imagen o recurso público | 88.6 KB |
| `public/catalog/products/bombilla-corta.webp` | Imagen o recurso público | 149.1 KB |
| `public/catalog/products/bombilla-larga.webp` | Imagen o recurso público | 159.0 KB |
| `public/catalog/products/bombillon-alpaca.webp` | Imagen o recurso público | 108.8 KB |
| `public/catalog/products/bombillon-pico-bronce.webp` | Imagen o recurso público | 127.3 KB |
| `public/catalog/products/canasta-premium-bordo.webp` | Imagen o recurso público | 66.8 KB |
| `public/catalog/products/canasta-premium-marron.webp` | Imagen o recurso público | 101.8 KB |
| `public/catalog/products/canasta-premium-negro.webp` | Imagen o recurso público | 77.6 KB |
| `public/catalog/products/canasta-premium.webp` | Imagen o recurso público | 77.6 KB |
| `public/catalog/products/combo-completo-1.webp` | Imagen o recurso público | 32.3 KB |
| `public/catalog/products/combo-completo-2.webp` | Imagen o recurso público | 113.8 KB |
| `public/catalog/products/combo-completo-3.webp` | Imagen o recurso público | 53.5 KB |
| `public/catalog/products/combo-completo.webp` | Imagen o recurso público | 51.3 KB |
| `public/catalog/products/combo-imperial.webp` | Imagen o recurso público | 64.4 KB |
| `public/catalog/products/imperial-algarrobo.webp` | Imagen o recurso público | 109.9 KB |
| `public/catalog/products/imperial-calabaza-bordo.webp` | Imagen o recurso público | 56.0 KB |
| `public/catalog/products/imperial-calabaza-negro.webp` | Imagen o recurso público | 95.8 KB |
| `public/catalog/products/imperial-calabaza.webp` | Imagen o recurso público | 33.4 KB |
| `public/catalog/products/mate-indio.webp` | Imagen o recurso público | 81.2 KB |
| `public/catalog/products/mate-maradona.webp` | Imagen o recurso público | 73.5 KB |
| `public/catalog/products/mate-scaloneta.webp` | Imagen o recurso público | 67.4 KB |
| `public/catalog/products/termo-media-manija.webp` | Imagen o recurso público | 32.3 KB |
| `public/catalog/products/torpedo-calabaza-bordo.webp` | Imagen o recurso público | 87.8 KB |
| `public/catalog/products/torpedo-calabaza-negro.webp` | Imagen o recurso público | 80.0 KB |
| `public/catalog/products/torpedo-calabaza.webp` | Imagen o recurso público | 80.0 KB |
| `public/manifest.webmanifest` | Imagen o recurso público | 0.3 KB |
| `public/robots.txt` | Imagen o recurso público | 0.1 KB |
| `README_HOSTINGER_V9.txt` | Configuración o documentación | 1.8 KB |
| `README.md` | Configuración o documentación | 15.8 KB |
| `scripts/import-world-map.ts` | Script operativo; nunca ejecutar seeds en producción | 0.5 KB |
| `scripts/init-db.ts` | Script operativo; nunca ejecutar seeds en producción | 0.6 KB |
| `scripts/seed.ts` | Script operativo; nunca ejecutar seeds en producción | 14.6 KB |
| `server.js` | Configuración o documentación | 0.1 KB |
| `server/auth.ts` | Infraestructura, seguridad o SEO backend | 2.8 KB |
| `server/db.ts` | Infraestructura, seguridad o SEO backend | 2.8 KB |
| `server/index.ts` | Infraestructura, seguridad o SEO backend | 6.8 KB |
| `server/routes/admin.ts` | Endpoint Fastify / reglas backend | 64.6 KB |
| `server/routes/catalog.ts` | Endpoint Fastify / reglas backend | 11.9 KB |
| `server/routes/cron.ts` | Endpoint Fastify / reglas backend | 0.8 KB |
| `server/routes/orders.ts` | Endpoint Fastify / reglas backend | 10.4 KB |
| `server/routes/upload.ts` | Endpoint Fastify / reglas backend | 5.5 KB |
| `server/routes/world.ts` | Endpoint Fastify / reglas backend | 9.6 KB |
| `server/seo.ts` | Infraestructura, seguridad o SEO backend | 11.7 KB |
| `server/tsconfig.json` | Infraestructura, seguridad o SEO backend | 0.4 KB |
| `server/types.ts` | Infraestructura, seguridad o SEO backend | 0.3 KB |
| `server/uploads.ts` | Infraestructura, seguridad o SEO backend | 0.8 KB |
| `src/App.tsx` | Configuración o documentación | 6.8 KB |
| `src/components/admin/AdminCommandPalette.tsx` | Componente compartido administrativo | 6.7 KB |
| `src/components/admin/AdminContext.tsx` | Componente compartido administrativo | 1.9 KB |
| `src/components/admin/AdminImageUpload.tsx` | Componente compartido administrativo | 8.2 KB |
| `src/components/admin/AdminMediaPicker.tsx` | Componente compartido administrativo | 3.3 KB |
| `src/components/admin/AdminUI.tsx` | Componente compartido administrativo | 3.7 KB |
| `src/components/motion/AnimatedContent.tsx` | Configuración o documentación | 0.6 KB |
| `src/components/motion/CountUp.tsx` | Configuración o documentación | 1.0 KB |
| `src/components/motion/Magnet.tsx` | Configuración o documentación | 1.0 KB |
| `src/components/storefront/BrandGlyph.tsx` | Componente de interfaz comercial | 0.8 KB |
| `src/components/storefront/CanaBot.tsx` | Componente de interfaz comercial | 5.2 KB |
| `src/components/storefront/CartDrawer.tsx` | Componente de interfaz comercial | 8.4 KB |
| `src/components/storefront/CartPeek.tsx` | Componente de interfaz comercial | 3.2 KB |
| `src/components/storefront/CategoryShowcase.tsx` | Componente de interfaz comercial | 5.4 KB |
| `src/components/storefront/EditorialBannerCarousel.tsx` | Componente de interfaz comercial | 7.2 KB |
| `src/components/storefront/EditorialFeature.tsx` | Componente de interfaz comercial | 3.1 KB |
| `src/components/storefront/FeaturedCarousel.tsx` | Componente de interfaz comercial | 3.5 KB |
| `src/components/storefront/Footer.tsx` | Componente de interfaz comercial | 3.7 KB |
| `src/components/storefront/Header.tsx` | Componente de interfaz comercial | 11.7 KB |
| `src/components/storefront/Hero.tsx` | Componente de interfaz comercial | 4.0 KB |
| `src/components/storefront/ProductCard.tsx` | Componente de interfaz comercial | 9.0 KB |
| `src/components/storefront/ProductGallery.tsx` | Componente de interfaz comercial | 8.5 KB |
| `src/components/storefront/ProductImage.tsx` | Componente de interfaz comercial | 3.4 KB |
| `src/components/storefront/RouteTitle.tsx` | Componente de interfaz comercial | 3.5 KB |
| `src/components/storefront/ScrollToTop.tsx` | Componente de interfaz comercial | 0.6 KB |
| `src/components/storefront/StoreBackdrop.tsx` | Componente de interfaz comercial | 0.4 KB |
| `src/components/storefront/StoreMarquee.tsx` | Componente de interfaz comercial | 1.0 KB |
| `src/components/storefront/WorldMapCanvas.tsx` | Componente de interfaz comercial | 5.4 KB |
| `src/components/ui/button.tsx` | Primitive / design system | 2.1 KB |
| `src/components/ui/sheet.tsx` | Primitive / design system | 1.2 KB |
| `src/components/ui/tabs.tsx` | Primitive / design system | 0.9 KB |
| `src/lib/api.ts` | Lógica y tipos reutilizables | 0.7 KB |
| `src/lib/cn.ts` | Lógica y tipos reutilizables | 0.2 KB |
| `src/lib/format.ts` | Lógica y tipos reutilizables | 0.5 KB |
| `src/lib/productImages.ts` | Lógica y tipos reutilizables | 0.8 KB |
| `src/lib/types.ts` | Lógica y tipos reutilizables | 3.8 KB |
| `src/lib/useDebouncedValue.ts` | Lógica y tipos reutilizables | 0.3 KB |
| `src/main.tsx` | Configuración o documentación | 0.8 KB |
| `src/pages/admin/AdminAudit.tsx` | Pantalla del panel administrativo | 5.3 KB |
| `src/pages/admin/AdminBanners.tsx` | Pantalla del panel administrativo | 10.8 KB |
| `src/pages/admin/AdminCategories.tsx` | Pantalla del panel administrativo | 7.5 KB |
| `src/pages/admin/AdminCustomers.tsx` | Pantalla del panel administrativo | 7.8 KB |
| `src/pages/admin/AdminDashboard.tsx` | Pantalla del panel administrativo | 9.5 KB |
| `src/pages/admin/AdminFaqs.tsx` | Pantalla del panel administrativo | 8.0 KB |
| `src/pages/admin/AdminLogin.tsx` | Pantalla del panel administrativo | 5.0 KB |
| `src/pages/admin/AdminMedia.tsx` | Pantalla del panel administrativo | 8.5 KB |
| `src/pages/admin/AdminOrders.tsx` | Pantalla del panel administrativo | 14.0 KB |
| `src/pages/admin/AdminProductEditor.tsx` | Pantalla del panel administrativo | 38.9 KB |
| `src/pages/admin/AdminProducts.tsx` | Pantalla del panel administrativo | 7.0 KB |
| `src/pages/admin/AdminSettings.tsx` | Pantalla del panel administrativo | 13.7 KB |
| `src/pages/admin/AdminShell.tsx` | Pantalla del panel administrativo | 9.7 KB |
| `src/pages/admin/AdminStock.tsx` | Pantalla del panel administrativo | 9.1 KB |
| `src/pages/admin/AdminWholesale.tsx` | Pantalla del panel administrativo | 7.3 KB |
| `src/pages/admin/AdminWorldMap.tsx` | Pantalla del panel administrativo | 11.3 KB |
| `src/pages/store/BrandHome.tsx` | Pantalla pública de la tienda | 1.9 KB |
| `src/pages/store/CatalogPage.tsx` | Pantalla pública de la tienda | 6.5 KB |
| `src/pages/store/CheckoutPage.tsx` | Pantalla pública de la tienda | 16.5 KB |
| `src/pages/store/NotFoundPage.tsx` | Pantalla pública de la tienda | 1.2 KB |
| `src/pages/store/ProductPage.tsx` | Pantalla pública de la tienda | 20.5 KB |
| `src/pages/store/WorldMapPage.tsx` | Pantalla pública de la tienda | 8.7 KB |
| `src/store/cart.ts` | Estado global / carrito | 4.5 KB |
| `src/styles.css` | Configuración o documentación | 45.6 KB |
| `tsconfig.json` | Configuración o documentación | 0.6 KB |
| `uploads/.gitkeep` | Configuración o documentación | 0.0 KB |
| `V9.1_VISUAL_AUDIT.md` | Configuración o documentación | 3.9 KB |
| `vite.config.ts` | Configuración o documentación | 1.0 KB |

## Criterio de aceptación

No considerar la rama apta para producción sólo por cambiar la versión. Los tests automatizados y el build de CI validan únicamente el código y flujos que efectivamente cubren; QA navegador y operaciones con base real deben realizarse antes del deploy.
