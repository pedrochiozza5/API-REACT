# Categorías — encuadre visual editable (V11.2)

## Problema anterior
Cada categoría admitía una sola `image_url`. Su tarjeta decidía automáticamente `contain` o `cover` en función del slug; no había ajustes de recorte/zoom, y modificar el archivo original era la única alternativa.

## Experiencia nueva
Admin → Catálogo → Categorías → Editar → Imagen:

1. Subir una foto o seleccionarla de la biblioteca existente.
2. Ajustar **Rellenar tarjeta**, **Mostrar imagen completa** o **Automático**.
3. Arrastrar directamente sobre la vista previa o usar los sliders horizontal y vertical.
4. Ajustar zoom entre 80 % y 180 %.
5. Restablecer encuadre si no convence.
6. Guardar y comprobar la categoría en Home.

La vista previa usa el mismo helper `categoryImagePresentation()` que la tarjeta de la tienda.

## Contrato de datos
Cuatro columnas adicionales, persistidas en `categories`:

| columna | Tipo | valor predeterminado |
| --- | --- | --- |
| `image_position_x` | TINYINT UNSIGNED | 50 |
| `image_position_y` | TINYINT UNSIGNED | 50 |
| `image_zoom` | DECIMAL(3,2) | 1.00 |
| `image_fit` | ENUM(auto,cover,contain) | auto |

La actualización es **aditiva e idempotente**, ejecutada en el arranque por `ensureV9Schema()`. No hay DROP, TRUNCATE ni reinicio de imágenes o categorías.

Los valores se leen/escriben por `/api/admin/categories` y se entregan mediante `/api/categories` al escaparate. Los formularios validan coordenadas 0–100, zoom .8–1.8 y modo conocido.

## Cambio de fotografía al hover
El problema visible de la superposición provenía de renderizar una segunda foto `object-contain` encima de una fotografía principal distinta, dejando visible la imagen inferior en los bordes. V11.2 elimina la fotografía secundaria durante hover. Una sola imagen es la fuente de verdad de cada ProductCard; sólo aparece el indicativo no interactivo "Ver detalles".

## Identidad visual
La Home usa una secuencia de secciones con oliva, salvia, arena y mostaza tenues, distinguiendo las marcas. La fotografía de cada producto conserva su fondo auténtico, sin overlays ni bordes extraños. Las animaciones se limitan a pequeñas respuestas hover y respetan reduced-motion.

## QA
- Verificar fotos verticales, cuadradas y horizontales, ambas marcas.
- Comprobar el encuadre después de guardar, cerrar el editor y recargar.
- Probar default `auto` en categorías preexistentes.
- Probar zoom 80%, 100%, 180%, coordenadas 0,50,100.
- Comprobar estado sin imagen propia (assets del catálogo).
- Comprobar guardado con rol `content.manage`; no se deben modificar imágenes de productos ni variantes.
- Reproducir hover con la imagen de Mate Scaloneta: debe haber un solo elemento IMG en la card antes, durante y después del hover.
- Verificar mobile 320–430px: sin scroll horizontal ni controles diminutos.

**No se ejecutan seeds ni cambios destructivos en producción.** Probar en staging con copia de base antes de subir a la tienda.
