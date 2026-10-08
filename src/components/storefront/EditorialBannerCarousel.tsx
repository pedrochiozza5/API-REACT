import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import type { BrandId } from '@/lib/types';
import { apiGet } from '@/lib/api';

type Banner = {
  id: number;
  brandId?: BrandId | null;
  eyebrow?: string | null;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  mobileImageUrl?: string | null;
  objectPositionDesktop?: string | null;
  objectPositionMobile?: string | null;
  ctaLabel?: string | null;
  href?: string | null;
  sortOrder: number;
};

const fallback: Banner[] = [
  { id: -1, brandId: null, eyebrow: 'Bien Amargos', title: 'La ronda, afuera.', subtitle: 'Productos reales. Momentos reales.', imageUrl: '/brand/chicos.webp', ctaLabel: 'Ver catálogo', href: '/catalogo', sortOrder: 10 },
  { id: -2, brandId: null, eyebrow: 'Colección', title: 'Todo para tu ronda.', subtitle: 'Mates, termos, bombillas y combos.', imageUrl: '/brand/repisa.webp', ctaLabel: 'Explorar', href: '/catalogo?brand=amargos', sortOrder: 20 },
  { id: -3, brandId: null, eyebrow: 'Bien Yerbados', title: 'La yerba también elige.', subtitle: 'Una selección para acompañar cada mate.', imageUrl: '/brand/yerbas-stock.webp', ctaLabel: 'Ver Yerbados', href: '/yerbados', sortOrder: 30 },
];

export function EditorialBannerCarousel({ brand }: { brand: BrandId }) {
  const reduceMotion = useReducedMotion();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center', skipSnaps: false });
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState(false);
  const timer = useRef<number | null>(null);
  const q = useQuery({ queryKey: ['home-banners', brand], queryFn: () => apiGet<Banner[]>(`/api/banners?brand=${brand}`), staleTime: 60_000 });
  const slides = useMemo(() => q.data?.length ? q.data : fallback, [q.data]);

  const sync = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    sync();
    emblaApi.on('select', sync).on('reInit', sync);
    return () => { emblaApi.off('select', sync).off('reInit', sync); };
  }, [emblaApi, sync]);

  useEffect(() => {
    if (!emblaApi || reduceMotion || hovered || slides.length < 2) return;
    timer.current = window.setInterval(() => emblaApi.scrollNext(), 5200);
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, [emblaApi, hovered, reduceMotion, slides.length]);

  const go = (index: number) => emblaApi?.scrollTo(index);

  return (
    <section className="relative px-3 py-5 sm:px-5 lg:px-8 lg:py-8" aria-label="Historias destacadas">
      <div
        className="relative mx-auto max-w-[1640px] overflow-hidden rounded-[30px] border border-white/45 bg-black/10 shadow-[0_32px_90px_rgba(8,24,15,.16)] sm:rounded-[40px]"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setHovered(true)}
        onBlurCapture={() => setHovered(false)}
      >
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex touch-pan-y">
            {slides.map((slide, index) => (
              <article key={slide.id} data-banner-id={slide.id} className="relative min-w-0 flex-[0_0_100%]">
                <div className="relative aspect-[4/5] min-h-[520px] overflow-hidden sm:aspect-[16/8.2] sm:min-h-[560px] lg:aspect-[2.25/1] lg:min-h-[600px]">
                  <picture>
                    {slide.mobileImageUrl && <source media="(max-width: 639px)" srcSet={slide.mobileImageUrl}/>} 
                    <motion.img
                      src={slide.imageUrl}
                      alt={slide.title}
                      className="absolute inset-0 h-full w-full object-cover"
                      style={{ objectPosition: slide.objectPositionDesktop || '50% 50%' }}
                      initial={false}
                      animate={{ scale: selected === index && !reduceMotion ? 1.025 : 1 }}
                      transition={{ duration: 6.2, ease: [0.22, 1, 0.36, 1] }}
                      loading={index === 0 ? 'eager' : 'lazy'}
                    />
                  </picture>
                  {slide.mobileImageUrl && <style>{`@media (max-width:639px){[data-banner-id="${slide.id}"] img{object-position:${slide.objectPositionMobile || '50% 50%'} !important;}}`}</style>}
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,20,13,.70)_0%,rgba(7,20,13,.38)_33%,rgba(7,20,13,.08)_62%,rgba(7,20,13,.20)_100%)] sm:bg-[linear-gradient(90deg,rgba(7,20,13,.66)_0%,rgba(7,20,13,.34)_34%,rgba(7,20,13,.06)_67%,rgba(7,20,13,.18)_100%)]" />
                  <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-black/48 via-black/12 to-transparent" />

                  <div className="relative z-10 flex h-full items-end px-6 pb-8 sm:px-10 sm:pb-10 lg:px-14 lg:pb-14 xl:px-16">
                    <AnimatePresence mode="wait">
                      {selected === index && (
                        <motion.div
                          key={`${slide.id}-${selected}`}
                          initial={{ opacity: 0, y: 24 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: reduceMotion ? 0 : .55, ease: [0.22, 1, 0.36, 1] }}
                          className="max-w-[760px] text-white"
                        >
                          {slide.eyebrow && <div className="font-mono-ui text-[8px] font-semibold uppercase tracking-[.25em] text-white/65 sm:text-[9px]">{slide.eyebrow}</div>}
                          <h2 className="mt-3 max-w-[760px] text-[clamp(2.7rem,6vw,6.3rem)] font-black leading-[.88] tracking-[-.068em]">{slide.title}</h2>
                          {slide.subtitle && <p className="mt-4 max-w-xl text-[13px] font-semibold leading-relaxed text-white/72 sm:text-[15px]">{slide.subtitle}</p>}
                          {slide.ctaLabel && slide.href && (
                            <Link to={slide.href} className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-[#f7f3e9] px-5 text-[11px] font-black text-[#163625] shadow-[0_14px_38px_rgba(0,0,0,.14)] transition hover:-translate-y-0.5 hover:bg-white">
                              {slide.ctaLabel}<ArrowRight size={15}/>
                            </Link>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {slides.length > 1 && <>
          <div className="absolute right-4 top-4 z-20 hidden gap-2 sm:flex lg:right-6 lg:top-6">
            <button aria-label="Banner anterior" onClick={() => emblaApi?.scrollPrev()} className="grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-black/20 text-white backdrop-blur-xl transition hover:bg-black/35"><ArrowLeft size={17}/></button>
            <button aria-label="Banner siguiente" onClick={() => emblaApi?.scrollNext()} className="grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-black/20 text-white backdrop-blur-xl transition hover:bg-black/35"><ArrowRight size={17}/></button>
          </div>

          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-full border border-white/20 bg-black/22 px-3 py-2 backdrop-blur-xl sm:bottom-6 sm:right-6">
            {slides.map((slide, index) => (
              <button key={slide.id} onClick={() => go(index)} aria-label={`Ir al banner ${index + 1}`} className="group relative h-2.5 w-8 overflow-hidden rounded-full bg-white/20">
                <span className={`absolute inset-y-0 left-0 rounded-full bg-white transition-all duration-300 ${selected === index ? 'w-full' : 'w-0 group-hover:w-1/2'}`} />
              </button>
            ))}
          </div>

          {!reduceMotion && !hovered && (
            <motion.div key={selected} className="absolute bottom-0 left-0 z-20 h-[3px] bg-white/65" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 5.2, ease: 'linear' }} />
          )}
        </>}
      </div>
    </section>
  );
}
