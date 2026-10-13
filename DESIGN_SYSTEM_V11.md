# Design System V11

## Principios

Ecommerce editorial cálido, producto auténtico protagonista, diferencia clara entre superficie de fotografía y superficie de compra. Nada de wallpaper fotográfico global ni tarjetas flotantes gigantes. Dos marcas con composición compartida y paleta propia.

## Composición de producto

- Galería más compacta y bien delimitada, con superficie tonal verde salvia o arena cálida según marca.
- Barra editorial superior discreta, fotografía en un escenario reconocible, miniaturas a la izquierda en desktop y navegación por flechas.
- Columna comercial integrada, sin altura forzada de 100svh. Debajo se ofrece información breve del recorrido de compra.
- Mobile adapta la escena y miniaturas a un área menor, respetando CTA sticky y safe-area.

## Controles

- Fondo/foreground explícitos: Amargos `#164632`/`#fff`, Yerbados `#163e2e`/`#fff`.
- Relaciones de contraste calculadas: 10.73:1 y 11.91:1, respectivamente; WCAG AA para texto normal.
- Botones del carrito y principales no heredan texto blanco sobre fondos crema; el CTA editorial tiene clase semántica `editorial-commerce-cta`.
- Admin acciones de multimedia persistentes, con controles de 40px y foco visible; tamaños críticos aumentados.
- No introducir un estilo de botón distinto sin razón funcional.

## Movimiento

- Carrusel Embla mantiene drag y teclado.
- En ProductImage la visibilidad NO depende de animaciones ni timeouts.
- Motion y transiciones cortas sólo refuerzan feedback, no gobiernan carga de imágenes.
- Respetar `prefers-reduced-motion`; evitar loops decorativos.

## Referencias consultadas

- Baymard: https://baymard.com/research-articles/always-use-thumbnails-additional-images
- Baymard (miniaturas ocultas): https://baymard.com/research-articles/truncating-product-gallery-thumbnails
- Radix Dialog: https://www.radix-ui.com/primitives/docs/components/dialog
- Embla: https://www.embla-carousel.com/

No se copiaron fotografías ni componentes propietarios de otra marca.
