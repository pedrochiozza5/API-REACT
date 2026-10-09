import { ArrowRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import type { BrandId } from '@/lib/types';
import { BrandGlyph } from './BrandGlyph';
import { apiGet } from '@/lib/api';

type StoreSettings={settings:Record<string,string>};
const defaults={
  amargos:{
    eyebrow:'Bien Amargos · Mar de Ajó',
    title:'Tu próxima ronda empieza acá.',
    body:'Mates, bombillas, termos, canastas, combos y accesorios elegidos con personalidad.',
    cta:'Ver catálogo',
    other:'Explorar Yerbados',
  },
  enyerbados:{
    eyebrow:'Bien Yerbados · Mar de Ajó',
    title:'Yerba con presencia.',
    body:'Una selección para acompañar cada ronda.',
    cta:'Ver yerbas',
    other:'Explorar Amargos',
  },
};

export function Hero({brand}:{brand:BrandId}) {
  const en=brand==='enyerbados';
  const reduce=useReducedMotion();
  const copy=defaults[brand];
  const settings=useQuery({
    queryKey:['store-settings'],
    queryFn:()=>apiGet<StoreSettings>('/api/store-settings'),
    staleTime:5*60_000,
  });
  const title=settings.data?.settings?.[en?'hero_enyerbados':'hero_amargos']||copy.title;

  return <section className="relative min-h-[92svh] overflow-hidden bg-[#d9d2c5] sm:min-h-[100svh]">
    <picture className="absolute inset-0">
      <source media="(max-width: 768px)" srcSet="/brand/hero-beach-mobile.webp"/>
      <img
        src="/brand/hero-beach.webp"
        alt=""
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="h-full w-full object-cover object-center"
      />
    </picture>
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_45%,rgba(248,244,235,.90)_0%,rgba(248,244,235,.72)_26%,rgba(248,244,235,.20)_52%,transparent_72%),linear-gradient(180deg,rgba(6,14,9,.04),rgba(6,14,9,.22))]"/>
    {en&&<div className="absolute inset-0 bg-[#c8b79f]/[.08] mix-blend-color"/>}

    <div className="relative mx-auto flex min-h-[92svh] max-w-[1700px] items-center px-5 pb-20 pt-28 sm:min-h-[100svh] sm:px-8 sm:pt-36 lg:px-16 lg:pt-40 2xl:px-20">
      <div className="w-full max-w-[980px]">
        <motion.div
          initial={reduce?false:{opacity:0,y:10}}
          animate={{opacity:1,y:0}}
          transition={{duration:reduce?0:.34}}
          className="inline-flex items-center gap-2.5 rounded-full border border-white/55 bg-[#f8f2e7]/88 px-3.5 py-2 font-mono-ui text-[8px] font-semibold uppercase tracking-[.22em] text-[#153728]/72 backdrop-blur-sm"
        ><BrandGlyph kind={en?'yerba':'mate'} className="h-4 w-4"/>{copy.eyebrow}</motion.div>

        <motion.h1
          initial={reduce?false:{opacity:0,y:18}}
          animate={{opacity:1,y:0}}
          transition={{delay:.06,duration:reduce?0:.5,ease:[.22,1,.36,1]}}
          className="mt-5 max-w-[950px] text-[clamp(3.8rem,8.6vw,9rem)] font-black leading-[.82] tracking-[-.075em] text-[#103526]"
        >{title}</motion.h1>

        <motion.div
          initial={reduce?false:{opacity:0,y:10}}
          animate={{opacity:1,y:0}}
          transition={{delay:.14,duration:reduce?0:.4}}
          className="mt-7 flex max-w-2xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="max-w-xl text-[15px] font-bold leading-relaxed text-[#14271d]/72 sm:text-[17px]">{copy.body}</p>
            <div className="mt-6 flex flex-col gap-3 min-[420px]:flex-row">
              <Link to={`/catalogo?brand=${brand}`} className="hero-primary-cta">{copy.cta}<ArrowRight size={16}/></Link>
              <Link to={en?'/':'/yerbados'} className="hero-secondary-cta">{copy.other}<ArrowRight size={16}/></Link>
            </div>
          </div>
          <div className="hidden shrink-0 items-center gap-2 rounded-full border border-white/40 bg-[#f8f2e7]/72 px-4 py-3 text-[10px] font-black text-[#17311f]/65 backdrop-blur-sm sm:flex"><MapPin size={14}/> Mar de Ajó</div>
        </motion.div>
      </div>
    </div>
  </section>;
}
