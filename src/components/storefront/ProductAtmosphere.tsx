import { ArrowUpRight, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import type { BrandId } from '@/lib/types';

/** Product-page visual pause; references the actual atmospheric beach image
 * behind the page, without duplicating the selected variant's photo. */
export function ProductAtmosphere({ brand }: { brand: BrandId }) {
  const reduced = useReducedMotion();
  return <section aria-label="Explorar la colección" className="product-atmosphere">
    <motion.div
      initial={reduced ? false : { opacity: .88, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: .3 }}
      transition={{ duration: reduced ? 0 : .42, ease: [0.22, 1, 0.36, 1] }}
      className="product-atmosphere__inner"
    >
      <div className="product-atmosphere__eyebrow"><Compass size={16} aria-hidden="true"/> Desde Mar de Ajó</div>
      <h2>La próxima ronda empieza con una elección.</h2>
      <Link className="product-atmosphere__link" to={`/catalogo?brand=${brand}`}>Seguir explorando <ArrowUpRight size={17} aria-hidden="true"/></Link>
    </motion.div>
  </section>;
}
