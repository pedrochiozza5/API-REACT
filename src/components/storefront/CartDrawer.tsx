import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Minus, Plus, ShoppingBag, Sparkles, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { money } from '@/lib/format';
import { useCart } from '@/store/cart';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import type { CartItem } from '@/lib/types';
import { ProductImage } from './ProductImage';

export function CartDrawer() {
  const { items, open, setOpen, remove, setQty } = useCart();
  const navigate = useNavigate();
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const brands = new Set(items.map((item) => item.brandId));
  const groups = [
    { id: 'amargos', label: 'Bien Amargos', items: items.filter(i=>i.brandId==='amargos') },
    { id: 'enyerbados', label: 'Bien Yerbados', items: items.filter(i=>i.brandId==='enyerbados') },
  ].filter(g=>g.items.length);

  function goCheckout() {
    setOpen(false);
    window.requestAnimationFrame(() => navigate('/checkout'));
  }
  function goProduct(item:CartItem){
    setOpen(false);
    window.requestAnimationFrame(()=>navigate(`/producto/${item.slug}`));
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="cart-sheet flex flex-col sm:max-w-[520px] overflow-hidden border-l border-white/35 bg-[rgba(246,241,231,.96)] backdrop-blur-2xl">
        <div className="relative overflow-hidden border-b border-black/8 px-5 pb-5 pt-6 pr-16 sm:px-7 sm:pb-6 sm:pt-7">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_20%_0%,rgba(22,75,54,.13),transparent_55%),radial-gradient(circle_at_85%_5%,rgba(215,198,173,.38),transparent_42%)]" />
          <div className="relative">
            <div className="mb-3 flex items-center gap-2 font-mono-ui text-[8px] font-bold uppercase tracking-[.2em] text-black/34"><Sparkles size={12}/> Tu ronda</div>
            <SheetTitle className="text-[30px] font-black leading-none tracking-[-.055em] sm:text-[34px]">Carrito</SheetTitle>
            <SheetDescription className="mt-2 text-xs font-semibold text-black/42">{count ? `${count} ${count===1?'producto':'productos'}${brands.size>1?' · dos marcas, un pedido':''}` : 'Elegí algo para arrancar la ronda'}</SheetDescription>
          </div>
        </div>

        <div className="hide-scrollbar flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {!items.length ? <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="grid min-h-[58vh] place-items-center text-center"><div className="max-w-[250px]">
            <motion.div animate={{y:[0,-5,0],rotate:[0,-2,0]}} transition={{duration:3.4,repeat:Infinity,ease:'easeInOut'}} className="mx-auto grid h-20 w-20 place-items-center rounded-[28px] bg-[#184936] text-white shadow-[0_18px_45px_rgba(12,58,37,.24)]"><ShoppingBag size={28}/></motion.div>
            <div className="mt-6 text-3xl font-black tracking-[-.05em]">La ronda está vacía.</div><p className="mt-2 text-xs font-semibold leading-relaxed text-black/40">Sumá un mate, una yerba o el producto que quieras.</p>
            <motion.button whileHover={{y:-2}} whileTap={{scale:.98}} onClick={()=>setOpen(false)} className="mt-5 rounded-full bg-[#171914] px-6 py-3.5 text-xs font-black text-white shadow-lg">Seguir mirando</motion.button>
          </div></motion.div> : <motion.div layout className="grid gap-6">
            {groups.map(group=><section key={group.id}>
              <div className="mb-2 flex items-center justify-between px-1"><div className="text-[9px] font-black uppercase tracking-[.16em] text-black/42">{group.label}</div><div className="text-[8px] font-bold text-black/30">{group.items.reduce((s,i)=>s+i.qty,0)} u.</div></div>
              <div className="grid gap-3"><AnimatePresence initial={false} mode="popLayout">{group.items.map(item=><motion.article layout key={item.key} initial={{opacity:0,x:20,scale:.98}} animate={{opacity:1,x:0,scale:1}} exit={{opacity:0,x:28,scale:.96}} transition={{type:'spring',stiffness:420,damping:34}} className="group grid grid-cols-[82px_1fr] gap-3 rounded-[24px] border border-white/70 bg-white/72 p-3 shadow-[0_10px_30px_rgba(15,35,22,.06)] backdrop-blur-xl">
                <button onClick={()=>goProduct(item)} className="relative aspect-square overflow-hidden rounded-[18px] bg-[#f5f2ea]" aria-label={`Ver ${item.name}`}><ProductImage src={item.imageUrl} alt={item.name} zoom={item.imageZoom ?? 1.08} positionX={item.imagePositionX ?? 50} positionY={item.imagePositionY ?? 50} blendMode={item.imageBlendMode ?? 'normal'} /></button>
                <div className="min-w-0 py-0.5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="line-clamp-2 text-sm font-black leading-tight tracking-[-.025em]">{item.name}</div>{item.variantValue&&<div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold text-black/42">{item.colorHex&&<span className="h-3.5 w-3.5 rounded-full border border-black/10 shadow-inner" style={{background:item.colorHex}}/>}{item.variantValue}</div>}<div className="mt-1 text-[8px] font-bold uppercase tracking-[.08em] text-black/25">{item.variantSku||item.sku}</div></div><motion.button whileTap={{scale:.86}} onClick={()=>remove(item.key)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-black/28 transition hover:bg-red-50 hover:text-red-600" aria-label={`Eliminar ${item.name}`}><Trash2 size={15}/></motion.button></div>
                <div className="mt-3 flex items-center justify-between gap-3"><div className="flex items-center rounded-full border border-black/[.06] bg-black/[.035] p-1"><motion.button whileTap={{scale:.84}} onClick={()=>setQty(item.key,item.qty-1)} className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-white" aria-label="Restar"><Minus size={12}/></motion.button><motion.span key={item.qty} initial={{scale:.72,opacity:.4}} animate={{scale:1,opacity:1}} className="min-w-8 text-center text-[11px] font-black">{item.qty}</motion.span><motion.button whileTap={{scale:.84}} onClick={()=>setQty(item.key,item.qty+1)} disabled={item.trackStock!==false&&item.stockQty>0&&item.qty>=item.stockQty} className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-white disabled:opacity-30" aria-label="Sumar"><Plus size={12}/></motion.button></div><div className="text-right"><div className="text-[8px] font-black uppercase tracking-[.12em] text-black/28">Subtotal</div><motion.div key={item.price*item.qty} initial={{y:4,opacity:.35}} animate={{y:0,opacity:1}} className="mt-0.5 text-sm font-black">{money(item.price*item.qty)}</motion.div></div></div>
              </div></motion.article>)}</AnimatePresence></div>
            </section>)}
          </motion.div>}
        </div>

        {items.length>0&&<div className="relative border-t border-black/8 bg-[rgba(250,247,239,.96)] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur-2xl sm:px-6 sm:pb-6 sm:pt-5">
          <div className="mb-4 rounded-[22px] border border-black/[.06] bg-white/60 px-4 py-3.5"><div className="flex items-center justify-between text-[10px] font-black text-black/38"><span>{count} {count===1?'unidad':'unidades'}</span><span>Pedido único</span></div><div className="mt-2 flex items-end justify-between"><span className="text-[11px] font-black uppercase tracking-[.12em] text-black/40">Total</span><motion.span key={total} initial={{scale:.94,opacity:.5}} animate={{scale:1,opacity:1}} className="text-[32px] font-black leading-none tracking-[-.055em]">{money(total)}</motion.span></div></div>
          <motion.button type="button" onClick={goCheckout} whileHover={{y:-2,scale:1.005}} whileTap={{scale:.985}} className="cart-checkout-cta group relative flex h-[62px] w-full items-center justify-between overflow-hidden rounded-[22px] bg-[#153f2f] px-5 text-left text-white shadow-[0_18px_42px_rgba(13,57,38,.24)]"><motion.span aria-hidden className="pointer-events-none absolute inset-y-0 -left-[55%] w-[45%] skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/18 to-transparent" animate={{x:['0%','360%']}} transition={{duration:2.8,repeat:Infinity,repeatDelay:1.2,ease:'easeInOut'}}/><span className="relative z-10"><span className="block text-[9px] font-bold uppercase tracking-[.16em] text-white/50">Último paso</span><span className="mt-0.5 block text-sm font-black tracking-[-.02em]">Finalizar pedido</span></span><span className="relative z-10 grid h-10 w-10 place-items-center rounded-full bg-white text-[#153f2f] transition-transform duration-300 group-hover:translate-x-1"><ArrowRight size={18}/></span></motion.button>
          <div className="mt-3 text-center text-[9px] font-semibold text-black/34">Confirmás los datos y seguimos por WhatsApp.</div>
        </div>}
      </SheetContent>
    </Sheet>
  );
}
