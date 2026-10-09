import { Check, ShoppingBag, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect } from 'react';
import { money } from '@/lib/format';
import { useCart } from '@/store/cart';
import { ProductImage } from './ProductImage';

export function CartPeek() {
  const reduceMotion = useReducedMotion();
  const items = useCart(state => state.items);
  const open = useCart(state => state.open);
  const peekKey = useCart(state => state.peekKey);
  const peekSeq = useCart(state => state.peekSeq);
  const setOpen = useCart(state => state.setOpen);
  const dismissPeek = useCart(state => state.dismissPeek);
  const item = items.find(entry => entry.key === peekKey) || null;

  useEffect(() => {
    if (!peekKey || open) return;
    const timer = window.setTimeout(dismissPeek, 2100);
    return () => window.clearTimeout(timer);
  }, [peekKey, peekSeq, open, dismissPeek]);

  return <AnimatePresence>
    {!open && item && <motion.aside
      key={peekSeq}
      initial={reduceMotion ? false : { opacity: 0, y: 14, scale: .985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: 8, scale: .99 }}
      transition={{ duration: reduceMotion ? 0 : .24, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-3 right-3 z-[95] mx-auto max-w-[410px] overflow-hidden rounded-[20px] border border-white/55 bg-[#fbf8f1]/96 shadow-[0_18px_60px_rgba(9,24,16,.18)] backdrop-blur-md sm:bottom-5 sm:left-auto sm:right-5 sm:mx-0"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 p-3.5">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[#174a36] text-white"><Check size={18}/></div>
        <div className="min-w-0 flex-1">
          <div className="text-[9px] font-black uppercase tracking-[.12em] text-[#197348]">Agregado a tu ronda</div>
          <div className="mt-0.5 truncate text-[12px] font-black text-[#172119]">{item.name}{item.variantValue ? ` · ${item.variantValue}` : ''}</div>
          <div className="mt-0.5 text-[10px] font-bold text-black/42">{money(item.price)} · {item.qty} u.</div>
        </div>
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[13px] bg-[#f0eadf]">
          <ProductImage src={item.imageUrl} alt="" zoom={item.imageZoom ?? 1.05} positionX={item.imagePositionX ?? 50} positionY={item.imagePositionY ?? 50} blendMode={item.imageBlendMode ?? 'normal'} />
        </div>
        <button type="button" onClick={dismissPeek} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-black/30 transition hover:bg-black/[.04] hover:text-black/60" aria-label="Cerrar confirmación"><X size={15}/></button>
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-11 w-full items-center justify-between border-t border-black/[.07] px-4 text-[10px] font-black text-[#173e2e] transition hover:bg-[#174a36]/[.04]"
      >
        <span className="inline-flex items-center gap-2"><ShoppingBag size={14}/> Ver carrito</span>
        <span>→</span>
      </button>
    </motion.aside>}
  </AnimatePresence>;
}
