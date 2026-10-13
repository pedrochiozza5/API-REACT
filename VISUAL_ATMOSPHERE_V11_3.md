# VISUAL_ATMOSPHERE_V11_3

## Objetivo
Integrar la fotografía auténtica del mate en la playa (ya usada por el hero) en las pantallas Home y ProductPage sin generar otra vez una web totalmente blanca, ni convertir la foto del producto en un collage o reducir la legibilidad.

## Evidencia en V11.2
- El componente `StoreBackdrop` producía únicamente dos divs con gradientes neutros.
- `.home-clean-flow` pintaba un gradiente sólido de oliva/arena, por lo que al terminar el hero se perdía la fotografía y la continuidad de marca.
- `.v11-product-stage` y el panel comercial usaban fondos opacos, dejando la galería aislada sobre un plano uniforme.
- Ya existían recursos WEBP ligeros optimizados: `/brand/hero-beach.webp` (~269 KB) y `/brand/hero-beach-mobile.webp` (~161 KB); **se reutilizan, no se reemplazan ni duplican**.

## Decisiones V11.3
1. `StoreBackdrop` incorpora modo `coastal` para Home y ProductPage; el resto de las pantallas preserva el fondo neutro. Usa `picture` con art direction móvil y foto sin desenfoques agresivos.
2. El hero original sigue siendo el elemento visual prioritario/LCP. El fondo decorativo tiene prioridad baja y, al usar la misma URL, el navegador puede reutilizar caché.
3. `home-clean-flow` y las secciones Destacados/Categorías reciben velos de color **semitransparentes** para conservar suficiente fotografía visible por detrás sin comprometer lectura de nombres y precios.
4. Nuevo `CoastalInterlude`: un punto de transición editorial entre banner e inventario. Conserva ubicación de marca (Mar de Ajó) y enlace útil al catálogo, con entrada corta que respeta reduced motion.
5. `ProductPage`: el escenario fotográfico se ve alrededor de la galería; el panel de compra conserva superficie clara y sólida para leer precios, stock, variantes y CTA. El producto mantiene **su imagen original** y toda la lógica de variante/multimedia de V11.2.
6. Nuevo `ProductAtmosphere`: una pausa visual accesible entre la ficha de compra y el Footer, mostrando el paisaje alrededor del contenido y un enlace al catálogo.
7. Motion de producto/hero/card existente se preserva; se añadieron únicamente entradas discretas basadas en `whileInView` (una vez). No hay parallax continuo, loops infinitos, canvas, video de fondo o bibliotecas adicionales.

## Dos marcas
- Amargos: scrim verde profundo, olivo y arena.
- Yerbados: scrim verde cálido y dorado, sin texto blanco sobre crema claro.
- Los textos sobre fotografía usan superficies suficientemente oscuras; botones y links mantienen indicadores de focus.

## Seguridad funcional
No se modifica backend de catálogo, transacciones, stock, variantes, uploads, esquema MySQL ni archivo de imagen original. No se ejecutan semillas ni migraciones destructivas.

## Límites de verificación
- CI: tests unitarios, chequeo de tipos, build, Chromium Playwright; ver último run de rama.
- Validar además con imágenes reales de producto en Hostinger y revisar contraste visual de las fotos de banner nuevas que puedan editarse desde el admin.
- Medir Lighthouse LCP/INP/CLS en producción o staging, no reportar números no medidos.

## Fuentes consultadas
- https://motion.dev/docs/react-use-scroll (Motion scroll behavior y GPU)
- https://web.dev/articles/optimize-lcp (priorización de imagen LCP)
- https://web.dev/articles/preload-responsive-images (art direction responsive y preludes)
- https://aesop.com/ (dirección editorial conceptual, no reproducción literal)

## Archivos modificados
- `src/components/storefront/StoreBackdrop.tsx`
- `src/components/storefront/CoastalInterlude.tsx` (nuevo)
- `src/components/storefront/ProductAtmosphere.tsx` (nuevo)
- `src/pages/store/BrandHome.tsx`
- `src/pages/store/ProductPage.tsx`
- `src/styles.css`
- `tests/e2e/storefront.spec.ts`
- Versión, workflow, docs.

## Staging sugerido
1. Ver ambas marcas desde 390 y 1440 px.
2. Scroll al final del hero: la foto debe seguir reconociéndose en lugar de desaparecer bajo blanco.
3. Producto Mate Maradona y Mate Scaloneta: comprobar que la galería preserve fotos propias y que el paisaje sólo acompañe, no se superponga.
4. Cambiar variantes A / B / A: no debe quedar ningún rectángulo blanco ni mezclar imágenes.
5. Comprar, mostrar Cart Peek, abrir Carrito y finalizar WhatsApp en staging.
6. Revisar catálogo, admin de multimedia/categorías y subida de foto, que no fueron alterados por este rediseño.
