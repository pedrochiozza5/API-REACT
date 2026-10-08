const legacyImagesBySku: Record<string, string> = {
  'BA-MAT-001': '/catalog/products/mate-scaloneta.webp',
  'BA-COM-001': '/catalog/products/combo-imperial.webp',
  'BA-COM-002': '/catalog/products/combo-completo.webp',
  'BA-MAT-002': '/catalog/products/mate-indio.webp',
  'BA-MAT-003': '/catalog/products/mate-maradona.webp',
  'BA-BOM-001': '/catalog/products/bombillon-pico-bronce.webp',
  'BA-BOM-002': '/catalog/products/bombillon-alpaca.webp',
  'BA-MAT-004': '/catalog/products/imperial-calabaza.webp',
};

export function legacyProductImage(product: { sku?: string | null; slug?: string | null }) {
  const sku = String(product.sku || '').trim();
  if (sku && legacyImagesBySku[sku]) return legacyImagesBySku[sku];
  const slug = String(product.slug || '').trim();
  return slug ? `/catalog/products/${slug}.webp` : null;
}
