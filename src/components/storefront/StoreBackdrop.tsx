import type { BrandId } from '@/lib/types';

export function StoreBackdrop({ brand }: { brand: BrandId }) {
  const en = brand === 'enyerbados';
  return <div
    className={`storefront-backdrop ${en ? 'storefront-backdrop--yellow' : 'storefront-backdrop--green'}`}
    aria-hidden="true"
  />;
}
