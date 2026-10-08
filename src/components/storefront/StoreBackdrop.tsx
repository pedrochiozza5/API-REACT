import { motion, useReducedMotion } from 'motion/react';
import type { BrandId } from '@/lib/types';

export function StoreBackdrop({ brand }: { brand: BrandId }) {
  const en = brand === 'enyerbados';
  const reduce = useReducedMotion();
  return (
    <div className="storefront-backdrop" aria-hidden="true">
      <picture>
        <source media="(max-width: 768px)" srcSet="/brand/hero-beach-mobile.webp" />
        <motion.img
          key={brand}
          initial={reduce ? false : { opacity: 0.88, scale: 1.02 }}
          animate={{ opacity: 1, scale: reduce ? 1 : 1.008 }}
          transition={{ duration: reduce ? 0 : .85, ease: [0.22, 1, 0.36, 1] }}
          src="/brand/hero-beach.webp"
          alt=""
          className="storefront-backdrop-image"
        />
      </picture>
      <div className={`storefront-backdrop-tint ${en ? 'storefront-backdrop-tint--yellow' : 'storefront-backdrop-tint--green'}`} />
      <div className="storefront-backdrop-grain" />
    </div>
  );
}
