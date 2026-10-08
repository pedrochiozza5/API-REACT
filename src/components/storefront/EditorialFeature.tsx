import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { BrandId } from '@/lib/types';
import { AnimatedContent } from '@/components/motion/AnimatedContent';

export function EditorialFeature({ brand }: { brand: BrandId }) {
  const en = brand === 'enyerbados';
  return (
    <section className="relative px-4 pb-16 pt-10 sm:px-6 lg:px-10 lg:pb-24 lg:pt-14">
      <AnimatedContent className="mx-auto max-w-[1580px] overflow-hidden rounded-[28px] border border-black/[.04] bg-[#f7f3ea] shadow-[0_24px_70px_rgba(12,31,20,.08)] sm:rounded-[34px]">
        <div className="grid lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative min-h-[360px] overflow-hidden sm:min-h-[470px] lg:min-h-[650px]">
            <img src="/brand/chicos.webp" alt="Bien Amargos compartiendo la ronda" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover object-[50%_58%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/42 via-transparent to-black/[.03]" />
            <div className="absolute bottom-5 left-5 rounded-full border border-white/20 bg-black/14 px-3.5 py-2 font-mono-ui text-[8px] uppercase tracking-[.22em] text-white/80 backdrop-blur-sm sm:bottom-7 sm:left-7">La ronda · Mar de Ajó</div>
          </div>

          <div className="relative flex min-h-[390px] flex-col justify-between overflow-hidden p-7 sm:min-h-[460px] sm:p-10 lg:min-h-[650px] lg:p-12 xl:p-14" style={{ background: en ? '#e1d3c0' : '#f7f3e9' }}>
            <div className="font-mono-ui text-[8px] uppercase tracking-[.22em] text-black/38">Nuestra esencia</div>
            <div className="relative z-10 max-w-[620px]">
              <h2 className="text-[clamp(3rem,8vw,4.6rem)] font-black leading-[.89] tracking-[-.065em]">Más que productos,<br />una forma de juntarse.</h2>
              <p className="mt-4 text-sm font-semibold text-black/54">Amigos, buenos mates y mejores momentos.</p>
              <Link to={`/catalogo?brand=${brand}`} className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-[#164b36] px-5 text-xs font-extrabold text-white shadow-[0_10px_25px_rgba(10,45,28,.16)] transition hover:-translate-y-px">Conocé la selección <ArrowRight size={15} /></Link>
            </div>

            <div className="pointer-events-none absolute right-[-24px] top-14 hidden w-[220px] rotate-[4deg] rounded-[22px] border-[7px] border-[#fffaf1] bg-[#fffaf1] shadow-[0_18px_50px_rgba(20,25,18,.16)] xl:block">
              <img src="/brand/repisa.webp" alt="" loading="lazy" decoding="async" className="aspect-[4/5] w-full rounded-[14px] object-cover object-[58%_50%]" />
            </div>
            <div className="pointer-events-none absolute right-[138px] top-[245px] hidden w-[160px] -rotate-[5deg] rounded-[18px] border-[6px] border-[#fffaf1] bg-[#fffaf1] shadow-[0_16px_40px_rgba(20,25,18,.14)] 2xl:block">
              <img src="/brand/varios.webp" alt="" loading="lazy" decoding="async" className="aspect-[4/5] w-full rounded-[11px] object-cover" />
            </div>
          </div>
        </div>
      </AnimatedContent>
    </section>
  );
}
