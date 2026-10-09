# DESIGN SYSTEM — V10

## Dirección de arte
**Bien Amargos:** verde profundo, oliva, arena, crema, tinta suave; fotografía matera genuina.
**Bien Yerbados:** misma estructura UI, acentos mostaza cálido y verde.
**Storefront no es un dashboard:** fotografía protagonista solo en hero/editorial/producto; transiciones neutras entre secciones. No duplicar grandes héroes ni cargar imágenes de fondo en todas las pantallas.

## Tokens existentes
La fuente de verdad es `src/styles.css`. Reutilizar `--color-ink`, `--color-paper`, `--color-surface`, `--color-primary`, `--color-primary-hover`, `--color-border`, `--color-success`, `--color-warning`, `--color-danger`, radios y motion.
Evitar colores hardcoded nuevos y estilos de versión.

## Principios
- Acción primaria verde sólido + texto blanco; CTA claramente legible.
- Controles de toque mínimo 44×44 px en mobile.
- Precio de producto > nombre secundario > descripción > metadatos.
- No usar texto importante de 7–9px; buscar 12–16px para contenido operativo.
- Usar `Button` de `src/components/ui/button.tsx` y primitives Radix existentes en vez de implementar focus traps manuales.
- Variantes: `ProductVariantSelector` con `aria-pressed`, disabled claramente indicado y labels legibles.
- Carouseles: Embla existente; indicadores visualmente discretos, área de clic grande y teclado funcional.
- Animar solo transform/opacity entre 120–350 ms cuando refuerce orientación o feedback. Respetar reduced-motion.
- No añadir React Bits/Magic UI solo por ornamento.

## Páginas y composición
Home usa **un único carrusel editorial full-bleed**. Su primera slide toma la cabecera de hero editable por marca; luego sliders administrables.
Producto mantiene división foto / panel comercial (escritorio) y foto / ficha / sticky CTA (mobile).
Cart Peek es confirmación, CartDrawer es edición del pedido, Checkout termina en WhatsApp.

## Criterios de revisión visual pendientes
320, 360, 390, 430, 768, 1024, 1440, 1920px; ambos brands; precio de oferta y agotado; foco; contrates sobre fotografía.

Referencias técnicas investigadas: https://www.embla-carousel.com/ , https://www.radix-ui.com/primitives , https://motion.dev/docs/react y https://matesur.net/ . Se usan patrones, nunca assets ni diseños copiados.
