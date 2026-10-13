# V11 — Auditoría y refino del administrador

## Situación inicial

`AdminProductEditor.tsx` concentra modelo, mutaciones, navegación, galerías, variantes, SEO y vista previa. La galería de variantes usaba botones de 24px y dependientes de `hover`, lo que dificultaba edición en móviles y ocultaba acciones críticas. `AdminMedia.tsx` habilitaba «Eliminar» mientras la consulta de referencias aún no había terminado (`usageCount=0` por defecto). Los drawers eran manuales sin gestión de foco consistente.

## Aplicado

- Nuevo `AdminVariantGallery`: una sola UI reutilizable para galerías de producto y variantes, con botones persistentes para «Hacer principal», «Mover antes», «Mover después», «Desasociar» y carga múltiple. Desasociar **no borra el archivo**.
- Galería principal y variante usan la misma lógica visual; más información en texto accesible.
- En `AdminMedia` la opción de eliminación queda bloqueada hasta que `usage.isSuccess` confirme que los medios no están referenciados. Si el chequeo falla, se informa y permanece bloqueado.
- `AdminMedia` y el drawer de variantes usan Radix Dialog, con semántica de diálogo, gestión de foco, Escape y overlay.
- Navegación/editor/inputs: etiquetas más grandes, contraste mejorado, áreas táctiles de mayor tamaño y estado «cambios sin guardar» más visible.
- Al elegir imagen principal desde multimedia se retira su URL duplicada de la galería de la variante.
- Se conservan permisos existentes, endpoints, SQL y forma de payload para evitar migraciones de datos.

## Riesgos sin verificar

- Flujo administrador autenticado con staging DB real.
- Subida simultánea de imágenes y guardado a mitad de upload.
- Revisión de todos los módulos: pedidos, clientes, mayoristas, informes, auditoría y configuración siguen necesitando sesiones con datos reales.
- Pruebas de contraste de todas las pantallas y estados, no sólo acciones principales.
- Navegación por teclado del editor completo.

## Próximo trabajo recomendado

Separar `AdminProductEditor` en secciones de datos claramente tipadas, extracción de mutaciones a hooks y pruebas de integración que validen el guardado parcial, edición concurrente y rollback de la última operación.
