# QA REPORT — V10

## Automatización disponible
- `npm test` → Node.js test runner mediante `tsx --test tests/*.test.ts`.
- `npm run typecheck:web` → comprobación TypeScript estricta.
- `npm run build` → Vite + TypeScript API para Hostinger.
- Workflow `.github/workflows/hostinger-source.yml` se ejecuta con Node 22 y solo empaqueta SOURCE si pasan sus etapas.

## Pruebas de navegador agregadas
Playwright + Chromium con backend API simulado, sin usar datos de producción:
- Home Amargos desktop 1440px: un único carrusel full-bleed y CTA visible.
- Home Yerbados mobile 390px: controles táctiles y ausencia de scroll horizontal.
- Producto mobile 390px: galería, compra y Cart Peek visible.
- Evidencias PNG exportadas por CI en el artifact `bienamargos-v10-VISUAL-QA`.

Estos smoke tests NO equivalen a una auditoría visual humana completa ni a probar pedidos con MySQL real. Los resultados deben leerse del último workflow de CI.

## Casos automatizados
1. Producto con una imagen.
2. Media múltiple con principal duplicada.
3. Prioridad de foto de variante.
4. Vacíos/URLs repetidas sin slides en blanco.
5. Pedido WhatsApp para retiro.
6. Pedido WhatsApp para entrega.

**Nota:** los seis tests pasaron en una ejecución inicial de CI V10; la validación del HEAD final debe consultarse en GitHub Actions. Se detectó además un error de tipado previo en `AdminStock.tsx`, corregido con `flatMap<Row>`.

## Pruebas manuales requeridas antes de producción
- Admin: login por rol, permiso de marca, editar precio/stock sin perder imágenes, cambiar principal, subir 1/5/10 imágenes, variantes.
- Carrito: mezclar marcas, cantidades, eliminar, agotado, compra por WhatsApp y recuperación tras recargar.
- Backend: cierre de tienda, stock insuficiente, cancelación de pedido, expiración y reserva concurrente.
- UI: Home, catálogo, ficha, admin y checkout a 320/360/390/430/768/1024/1440/1920 px; sin scroll horizontal ni CTAs ocultos.
- Accesibilidad: tab/Shift+Tab, Escape en diálogos, labels, lector de pantalla, reduced motion.
- Performance: Lighthouse mobile/desktop desde Hostinger en red real.

## Limitaciones
La validación Playwright se ejecuta en GitHub Actions; si el job pasa, sus capturas son evidencia inspeccionable. Todavía no se midió Lighthouse ni se comprobaron todas las páginas con una base de staging. Playwright debe incorporarse en staging, con credenciales de prueba, datos sintéticos y snapshots aprobadas, nunca con la base de producción.
