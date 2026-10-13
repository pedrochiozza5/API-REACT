# V11 — Bug de imágenes al cambiar variantes

## Evidencia de código inspeccionada

La V10 implementaba en `src/components/storefront/ProductImage.tsx` un estado `loaded` que controlaba `opacity-0` / `opacity-100` y se reiniciaba en `useEffect` ante cambios de `src`. Ese diseño permitía esta secuencia: la nueva imagen (especialmente en caché) completa la carga, llega `onLoad`, y luego un efecto posterior establece `loaded=false`; si no vuelve a emitirse `load`, la foto permanece totalmente invisible aunque el recurso sea válido. **Se detectó el mecanismo de riesgo en el código; su manifestación exacta con los datos del video aún necesita reproducirse en navegador.**

Además, `ProductCard.tsx` cambiaba `preview` y `mediaIndex` mediante actualizaciones independientes; el índice de la foto anterior podía aplicarse transitoriamente a la nueva variante. `productMediaUrls` mezclaba cubierta de variante, galería de producto y fotos de variante sin distinguir qué fotos correspondían realmente a la selección. `enrichProductList` retornaba únicamente `image_url` por variante, mientras que `enrichProductDetail` sí obtenía `product_variant_images`.

## Cambios de arquitectura

- `ProductImage` ya no oculta imágenes basándose en `loaded`; el `<img>` permanece visible durante el ciclo de carga. La clave de la pareja `src/fallback` aísla los fallos entre selecciones. Se verifica el estado `complete/naturalWidth` para callbacks, nunca para visibilidad.
- `ProductCard`: `mediaSelection={key,index}` conserva un índice únicamente si corresponde al producto y variante vigentes. En la primera renderización del cambio se selecciona foto índice 0.
- `ProductPage`: `ProductGallery` se remonta con clave `product.id/variant.id` para restablecer Embla, miniaturas y errores locales de la selección anterior.
- `productMediaUrls`: una variante con fotos propias muestra sólo su foto principal y galería; una variante sin fotos propias hereda la galería general. No incluye fotografías de otra variante ni URLs repetidas.
- `server/routes/catalog.ts`: se incorporan hasta 3 imágenes de galería por variante al DTO de listados, mediante consulta agrupada, evitando la diferencia entre card y ficha.
- `AdminProductEditor`: se evita enviar imagen principal también como entrada duplicada de la misma galería.

## Pruebas ejecutadas

- 84 archivos TS/TSX analizados sin errores de sintaxis.
- Pruebas aisladas ejecutadas con TypeScript transpilation en Node: variante A, variante B, cambio A/B/A, galería general, fallback, deduplicación.
- Se añadieron escenarios Playwright reales al repositorio; **no se ejecutaron** en este entorno por instalación incompleta de dependencias.

## Pruebas que faltan para considerar P0 definitivamente cerrado

1. Ejecución Playwright Chromium de A → siguiente foto → B → A → B con caché fría y caliente.
2. Validar `img.complete`, `naturalWidth > 0`, opacidad calculada y URL correcta en detalle y card.
3. Repetir con red lenta, URLs rotas, cambio durante fetch, variantes sin foto y 10 imágenes.
4. Probar backend y MySQL con registros reales de staging; verificar `product_variant_images` y persistencia de uploads.

El arreglo elimina la causa visible en el código, pero no constituye todavía una verificación E2E de producción.
