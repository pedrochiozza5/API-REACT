import { ArrowUpRight, MapPin } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import type { BrandId } from '@/lib/types';

/** A calm visual bridge from the full-width beach hero to the catalog.
 * All content remains visible with reduced motion / JS disabled animations. */
export function CoastalInterlude({ brand }: { brand: BrandId }) {
  const reduced = useReducedMotion();
  const yerbados = brand === 'enyerbados';

  return <section className={`coastal-interlude ${yerbados ? 'coastal-interlude--yellow' : ''}`} aria-label="La ronda">
    <motion.div
      initial={reduced ? false : { opacity: .9, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: .25 }}
      transition={{ duration: reduced ? 0 : .48, ease: [0.22, 1, 0.36, 1] }}
      className="coastal-interlude__inner"
    >
      <div className="coastal-interlude__eyebrow"><MapPin size={14} aria-hidden="true"/> Mar de Ajó · Argentina</div>
      <h2>{yerbados ? 'Un buen mate merece una buena yerba.' : 'Un lugar. Mil formas de compartir.'}</h2>
      <div className="coastal-interlude__lower">
        <p>{yerbados ? 'Elegí la yerba de tu próxima ronda.' : 'El espíritu de la costa, en cada ronda.'}</p>
        <Link to={`/catalogo?brand=${brand}`} className="coastal-interlude__link">
          Descubrí la colección <ArrowUpRight size={16} aria-hidden="true"/>
        </Link>
      </div>
    </motion.div>
  </section>;
}
