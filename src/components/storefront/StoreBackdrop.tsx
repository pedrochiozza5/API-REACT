import type { BrandId } from '@/lib/types';

/** A clean white page canvas, separate from hero and product photography. */
export function StoreBackdrop({ brand }: { brand: BrandId }) {
  return <div
    className={`storefront-backdrop ${brand === 'enyerbados' ? 'storefront-backdrop--yellow' : 'storefront-backdrop--green'}`}
    aria-hidden="true"
  />;
}
