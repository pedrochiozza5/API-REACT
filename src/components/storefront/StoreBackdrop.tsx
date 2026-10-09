import type { BrandId } from '@/lib/types';

export function StoreBackdrop({ brand }: { brand: BrandId }) {
  const en = brand === 'enyerbados';

  return <div
    className={`storefront-backdrop ${en ? 'storefront-backdrop--yellow' : 'storefront-backdrop--green'}`}
    aria-hidden="true"
  >
    <div className="storefront-backdrop__wash" />
    <div className="storefront-backdrop__ambient" />
  </div>;
}
