import type { BrandId } from '@/lib/types';

type BackdropMode = 'neutral' | 'coastal';

/**
 * Reuses the *actual* hero photographs as the visual atmosphere.
 * The hero keeps ownership of LCP priority; this decorative copy is low-priority
 * and has no event listeners, continuous animation, or extra downloads per card.
 */
export function StoreBackdrop({
  brand, mode = 'neutral',
}: { brand: BrandId; mode?: BackdropMode }) {
  const en = brand === 'enyerbados';

  return <div
    className={`storefront-backdrop ${en ? 'storefront-backdrop--yellow' : 'storefront-backdrop--green'} ${mode === 'coastal' ? 'storefront-backdrop--coastal' : ''}`}
    aria-hidden="true"
  >
    {mode === 'coastal' && <picture className="storefront-backdrop__picture">
      <source media="(max-width: 639px)" srcSet="/brand/hero-beach-mobile.webp" />
      <img
        className="storefront-backdrop__image"
        src="/brand/hero-beach.webp"
        alt=""
        loading="lazy"
        decoding="async"
        fetchPriority="low"
      />
    </picture>}
    <div className="storefront-backdrop__wash" />
    <div className="storefront-backdrop__ambient" />
  </div>;
}
