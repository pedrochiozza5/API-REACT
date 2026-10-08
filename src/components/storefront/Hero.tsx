import { ArrowDown, ArrowRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import type { BrandId } from '@/lib/types';
import { BrandGlyph } from './BrandGlyph';
import { apiGet } from '@/lib/api';
import { Magnet } from '@/components/motion/Magnet';

type StoreSettings={settings:Record<string,string>};
const defaults={amargos:{eyebrow:'Bien Amargos · Mar de Ajó',title:'Tu próxima ronda empieza acá.',body:'Mates, bombillas, termos, canastas, combos y accesorios elegidos con personalidad.',cta:'Ver catálogo',other:'Explorar Yerbados'},enyerbados:{eyebrow:'Bien Yerbados · Mar de Ajó',title:'Yerba con presencia.',body:'Una selección para acompañar cada ronda.',cta:'Ver yerbas',other:'Explorar Amargos'}};

export function Hero({brand}:{brand:BrandId}){
  const en=brand==='enyerbados'; const c=defaults[brand]; const settings=useQuery({queryKey:['store-settings'],queryFn:()=>apiGet<StoreSettings>('/api/store-settings'),staleTime:5*60_000});
  const reduce=useReducedMotion(); const title=settings.data?.settings?.[en?'hero_enyerbados':'hero_amargos']||c.title; const {scrollY}=useScroll(); const y=useTransform(scrollY,[0,700],[0,reduce?0:30]);
  return <section className="hero-continuous relative min-h-[100svh] overflow-hidden"><div className="hero-local-scrim absolute inset-0"/>{en&&<div className="absolute inset-0 bg-[#c8b79f]/[.075] mix-blend-color"/>}
    <motion.div style={{y}} className="pointer-events-none absolute right-[2vw] top-[22vh] hidden lg:block"><BrandGlyph kind={en?'yerba':'mate'} className={`h-[330px] w-[330px] ${en?'text-[#735d00]/[.10]':'text-[#103526]/[.10]'}`}/></motion.div>
    <div className="relative mx-auto flex min-h-[100svh] max-w-[1700px] items-center px-5 pb-24 pt-28 sm:px-8 sm:pt-36 lg:px-16 lg:pt-40 2xl:px-20"><div className="w-full max-w-[1050px] pt-[2vh] lg:pt-0">
      <motion.div initial={reduce?false:{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.08,duration:reduce?0:.46}} className="inline-flex items-center gap-2.5 rounded-full border border-white/45 bg-[#f8f2e7]/80 px-3.5 py-2 font-mono-ui text-[8px] font-semibold uppercase tracking-[.24em] text-[#153728]/72 shadow-sm backdrop-blur-sm"><BrandGlyph kind={en?'yerba':'mate'} className="h-4 w-4"/>{c.eyebrow}</motion.div>
      <motion.h1 initial={reduce?false:{opacity:0,y:26}} animate={{opacity:1,y:0}} transition={{delay:.14,duration:reduce?0:.7,ease:[.22,1,.36,1]}} className="mt-5 max-w-[1000px] text-[clamp(4.15rem,9vw,10rem)] font-black leading-[.8] tracking-[-.078em] text-[#103526] drop-shadow-[0_2px_15px_rgba(247,241,229,.22)]">{title}</motion.h1>
      <motion.div initial={reduce?false:{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.28,duration:reduce?0:.54}} className="mt-7 flex max-w-2xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="max-w-xl text-[15px] font-bold leading-relaxed text-[#14271d]/70 sm:text-[17px]">{c.body}</p><div className="mt-6 flex flex-wrap gap-3"><Magnet><Link to={`/catalogo?brand=${brand}`} className="hero-primary-cta">{c.cta}<ArrowRight size={16}/></Link></Magnet><Magnet strength={5}><Link to={en?'/':'/yerbados'} className="hero-secondary-cta">{c.other}<ArrowRight size={16}/></Link></Magnet></div></div><div className="hidden shrink-0 items-center gap-2 rounded-full border border-white/35 bg-[#f8f2e7]/65 px-4 py-3 text-[10px] font-black text-[#17311f]/65 backdrop-blur-sm sm:flex"><MapPin size={14}/> Mar de Ajó</div></motion.div>
    </div></div>
    <a href="#favoritos" aria-label="Bajar a favoritos" className="absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-white/35 bg-black/10 px-4 py-2.5 font-mono-ui text-[8px] uppercase tracking-[.18em] text-white/82 backdrop-blur-sm sm:flex">Descubrir <ArrowDown size={13}/></a><div className="hero-bottom-blend pointer-events-none absolute inset-x-0 bottom-0 h-40"/>
  </section>;
}
