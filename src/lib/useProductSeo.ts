import { useEffect } from 'react';
import type { Product } from '@/lib/types';

/**
 * Owns client navigation SEO and Product JSON-LD. Keep ProductPage focused
 * on purchase interactions. Server-side crawlers are handled by server/seo.ts.
 */
export function useProductSeo(product: Product | undefined) {
  useEffect(() => {
    if (!product) return;

    const brandName = product.brandId === 'amargos' ? 'Bien Amargos' : 'Bien Yerbados';
    const canonicalUrl = `https://bienamargos.com.ar/producto/${product.slug}`;
    const title = product.seoTitle || `${product.name} | ${brandName}`;
    const description = product.seoDescription || product.shortDescription || product.description || `${product.name} en ${brandName}.`;
    const absolute = (value?: string | null) => value ? new URL(value, 'https://bienamargos.com.ar').toString() : '';
    const image = absolute(product.imageUrl) || 'https://bienamargos.com.ar/brand/bien-amargos-mark.png';

    const ensureMeta = (selector: string, attrs: Record<string, string>) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement('meta');
        document.head.appendChild(element);
      }
      Object.entries(attrs).forEach(([key, value]) => element!.setAttribute(key, value));
      return element;
    };

    document.title = title;
    ensureMeta('meta[name="description"]', { name: 'description', content: description });
    ensureMeta('meta[name="robots"]', { name: 'robots', content: 'index,follow,max-image-preview:large' });
    ensureMeta('meta[property="og:title"]', { property: 'og:title', content: title });
    ensureMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    ensureMeta('meta[property="og:type"]', { property: 'og:type', content: 'product' });
    ensureMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    ensureMeta('meta[property="og:image"]', { property: 'og:image', content: image });
    ensureMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    ensureMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
    ensureMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
    ensureMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: image });

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    const activeVariants = (product.variants || []).filter(variant => Boolean(variant.active));
    const offer = (price: number, stock: number, track: boolean) => ({
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'ARS',
      price: Number(price),
      availability: !track || stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Bien Amargos' },
    });
    const brand = { '@type': 'Brand', name: brandName };
    const structuredImages = [product.imageUrl, ...(product.images || []).map(item => item.imageUrl)]
      .filter(Boolean)
      .map(value => absolute(String(value)));

    const structured = activeVariants.length
      ? {
          '@context': 'https://schema.org',
          '@type': 'ProductGroup',
          name: product.name,
          description,
          brand,
          url: canonicalUrl,
          productGroupID: String(product.sku || product.id),
          ...(structuredImages.length ? { image: structuredImages } : {}),
          hasVariant: activeVariants.map(variant => ({
            '@type': 'Product',
            name: `${product.name} — ${variant.value}`,
            sku: variant.sku,
            brand,
            url: canonicalUrl,
            ...((variant.imageUrl || product.imageUrl) ? { image: [absolute(variant.imageUrl || product.imageUrl)] } : {}),
            offers: offer(Number(variant.price ?? product.price), Number(variant.stockQty || 0), Boolean(variant.trackStock)),
          })),
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description,
          sku: product.sku,
          brand,
          url: canonicalUrl,
          ...(structuredImages.length ? { image: structuredImages } : {}),
          offers: offer(Number(product.price), Number(product.stockQty || 0), Boolean(product.trackStock)),
        };

    let script = document.getElementById('seo-jsonld') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'seo-jsonld';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.text = JSON.stringify(structured).replace(/</g, '\\u003c');
    return () => script?.remove();
  }, [product]);

 }
