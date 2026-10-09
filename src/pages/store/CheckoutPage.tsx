import { FormEvent, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, LoaderCircle, MapPin, MessageCircle, PackageOpen, ShieldCheck, Truck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Header } from '@/components/storefront/Header';
import { StoreBackdrop } from '@/components/storefront/StoreBackdrop';
import { apiSend } from '@/lib/api';
import { money } from '@/lib/format';
import { useCart } from '@/store/cart';
import { ProductImage } from '@/components/storefront/ProductImage';
import type { BrandId } from '@/lib/types';

type DoneOrder = { code: string; whatsappUrl: string; brand: BrandId };

export function CheckoutPage() {
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'shipping' | 'pickup'>('pickup');
  const [done, setDone] = useState<DoneOrder | null>(null);
  const brand: BrandId = items.some((i) => i.brandId === 'enyerbados') && !items.some((i) => i.brandId === 'amargos') ? 'enyerbados' : 'amargos';
  const activeBrand = done?.brand || brand;
  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.qty, 0), [items]);
  const count = useMemo(() => items.reduce((sum, item) => sum + item.qty, 0), [items]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!items.length || loading) return;
    const fd = new FormData(e.currentTarget);
    const phone = String(fd.get('customerPhone') || '').replace(/\D/g, '');
    if (phone.length < 8) {
      toast.error('Revisá el número de WhatsApp.');
      return;
    }

    setLoading(true);
    try {
      const result = await apiSend<{ order: { code: string }; whatsappUrl: string }>('/api/orders', 'POST', {
        customerName: fd.get('customerName'),
        customerPhone: fd.get('customerPhone'),
        customerEmail: fd.get('customerEmail'),
        deliveryType,
        address: fd.get('address'),
        notes: fd.get('notes'),
        items: items.map((i) => ({ productId: i.productId, variantId: i.variantId || undefined, qty: i.qty })),
      });
      setDone({ code: result.order.code, whatsappUrl: result.whatsappUrl, brand });
      clear();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success('Pedido generado. Stock reservado.');
    } catch (error: any) {
      toast.error(error.message || 'No pudimos generar el pedido.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <main className="storefront-page min-h-screen pt-[104px] sm:pt-[116px]">
        <StoreBackdrop brand={activeBrand} />
        <div className="storefront-content">
          <Header brand={activeBrand} solid hideMobileDock />
          <section className="mx-auto grid min-h-[74vh] max-w-3xl place-items-center px-4 py-10 text-center sm:px-5 sm:py-16">
            <motion.div initial={{ opacity: 0, y: 24, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 210, damping: 24 }} className="section-glass relative w-full overflow-hidden rounded-[36px] p-7 sm:rounded-[46px] sm:p-12">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_50%_0%,rgba(37,211,102,.16),transparent_62%)]" />
              <motion.div initial={{ scale: .4, rotate: -18 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 18, delay: .08 }} className="relative mx-auto grid h-20 w-20 place-items-center rounded-[28px] bg-[#174d35] text-white shadow-[0_18px_45px_rgba(10,45,28,.24)]">
                <CheckCircle2 size={35} />
              </motion.div>
              <div className="relative mt-6 font-mono-ui text-[9px] uppercase tracking-[.24em] text-black/38">Pedido {done.code}</div>
              <h1 className="relative mx-auto mt-3 max-w-2xl text-4xl font-black leading-[.92] tracking-[-.06em] sm:text-6xl">La ronda quedó reservada.</h1>
              <p className="relative mx-auto mt-5 max-w-lg text-sm font-semibold leading-relaxed text-black/48">Falta una sola cosa: abrir WhatsApp y confirmar entrega y pago.</p>
              <motion.a whileHover={{ y: -3, scale: 1.01 }} whileTap={{ scale: .985 }} href={done.whatsappUrl} target="_blank" rel="noreferrer" className="checkout-whatsapp-cta group relative mx-auto mt-8 flex h-[62px] max-w-sm items-center justify-between overflow-hidden rounded-[22px] bg-[#25D366] px-5 text-[#092d19] shadow-[0_20px_50px_rgba(37,211,102,.28)]">
                <span className="relative z-10 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#092d19] text-white"><MessageCircle size={19} /></span><span className="text-left"><span className="block text-[9px] font-black uppercase tracking-[.13em] opacity-55">Último paso</span><span className="block text-sm font-black">Confirmar por WhatsApp</span></span></span>
                <ArrowRight className="relative z-10 transition-transform group-hover:translate-x-1" size={19} />
              </motion.a>
              <button onClick={() => navigate(activeBrand === 'enyerbados' ? '/yerbados' : '/')} className="relative mt-5 text-xs font-bold text-black/42 transition hover:text-black">Volver a la tienda</button>
            </motion.div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="storefront-page min-h-screen pb-28 pt-[104px] sm:pb-0 sm:pt-[116px]">
      <StoreBackdrop brand={brand} />
      <div className="storefront-content">
        <Header brand={brand} solid hideMobileDock />
        <section className="px-3 pb-16 pt-5 sm:px-5 lg:px-8 lg:pb-24 lg:pt-8">
          <div className="section-glass mx-auto max-w-[1240px] rounded-[34px] p-4 sm:rounded-[42px] sm:p-7 lg:p-9">
            <div className="mb-5 flex items-center justify-between gap-3">
              <Link to={`/catalogo?brand=${brand}`} className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/50 px-3.5 py-2 text-xs font-bold text-black/52 backdrop-blur-md transition hover:bg-white"><ArrowLeft size={15} /> Seguir comprando</Link>
              <div className="hidden items-center gap-2 text-[9px] font-black uppercase tracking-[.12em] text-black/30 sm:flex"><span className="inline-flex items-center gap-1 text-[#174d35]"><Check size={13}/> Carrito</span><span>—</span><span className="text-black/65">Datos</span><span>—</span><span>WhatsApp</span></div>
            </div>

            {!items.length ? (
              <div className="grid min-h-[55vh] place-items-center rounded-[34px] border border-dashed border-black/15 bg-white/35 p-8 text-center backdrop-blur-md">
                <div><PackageOpen className="mx-auto" size={44} /><h1 className="mt-4 text-4xl font-black">No hay productos para confirmar.</h1><Link to="/catalogo" className="mt-5 inline-block rounded-full bg-[#171a16] px-5 py-3 text-sm font-bold text-white">Ir al catálogo</Link></div>
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-[1fr_430px]">
                <form id="checkout-form" onSubmit={submit} className="rounded-[32px] border border-white/55 bg-[#fbf8f1]/88 p-5 shadow-[0_22px_60px_rgba(18,34,23,.10)] backdrop-blur-xl sm:p-9">
                  <div className="font-mono-ui text-[9px] uppercase tracking-[.22em] text-black/38">Finalizar pedido</div>
                  <h1 className="mt-3 max-w-2xl text-[38px] font-black leading-[.92] tracking-[-.058em] sm:text-5xl">¿A nombre de quién armamos la ronda?</h1>
                  <p className="mt-3 max-w-xl text-xs font-semibold leading-relaxed text-black/40">Solo necesitamos los datos para coordinar. El pago se confirma por WhatsApp.</p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2 text-xs font-bold text-black/55">Nombre y apellido<input required name="customerName" autoComplete="name" className="checkout-input" placeholder="Tu nombre" /></label>
                    <label className="grid gap-2 text-xs font-bold text-black/55">WhatsApp<input required name="customerPhone" autoComplete="tel" inputMode="tel" className="checkout-input" placeholder="Ej. 2257 41-0476" /></label>
                    <label className="grid gap-2 text-xs font-bold text-black/55 sm:col-span-2">Email <span className="font-normal text-black/35">(opcional)</span><input name="customerEmail" type="email" autoComplete="email" className="checkout-input" placeholder="tu@email.com" /></label>
                  </div>

                  <div className="mt-7 text-xs font-bold text-black/55">¿Cómo lo recibís?</div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <motion.button whileTap={{ scale: .985 }} type="button" onClick={() => setDeliveryType('pickup')} className={`relative overflow-hidden rounded-[24px] border p-5 text-left transition ${deliveryType === 'pickup' ? 'border-[#174d35] bg-[#174d35] text-white shadow-lg' : 'border-black/10 bg-white/58 hover:bg-white/80'}`}>
                      <AnimatePresence>{deliveryType === 'pickup' && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute right-4 top-4 grid h-6 w-6 place-items-center rounded-full bg-white text-[#174d35]"><Check size={13}/></motion.span>}</AnimatePresence>
                      <MapPin size={20} /><div className="mt-3 text-sm font-black">Retiro coordinado</div><div className={`mt-1 text-xs leading-relaxed ${deliveryType === 'pickup' ? 'text-white/60' : 'text-black/45'}`}>Acordamos punto y horario.</div>
                    </motion.button>
                    <motion.button whileTap={{ scale: .985 }} type="button" onClick={() => setDeliveryType('shipping')} className={`relative overflow-hidden rounded-[24px] border p-5 text-left transition ${deliveryType === 'shipping' ? 'border-[#d7c6ad] bg-[#d7c6ad] text-[#17311f] shadow-lg' : 'border-black/10 bg-white/58 hover:bg-white/80'}`}>
                      <AnimatePresence>{deliveryType === 'shipping' && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute right-4 top-4 grid h-6 w-6 place-items-center rounded-full bg-[#17311f] text-white"><Check size={13}/></motion.span>}</AnimatePresence>
                      <Truck size={20} /><div className="mt-3 text-sm font-black">Envío</div><div className={`mt-1 text-xs leading-relaxed ${deliveryType === 'shipping' ? 'text-[#17311f]/65' : 'text-black/45'}`}>Coordinamos costo y correo.</div>
                    </motion.button>
                  </div>

                  {deliveryType === 'shipping' ? (
                    <motion.label initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 grid gap-2 text-xs font-bold text-black/55">Dirección completa<input required name="address" autoComplete="street-address" className="checkout-input" placeholder="Calle, número, localidad y provincia" /></motion.label>
                  ) : <input type="hidden" name="address" value="" />}

                  <label className="mt-4 grid gap-2 text-xs font-bold text-black/55">Nota para el pedido <span className="font-normal text-black/35">(opcional)</span><textarea name="notes" rows={4} className="checkout-input resize-none" placeholder="Color preferido, referencia, consulta…" /></label>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={!loading ? { y: -2, scale: 1.004 } : undefined}
                    whileTap={!loading ? { scale: .988 } : undefined}
                    className="checkout-final-cta group relative mt-6 hidden h-[66px] w-full items-center justify-between overflow-hidden rounded-[22px] bg-[#153f2f] px-5 text-white shadow-[0_18px_44px_rgba(13,57,38,.22)] disabled:cursor-wait sm:flex"
                  >
                    <span className="relative z-10 flex items-center gap-3">{loading ? <LoaderCircle className="animate-spin" size={20}/> : <ShieldCheck size={20}/>}<span className="text-left"><span className="block text-[9px] font-bold uppercase tracking-[.15em] text-white/48">{loading ? 'Reservando stock' : 'Todo listo'}</span><span className="block text-sm font-black">{loading ? 'Generando pedido…' : 'Finalizar pedido'}</span></span></span>
                    <span className="relative z-10 flex items-center gap-3"><span className="text-sm font-black">{money(total)}</span><span className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#153f2f] transition-transform group-hover:translate-x-1"><ArrowRight size={18}/></span></span>
                  </motion.button>
                  <p className="mt-3 hidden text-center text-[10px] leading-relaxed text-black/38 sm:block">Al finalizar reservamos el stock y te damos el acceso directo a WhatsApp.</p>
                </form>

                <aside className="h-fit rounded-[32px] bg-[#171a16]/96 p-5 text-white shadow-[0_24px_70px_rgba(4,12,7,.26)] backdrop-blur-xl sm:p-7 lg:sticky lg:top-32">
                  <div className="flex items-center justify-between"><div className="font-mono-ui text-[9px] uppercase tracking-[.22em] text-white/40">Resumen</div><div className="rounded-full bg-white/8 px-2.5 py-1 text-[9px] font-black text-white/55">{count} u.</div></div>
                  <div className="mt-5 grid gap-3">
                    {items.map((item) => (
                      <motion.div layout key={item.key} className="flex gap-3 rounded-[20px] border border-white/[.055] bg-white/[.065] p-3">
                        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-[16px] bg-[#f2ecdf] text-center text-[8px] font-bold text-black">
                          {item.imageUrl ? <ProductImage src={item.imageUrl} alt={item.name} zoom={item.imageZoom??1.08} positionX={item.imagePositionX??50} positionY={item.imagePositionY??50} blendMode={item.imageBlendMode??'normal'} /> : item.qty + '×'}
                        </div>
                        <div className="min-w-0 flex-1"><div className="text-xs font-black leading-tight">{item.name}</div><div className="mt-1 text-[10px] text-white/38">{item.variantValue ? `${item.variantValue} · ` : ''}{item.qty} × {money(item.price)}</div></div>
                        <div className="text-xs font-black">{money(item.price * item.qty)}</div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-5 border-t border-white/12 pt-5">
                    <div className="flex items-center justify-between text-sm text-white/48"><span>Productos</span><span>{count}</span></div>
                    <div className="mt-3 flex items-end justify-between"><span className="text-sm font-bold">Total</span><span className="text-3xl font-black tracking-[-.045em]">{money(total)}</span></div>
                  </div>
                  <div className="mt-5 flex items-center gap-2 rounded-[18px] bg-white/[.055] px-3.5 py-3 text-[10px] font-semibold leading-relaxed text-white/42"><ShieldCheck size={16} className="shrink-0 text-[#d7c6ad]"/> El stock se reserva cuando generás el pedido.</div>
                </aside>
              </div>
            )}
          </div>
        </section>
      </div>

      {items.length > 0 && (
        <div className="fixed inset-x-3 bottom-3 z-[55] sm:hidden">
          <motion.button
            form="checkout-form"
            type="submit"
            disabled={loading}
            whileTap={!loading ? { scale: .985 } : undefined}
            className="checkout-mobile-final relative flex h-[68px] w-full items-center justify-between overflow-hidden rounded-[23px] border border-white/18 bg-[#153f2f] px-4 text-white shadow-[0_20px_60px_rgba(5,25,15,.32)] disabled:cursor-wait"
          >
            <span className="relative z-10 flex items-center gap-3">{loading ? <LoaderCircle className="animate-spin" size={20}/> : <MessageCircle size={20}/>}<span className="text-left"><span className="block text-[8px] font-bold uppercase tracking-[.14em] text-white/48">{loading ? 'Un segundo' : `${count} ${count === 1 ? 'producto' : 'productos'}`}</span><span className="block text-sm font-black">{loading ? 'Reservando…' : 'Finalizar pedido'}</span></span></span>
            <span className="relative z-10 flex items-center gap-2"><span className="text-sm font-black">{money(total)}</span><span className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#153f2f]"><ArrowRight size={18}/></span></span>
          </motion.button>
        </div>
      )}
    </main>
  );
}
