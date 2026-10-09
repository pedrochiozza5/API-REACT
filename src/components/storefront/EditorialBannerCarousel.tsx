import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import type { BrandId } from '@/lib/types';
import { apiGet } from '@/lib/api';

type StoreSettings = { settings: Record<string, string> };

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
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start', skipSnaps: false });
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [inView, setInView] = useState(true);
  const carouselRoot = useRef<HTMLElement | null>(null);
  const timer = useRef<number | null>(null);

  const q = useQuery({
    queryKey: ['home-banners', brand],
    queryFn: ({ signal }) => apiGet<Banner[]>(`/api/banners?brand=${brand}`, signal),
    staleTime: 60_000,
  });

  const settings = useQuery({
    queryKey: ['store-settings'],
    queryFn: ({ signal }) => apiGet<StoreSettings>('/api/store-settings', signal),
    staleTime: 5 * 60_000,
  });
  // One full-width hero instead of two competing full-screen sections.
  const slides = useMemo(() => {
    const en = brand === 'enyerbados';
    const hero: Banner = {
      id: -100, brandId: brand,
      eyebrow: en ? 'Bien Yerbados · Mar de Ajó' : 'Bien Amargos · Mar de Ajó',
      title: settings.data?.settings?.[en ? 'hero_enyerbados' : 'hero_amargos'] ||
        (en ? 'Yerba con presencia.' : 'Tu próxima ronda empieza acá.'),
      subtitle: en ? 'Una selección para acompañar cada ronda.' : 'Mates y accesorios elegidos para compartir.',
      imageUrl: '/brand/hero-beach.webp',
      mobileImageUrl: '/brand/hero-beach-mobile.webp',
      ctaLabel: en ? 'Ver yerbas' : 'Ver catálogo',
      href: `/catalogo?brand=${brand}`, sortOrder: -1,
    };
    return [hero, ...(q.data?.length ? q.data : fallback)];
  }, [brand, q.data, settings.data]);

  const sync = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    sync();
    emblaApi.on('select', sync).on('reInit', sync);
    return () => {
      emblaApi.off('select', sync);
      emblaApi.off('reInit', sync);
    };
  }, [emblaApi, sync]);

  useEffect(() => {
    const node = carouselRoot.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(entries => setInView(entries.some(e => e.isIntersecting)), { threshold: .15 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!emblaApi || reduceMotion || hovered || !inView || document.hidden || slides.length < 2) return;
    timer.current = window.setInterval(() => emblaApi.scrollNext(), 5600);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [emblaApi, hovered, inView, reduceMotion, slides.length]);

  return <section
    ref={carouselRoot}
    className="relative w-full overflow-hidden bg-[#111713]"
    aria-label="Historias destacadas"
    onMouseEnter={() => setHovered(true)}
    onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setHovered(true)}
    onBlurCapture={() => setHovered(false)}
  >
    <div ref={emblaRef} className="overflow-hidden">
      <div className="flex touch-pan-y">
        {slides.map((slide, index) => <article key={slide.id} className="relative min-w-0 flex-[0_0_100%]" style={{
          '--banner-position-desktop': slide.objectPositionDesktop || '50% 50%',
          '--banner-position-mobile': slide.objectPositionMobile || slide.objectPositionDesktop || '50% 50%',
        } as CSSProperties}>
          <div className="relative h-[66svh] min-h-[500px] overflow-hidden sm:h-[68svh] sm:min-h-[560px] lg:h-[72svh] lg:min-h-[620px] xl:min-h-[680px]">
            <picture>
              {slide.mobileImageUrl && <source media="(max-width: 639px)" srcSet={slide.mobileImageUrl}/>}
              <img
                src={slide.imageUrl}
                alt={slide.title}
                className="editorial-banner-image absolute inset-0 h-full w-full object-cover"
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={index === 0 ? 'high' : 'low'}
              />
            </picture>


            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,14,10,.48)_0%,rgba(8,14,10,.16)_40%,transparent_68%)] sm:bg-[linear-gradient(90deg,rgba(8,14,10,.42)_0%,rgba(8,14,10,.12)_38%,transparent_66%)]"/>
            <div className="absolute inset-x-0 bottom-0 h-[36%] bg-gradient-to-t from-black/38 via-black/10 to-transparent"/>

            <div className="relative z-10 flex h-full items-end px-5 pb-8 sm:px-10 sm:pb-12 lg:px-16 lg:pb-14 xl:px-20">
              <AnimatePresence mode="wait">
                {selected === index && <motion.div
                  key={`${slide.id}-${selected}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: reduceMotion ? 0 : .38, ease: [0.22, 1, 0.36, 1] }}
                  className="max-w-[700px] text-white"
                >
                  {slide.eyebrow && <div className="font-mono-ui text-[10px] font-semibold uppercase tracking-[.24em] text-white/64 sm:text-[11px]">{slide.eyebrow}</div>}
                  <h2 className="mt-2 max-w-[720px] text-[clamp(2.4rem,5.2vw,5.8rem)] font-black leading-[.9] tracking-[-.06em]">{slide.title}</h2>
                  {slide.subtitle && <p className="mt-3 max-w-xl text-[13px] font-semibold leading-relaxed text-white/78 sm:text-[15px]">{slide.subtitle}</p>}
                  {slide.ctaLabel && slide.href && <Link
                    to={slide.href}
                    className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-[14px] bg-[#f7f3e9] px-5 text-[11px] font-black text-[#163625] transition duration-200 hover:-translate-y-px hover:bg-white"
                  >{slide.ctaLabel}<ArrowRight size={15}/></Link>}
                </motion.div>}
              </AnimatePresence>
            </div>
          </div>
        </article>)}
      </div>
    </div>

    {slides.length > 1 && <>
      <button
        type="button"
        aria-label="Banner anterior"
        onClick={() => emblaApi?.scrollPrev()}
        className="absolute left-0 top-1/2 z-20 grid h-12 w-9 -translate-y-1/2 place-items-center bg-black/62 text-white transition hover:bg-black/78 sm:h-14 sm:w-11"
      ><ArrowLeft size={18}/></button>

      <button
        type="button"
        aria-label="Banner siguiente"
        onClick={() => emblaApi?.scrollNext()}
        className="absolute right-0 top-1/2 z-20 grid h-12 w-9 -translate-y-1/2 place-items-center bg-black/62 text-white transition hover:bg-black/78 sm:h-14 sm:w-11"
      ><ArrowRight size={18}/></button>

      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/28 px-2.5 py-2 backdrop-blur-sm sm:bottom-4">
        {slides.map((slide, index) => <button
          type="button"
          key={slide.id}
          onClick={() => emblaApi?.scrollTo(index)}
          aria-label={`Ir al banner ${index + 1}`}
          className={`h-1.5 rounded-full transition-all duration-200 ${selected === index ? 'w-7 bg-white' : 'w-1.5 bg-white/48 hover:bg-white/72'}`}
        />)}
      </div>
    </>}
  </section>;
}
