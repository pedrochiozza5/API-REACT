# Visual QA — V11 source candidate

## Evidencia disponible

Se estudiaron las capturas aportadas por el usuario de Bien Amargos, Bien Yerbados y una referencia de Matesur, además del video de cambios de imágenes. Se identificó exceso de espacio vacío en la presentación de fotografías verticales, controles de Yerbados con contraste insuficiente y una card que podía quedarse sin foto al cambiar de variante.

## Cambios aplicados para revisión

- Nuevo escenario fotográfico de producto, diferenciado por marca.
- Galería y miniaturas accesibles en desktop y mobile.
- Columna comercial sin altura mínima forzada.
- CTA editorial dark-green con texto blanco explícito en ambas marcas.
- Admin multimedia con controles permanentes en lugar de acciones sólo en hover.

## Validaciones realizadas

- Análisis de sintaxis en 84 archivos TS y TSX sin errores de parseo.
- 10 verificaciones de lógica y contrastes en Node: aprobadas.

## No realizado / pendiente

No fue posible instalar todas las dependencias npm en esta sesión. Por lo tanto **no se ejecutaron build Vite, typecheck completo, navegador Playwright ni comparaciones de capturas de la versión V11**. Las capturas V10 no deben atribuirse a V11.

La suite Playwright ampliada prueba `naturalWidth > 0`, `complete` y opacidad tras transiciones de variante en card y detalle. Ejecutarla obligatoriamente en CI y staging antes del deploy.

Matriz pendiente: 320/360/375/390/430/768/1024/1280/1440/1920 px, Amargos y Yerbados, hover/disabled/loading/focus, fotos 1–10, navegación teclado, scroll horizontal y sticky actions.


## QA adicional V11.1

Se agregó cobertura Playwright para:
- Cards sin flechas, tap que lleva al detalle y segunda imagen sólo durante hover desktop.
- Producto con una sola imagen: sin navegación redundante.
- Producto con diez imágenes: miniatura 10 accesible, estado activo correcto y sin desbordamiento horizontal.
- Galería sin flechas: miniaturas y teclas de cursor.
- Lightbox Radix: Escape y restauración de foco.
- Cambios entre variantes con la foto correcta, sin opacidad cero.

El resultado de cada ejecución se verifica en GitHub Actions. No declarar aprobado un caso si el run asociado falló.
