import type { Product, ProductVariant } from './types';

/**
 * Canonical media order shared by card and detail views:
 * selected variant cover, product cover, variant gallery, product gallery.
 * A repeated primary URL is not another slide.
 */
export function productMediaUrls(
  product: Pick<Product, 'imageUrl' | 'images'>,
  variant?: Pick<ProductVariant, 'imageUrl' | 'images'> | null,
): string[] {
  const urls = [
    variant?.imageUrl,
    product.imageUrl,
    ...(variant?.images || []).map(image => image.imageUrl),
    ...(product.images || []).map(image => image.imageUrl),
  ];
  const seen = new Set<string>();
  return urls.reduce<string[]>((result, value) => {
    const url = String(value || '').trim();
    if (!url || seen.has(url)) return result;
    seen.add(url);
    result.push(url);
    return result;
  }, []);
}
