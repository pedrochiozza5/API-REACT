import type { Product, ProductVariant } from './types';

/** Variant media form a self-contained gallery; never mix another color's photos. */
export function productMediaUrls(
  product: Pick<Product, 'imageUrl' | 'images'>,
  variant?: Pick<ProductVariant, 'imageUrl' | 'images'> | null,
): string[] {
  const variantSources = [
    variant?.imageUrl,
    ...(variant?.images || []).map(image => image.imageUrl),
  ];
  const productSources = [
    product.imageUrl,
    ...(product.images || []).map(image => image.imageUrl),
  ];
  const unique = (sources: Array<string | null | undefined>) => {
    const seen = new Set<string>();
    return sources.reduce<string[]>((result, entry) => {
      const url = String(entry || '').trim();
      if (!url || seen.has(url)) return result;
      seen.add(url);
      result.push(url);
      return result;
    }, []);
  };
  const variantUrls = unique(variantSources);
  return variantUrls.length ? variantUrls : unique(productSources);
}
