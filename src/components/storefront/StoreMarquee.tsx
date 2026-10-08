import { BrandGlyph } from './BrandGlyph';
import type { BrandId } from '@/lib/types';

export function StoreMarquee({brand}:{brand:BrandId}){
  const en=brand==='enyerbados'; const items=en?['Yerbas','Blends','Ronda','Mar de Ajó','Envíos al país']:['Mates','Bombillas','Termos','Ronda','Mar de Ajó'];
  return <div className="relative z-10 -mt-3 px-3 sm:px-5 lg:px-8"><div className={`mx-auto flex max-w-[1640px] items-center gap-6 overflow-hidden rounded-[20px] border px-5 py-3.5 shadow-[0_16px_45px_rgba(8,18,12,.13)] backdrop-blur-xl ${en?'border-[#d7c6ad]/30 bg-[#d7c6ad]/92 text-[#17311f]':'border-white/18 bg-[#103f2f]/92 text-white'}`}><BrandGlyph kind={en?'yerba':'mate'} className="h-5 w-5 shrink-0 opacity-80"/><div className="marquee-track flex min-w-max items-center gap-7">{[...items,...items].map((item,i)=><span key={`${item}-${i}`} className="flex items-center gap-7 font-mono-ui text-[8px] font-bold uppercase tracking-[.2em] opacity-70">{item}<i className="h-1 w-1 rounded-full bg-current opacity-35"/></span>)}</div></div></div>
}
