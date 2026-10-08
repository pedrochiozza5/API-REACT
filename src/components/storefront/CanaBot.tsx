import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Send, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { apiGet } from '@/lib/api';
import type { FaqItem } from '@/lib/types';

const quick = ['Envíos','Retiros','Pagos','Stock','Cómo comprar','Bien Amargos','Bien Yerbados','Hablar por WhatsApp'];
const normalize = (value:string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();

function scoreFaq(faq:FaqItem, input:string){
  const q=normalize(input); if(!q)return 0;
  const words=q.split(' ').filter(w=>w.length>2);
  const hay=normalize(`${faq.question} ${faq.keywords||''} ${faq.category}`);
  let score=hay.includes(q)?10:0;
  for(const word of words) if(hay.includes(word))score+=2;
  return score;
}

export function CanaBot(){
  const location=useLocation();
  const reduceMotion=useReducedMotion();
  const hidden=location.pathname.startsWith('/admin')||location.pathname==='/checkout';
  const productRoute=location.pathname.startsWith('/producto/');
  const[open,setOpen]=useState(()=>sessionStorage.getItem('cana-open')==='1');
  const[input,setInput]=useState('');
  const[answer,setAnswer]=useState<string|null>(null);
  const faqs=useQuery({queryKey:['faqs'],queryFn:()=>apiGet<FaqItem[]>('/api/faqs'),staleTime:5*60_000,enabled:!hidden});
  useEffect(()=>sessionStorage.setItem('cana-open',open?'1':'0'),[open]);
  const all=faqs.data||[];
  const whatsapp='https://wa.me/5492257410476';
  const categories=useMemo(()=>new Set(all.map(f=>normalize(f.category))),[all]);

  function ask(text:string){
    const clean=text.trim(); if(!clean)return;
    const ranked=all.map(f=>({f,score:scoreFaq(f,clean)})).sort((a,b)=>b.score-a.score);
    const found=ranked[0]?.score>=2?ranked[0].f:null;
    setAnswer(found?.answer||'No encontré esa respuesta. Si querés, escribinos por WhatsApp.');
    setInput('');
  }
  function quickAsk(label:string){
    if(label==='Hablar por WhatsApp'){window.open(whatsapp,'_blank','noopener,noreferrer');return;}
    const normalized=normalize(label);
    const exact=all.find(f=>normalize(f.category)===normalized)||all.find(f=>normalize(f.question).includes(normalized));
    if(exact) setAnswer(exact.answer);
    else ask(label);
  }
  if(hidden)return null;
  return <>
    <motion.button initial={reduceMotion?false:{opacity:0,scale:.92}} animate={{opacity:1,scale:1}} whileHover={reduceMotion?undefined:{scale:1.035}} whileTap={{scale:.97}} onClick={()=>setOpen(v=>!v)} className={`cana-launcher ${productRoute?'cana-launcher--product':''}`} aria-label="Abrir Cana, ayudante de ronda">
      <img src="/brand/cana.webp" alt="Cana" className="h-full w-full object-cover"/>
    </motion.button>
    <AnimatePresence>{open&&<motion.aside initial={reduceMotion?false:{opacity:0,y:14,scale:.985}} animate={{opacity:1,y:0,scale:1}} exit={reduceMotion?{opacity:0}:{opacity:0,y:10,scale:.99}} className={`cana-panel ${productRoute?'cana-panel--product':''}`}>
      <div className="flex items-center gap-3 border-b border-black/7 bg-[#153f2f] px-4 py-4 text-white"><img src="/brand/cana.webp" alt="" className="h-11 w-11 rounded-full border border-white/25 object-cover"/><div className="min-w-0 flex-1"><div className="text-sm font-black">Cana</div><div className="mt-0.5 text-[9px] font-bold text-white/55">Ayudante de ronda</div></div><button onClick={()=>setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-white/8" aria-label="Cerrar"><X size={16}/></button></div>
      <div className="max-h-[56vh] overflow-y-auto p-4"><div className="rounded-[18px] bg-black/[.035] p-3 text-xs font-semibold leading-relaxed text-black/62">Hola, soy Cana.<br/>¿En qué te doy una mano?</div>
        <div className="mt-3 flex flex-wrap gap-2">{quick.map(label=><button key={label} onClick={()=>quickAsk(label)} className="rounded-full border border-black/8 bg-white px-3 py-2 text-[9px] font-black text-black/55">{label}</button>)}</div>
        {answer&&<motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="mt-3 rounded-[18px] bg-[#e9dfcd] p-3 text-xs font-semibold leading-relaxed text-[#263127]">{answer}{answer.startsWith('No encontré')&&<a href={whatsapp} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-2 font-black text-[#164b36]"><MessageCircle size={14}/> Hablar por WhatsApp</a>}</motion.div>}
        <a href={whatsapp} target="_blank" rel="noreferrer" className="mt-3 flex items-center justify-center gap-2 rounded-[16px] border border-black/8 bg-white px-4 py-3 text-[10px] font-black"><MessageCircle size={14}/> Hablar por WhatsApp</a>
      </div>
      <form onSubmit={e=>{e.preventDefault();ask(input);}} className="flex gap-2 border-t border-black/7 p-3"><input value={input} onChange={e=>setInput(e.target.value)} placeholder="Escribí tu pregunta…" className="min-w-0 flex-1 rounded-[14px] border border-black/8 bg-white px-3 text-xs font-semibold outline-none"/><button className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#153f2f] text-white"><Send size={15}/></button></form>
    </motion.aside>}</AnimatePresence>
  </>;
}
