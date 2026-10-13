import useEmblaCarousel from 'embla-carousel-react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { BrandId, Product } from '@/lib/types';
import { ProductCard } from './ProductCard';
import { AnimatedContent } from '@/components/motion/AnimatedContent';

export function FeaturedCarousel({ brand, products, loading }: { brand: BrandId; products: Product[]; loading?: boolean }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps', dragFree: false });
  const single = !loading && products.length === 1;
  if (!loading && products.length === 0) return null;

  return (
    <section id="favoritos" className="relative px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
      <div className="mx-auto max-w-[1580px]">
        <AnimatedContent className="mb-7 flex items-end justify-between gap-5 sm:mb-9">
          <div><div className="font-mono-ui text-[11px] font-semibold uppercase tracking-[.22em] text-black/40">Destacados</div><h2 className="mt-2 text-4xl font-black tracking-[-.06em] text-[#15231a] sm:text-5xl lg:text-[58px]">Favoritos de la ronda.</h2></div>
          <p className="hidden text-xs font-semibold text-[#526257] sm:block">Arrastrá para descubrir más productos</p>
        </AnimatedContent>
        <div ref={emblaRef} className="overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-[#174a36]/55 focus-visible:ring-offset-4" role="region" aria-roledescription="carrusel" aria-label="Productos destacados" tabIndex={0} onKeyDown={event => {
          if (event.target !== event.currentTarget) return;
          if (event.key === 'ArrowRight') { event.preventDefault(); emblaApi?.scrollNext(); }
          if (event.key === 'ArrowLeft') { event.preventDefault(); emblaApi?.scrollPrev(); }
        }}>
          <div className={`-ml-3 flex ${single ? 'justify-center' : ''}`}>
            {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="min-w-0 flex-[0_0_82%] pl-3 sm:flex-[0_0_48%] md:flex-[0_0_32%] lg:flex-[0_0_25%] xl:flex-[0_0_20%]"><div className="aspect-[.72] animate-pulse rounded-[28px] bg-white/55" /></div>) : products.map((p) => <div key={p.id} className={`${single ? 'flex-[0_0_100%] max-w-[430px]' : 'flex-[0_0_82%] sm:flex-[0_0_48%] md:flex-[0_0_32%] lg:flex-[0_0_25%] xl:flex-[0_0_20%]'} min-w-0 pl-3`}><ProductCard product={p} /></div>)}
          </div>
        </div>
        <div className="mt-8 flex items-center justify-between gap-3"><Link to={`/catalogo?brand=${brand}`} className="inline-flex items-center gap-2 rounded-full border border-black/9 bg-white/70 px-4 py-2.5 text-xs font-black transition hover:bg-white">Catálogo completo <ArrowRight size={14} /></Link><div className="text-[11px] font-semibold text-[#526257] sm:hidden">Deslizá para explorar</div></div>
      </div>
    </section>
  );
}
