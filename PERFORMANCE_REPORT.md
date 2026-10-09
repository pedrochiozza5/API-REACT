# PERFORMANCE REPORT — V10

## Estado
No existe una medición A/B reproducible de producción dentro de este encargo. Cualquier valor LCP, INP o CLS informado como mejora porcentual sería inventado.

## Evidencia de código y decisiones
- V9.2 renderizaba Hero y EditorialBannerCarousel seguidos, añadiendo peso visual y recursos críticos repetidos. V10 los reemplaza por un hero editorial único.
- El primer banner carga `loading=eager` y `fetchPriority=high`; el resto lazy/low. El lazy inicial era inapropiado para contenido LCP.
- Autoplay Embla se pausa fuera del viewport, con reduced motion y en pestañas ocultas.
- El CSS específico por banner se resuelve con custom properties en vez de insertar tags `style` por slide.
- Media deduplicada y ordenada por función compartida entre card y ficha; evita repetir URLs.
- Se conserva code splitting del carrito, mapa y admin, y Fetch con AbortSignal donde ya existían.

## Riesgos abiertos
- Revisar consulta SQL y tiempo de respuesta en MySQL real.
- Revisar caching de stock/precios, especialmente con cambios recientes.
- Optimizar thumbnails históricas; actualmente no hay una CDN de transformación de imágenes documentada.
- Medir costo del chatbot y scripts externos.
- Evitar recompresión destructiva de los uploads existentes.

## Objetivos para staging
LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 y Lighthouse mobile ≥ 90 cuando el dispositivo/conexión permitan. Medir en iPhone/Android, tanto cold cache como warm cache. Adjuntar pruebas de red, bundles, requests y capturas en QA_REPORT.md.

## No realizado
No hay benchmarks de producción, prueba de concurrencia de 5.000 sesiones ni comparación visual automatizada en este entorno. Las métricas quedan pendientes hasta disponer de staging accesible y navegador.
