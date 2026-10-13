# Bien Amargos / Bien Yerbados — V11.1 SOURCE

## V11.1 — UX de imágenes sin controles toscos

- ProductCard elimina flechas y puntos. Desktop: segunda foto al hover, sin flash blanco. Mobile: foto limpia y tap para abrir ficha.
- ProductGallery elimina flechas de navegación, mantiene swipe Embla y muestra miniaturas reales de fácil toque.
- Miniatura activa visible también en galerías de hasta diez imágenes.
- Lightbox convertido en diálogo Radix accesible con cierre por Escape y retorno correcto de foco.
- FeaturedCarousel pasa a exploración horizontal por drag/swipe y teclado, sin flechas decorativas.
- Banners editoriales con flechas sólo en desktop.
- Acciones multimedia del administrador conservan 44px mínimo y se acomodan en columnas estrechas.
- E2E amplía casos de una foto, diez fotos, transición de variantes, foco y hover secundario.

Ver `UX_GALLERY_V11_1.md` para decisiones, limitaciones y matriz de QA.

---

# Bien Amargos / Bien Yerbados — V11 source candidate

## Correcciones funcionales

- ProductImage nunca bloquea fotos por `opacity-0` en espera de onLoad; desacopla estado de red/animación y aísla fallos por conjunto de URLs.
- Cambio de variante y foto 0 derivados en la misma renderización de ProductCard.
- ProductGallery se monta con identidad de variante, reinicializando su índice/estado en cada selección distinta.
- API del catálogo incluye hasta 3 fotografías por variante, de forma agrupada y sin N+1.
- `productMediaUrls` evita mezclar galerías de variante y producto cuando la variante tiene medios propios.
- Payload admin excluye duplicados de la imagen principal y maneja promoción desde biblioteca.

## Diseño y experiencia

- Nuevo escenario visual de producto, superficie específica Amargos/Yerbados, miniaturas y flechas claras, sin gran bloque beige vacío.
- Columna de producto menos rígida, mejora de contraste y guía corta de compra debajo.
- CTA de campaña con color de texto explícito y ratio WCAG AA comprobado.
- Limpieza de reglas legacy de Hero eliminadas en V10, tokens de marca y mayor legibilidad en editor/admin.

## Administración

- Componente `AdminVariantGallery` para galería del producto y variantes, controles siempre disponibles, acciones de foto principal/reordenar/desasociar.
- Diálogos Radix para detalle multimedia y edición de variantes.
- Evita eliminar medios mientras la comprobación de referencias no se completó o falló.

## Compatibilidad

Preserva tablas, productos, variantes, IDs, uploads, usuarios, stock y pedidos. No contiene migración destructiva. Código fuente, Node 22 + Hostinger.

## Quality gates

84 archivos TS/TSX con sintaxis válida y 10 checks de lógica/contraste aprobados. Build Vite, typecheck completo, CI y Playwright **PENDIENTES**, documentados en `VISUAL_QA.md`.
