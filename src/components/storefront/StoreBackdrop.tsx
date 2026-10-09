import type { BrandId } from '@/lib/types';

export function StoreBackdrop({ brand }: { brand: BrandId }) {
  const en = brand === 'enyerbados';

  return <div
    className={`storefront-backdrop ${en ? 'storefront-backdrop--yellow' : 'storefront-backdrop--green'}`}
    aria-hidden="true"
  >
    <picture className="storefront-backdrop__picture">
      <source media="(max-width: 768px)" srcSet="/brand/hero-beach-mobile.webp" />
      <img
        src="/brand/hero-beach.webp"
        alt=""
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        className="storefront-backdrop__image"
      />
    </picture>
    <div className="storefront-backdrop__wash" />
    <div className="storefront-backdrop__ambient" />
  </div>;
}
