# Bien Amargos / Bien Yerbados — V11.1 Image Interaction Audit

## Lo que se decidió

| Superficie | Antes | V11.1 |
| --- | --- | --- |
| ProductCard | Flechas circulares a ambos lados y dots en cada tarjeta | Foto principal limpia; en desktop la segunda foto se solicita sólo al hover de un puntero preciso. Mobile: tocar abre el producto |
| ProductGallery | Miniaturas + flechas en el pie | Miniaturas para navegación directa, swipe Embla y teclado, sin flechas superpuestas |
| Galerías largas | La miniatura activa podía quedar fuera de la tira | La miniatura activa se desplaza al área visible (incluidas galerías de 10 fotos) |
| Galería de 1 imagen | Numeración y controles redundantes | Sin miniaturas repetidas ni navegación; solo ampliar |
| Lightbox | Modal personalizado con foco manual incompleto | Dialog de Radix con foco contenido, Escape, retorno de foco al disparador y ampliación |
| FeaturedCarousel | Flechas y card con flechas internas | Un solo scroll horizontal por drag/swipe; navegación accesible con teclado |
| EditorialBannerCarousel | Flechas flotantes en mobile y desktop | Swipe y dots en mobile; flechas discretas solamente en desktop |
| AdminVariantGallery | Acciones apretadas en tarjetas estrechas | Controles de al menos 44px con ajuste en varias filas y textos de desasociación explícitos |

## Por qué NO se agregó swipe a cada ProductCard

En un catálogo con muchas tarjetas, inicializar Embla por card aumenta listeners y complejidad, y un swipe horizontal puede interferir con el desplazamiento vertical o el tap para abrir la ficha. V11.1 mantiene en móvil una acción primaria clara: tocar la card abre la ficha donde existe una galería completa. La segunda foto sólo se solicita al hover desktop.

## Protección de variantes

Se conserva la lógica de V11 `productMediaUrls`, la selección derivada por variante y `ProductImage` sin la antigua dependencia de `opacity:0` para mostrar la imagen principal. La imagen alternativa de card no tapa la principal hasta que termina de cargarse; una URL alternativa rota no genera un cuadro blanco.

## Accesibilidad

- En ProductGallery, las miniaturas son botones con `aria-current`; también se conserva navegación por teclado.
- En mobile no se exige descubrir un botón de flecha flotante.
- El diálogo ampliado gestiona focus trap y Escape por Radix, y devuelve el foco al botón "Ampliar".
- Cuando existe una única imagen no se muestran miniaturas redundantes.
- Controles operativos del admin usan objetivos táctiles >=44px.
- Se respeta reduced motion en el desplazamiento automático de miniaturas.

## Rendimiento

No se añadió una dependencia de carouseles a las cards: Embla ya se utiliza en ProductGallery, Featured y banners. Las imágenes secundarias de card se montan únicamente durante hover de escritorio. Se mantienen `lazy`, `decoding=async`, precarga de la siguiente foto desde V11 y tamaños de contenedor estables.

## Verificación

`npm test`, `npm run typecheck:web`, `npm run build` y `npm run test:e2e` se ejecutan en el workflow de GitHub Actions de `v11.1-source`.

Casos E2E: galería con una foto, tres fotos y diez fotos, retorno del foco del lightbox, ausencia de flechas de card, preview secundario al hover, cambio de variantes A/B/A, desktop/móvil, compra hacia Cart Peek y ancho de banner.

**Limitación:** el workflow usa respuestas API simuladas para navegador y no reemplaza QA con la base de datos y los archivos subidos en Hostinger. No se infieren métricas Lighthouse sin medición real.
