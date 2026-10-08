import { useEffect, useMemo, useState } from 'react';
import { Boxes, GalleryHorizontalEnd, Gauge, Globe2, Grid2X2, Images, MessageCircleQuestion, PackageSearch, Search, Settings, ShieldCheck, ShoppingBag, Users, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { useAdmin, type AdminPermission } from './AdminContext';

type StaticLink={label:string;path:string;icon:any;permission:AdminPermission};
const links:StaticLink[]=[
  {label:'Resumen',path:'/admin',icon:Gauge,permission:'dashboard.view'},
  {label:'Productos',path:'/admin/productos',icon:Boxes,permission:'products.view'},
  {label:'Categorías',path:'/admin/categorias',icon:Grid2X2,permission:'products.view'},
  {label:'Pedidos',path:'/admin/pedidos',icon:ShoppingBag,permission:'orders.view'},
  {label:'Inventario',path:'/admin/stock',icon:PackageSearch,permission:'inventory.view'},
  {label:'Clientes',path:'/admin/clientes',icon:Users,permission:'customers.view'},
  {label:'Carrusel',path:'/admin/carrusel',icon:GalleryHorizontalEnd,permission:'content.manage'},
  {label:'Multimedia',path:'/admin/multimedia',icon:Images,permission:'media.manage'},
  {label:'Preguntas frecuentes',path:'/admin/faqs',icon:MessageCircleQuestion,permission:'content.manage'},
  {label:'Materos por el mundo',path:'/admin/materos-por-el-mundo',icon:Globe2,permission:'materos.manage'},
  {label:'Auditoría',path:'/admin/auditoria',icon:ShieldCheck,permission:'audit.view'},
  {label:'Configuración',path:'/admin/configuracion',icon:Settings,permission:'settings.manage'},
];
type SearchData={products:{id:number;name:string;sku:string;brandId:string}[];orders:{id:number;code:string;customerName:string;status:string}[];customers:{phone:string;name:string}[]};

export function AdminCommandPalette({open,onOpenChange}:{open:boolean;onOpenChange:(open:boolean)=>void}){
  const[query,setQuery]=useState('');const[debounced,setDebounced]=useState('');const navigate=useNavigate();const{can,brand}=useAdmin();
  useEffect(()=>{const handler=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();onOpenChange(!open);}if(e.key==='Escape')onOpenChange(false);};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);},[open,onOpenChange]);
  useEffect(()=>{if(!open){setQuery('');setDebounced('');return;}const t=window.setTimeout(()=>setDebounced(query.trim()),280);return()=>window.clearTimeout(t);},[query,open]);
  const visible=useMemo(()=>links.filter(x=>can(x.permission)),[can]);
  const filtered=useMemo(()=>visible.filter(x=>x.label.toLowerCase().includes(query.toLowerCase())),[visible,query]);
  const remote=useQuery({queryKey:['admin-global-search',debounced],queryFn:()=>apiGet<SearchData>(`/api/admin/search?q=${encodeURIComponent(debounced)}${brand==='all'?'':`&brand=${brand}`}`),enabled:open&&debounced.length>=2,staleTime:15_000});
  const go=(path:string)=>{navigate(path);onOpenChange(false);};
  if(!open)return null;
  return <div className="fixed inset-0 z-[200] flex items-start justify-center bg-[#07110c]/55 px-4 pt-[10vh] backdrop-blur-md" onMouseDown={()=>onOpenChange(false)}>
    <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/10 bg-[#111814] text-white shadow-[0_32px_120px_rgba(0,0,0,.45)]" onMouseDown={e=>e.stopPropagation()}>
      <div className="flex items-center gap-3 border-b border-white/8 px-5 py-4"><Search size={18} className="text-white/35"/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Producto, pedido, cliente o sección…" className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-white/25"/><span className="rounded-lg bg-white/8 px-2 py-1 font-mono-ui text-[9px] text-white/35">ESC</span><button onClick={()=>onOpenChange(false)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/8"><X size={16}/></button></div>
      <div className="max-h-[520px] overflow-y-auto p-2">
        {filtered.length>0&&<><div className="px-3 py-2 font-mono-ui text-[7px] uppercase tracking-[.18em] text-white/25">Navegar</div>{filtered.slice(0,8).map(({label,path,icon:Icon})=><button key={path} onClick={()=>go(path)} className="flex w-full items-center gap-3 rounded-[15px] px-3 py-2.5 text-left transition hover:bg-white/8"><span className="grid h-8 w-8 place-items-center rounded-xl bg-white/7"><Icon size={15}/></span><span className="text-[12px] font-bold">{label}</span></button>)}</>}
        {debounced.length>=2&&<div className="mt-2 border-t border-white/8 pt-2">
          {!!remote.data?.products.length&&<><div className="px-3 py-2 font-mono-ui text-[7px] uppercase tracking-[.18em] text-white/25">Productos</div>{remote.data.products.map(p=><button key={`p${p.id}`} onClick={()=>go(`/admin/productos/${p.id}`)} className="flex w-full items-center justify-between rounded-[15px] px-3 py-2.5 text-left hover:bg-white/8"><span className="text-[12px] font-bold">{p.name}</span><span className="font-mono-ui text-[8px] text-white/30">{p.sku}</span></button>)}</>}
          {!!remote.data?.orders.length&&<><div className="px-3 py-2 font-mono-ui text-[7px] uppercase tracking-[.18em] text-white/25">Pedidos</div>{remote.data.orders.map(o=><button key={`o${o.id}`} onClick={()=>go(`/admin/pedidos?search=${encodeURIComponent(o.code)}`)} className="flex w-full items-center justify-between rounded-[15px] px-3 py-2.5 text-left hover:bg-white/8"><span><b className="text-[11px]">{o.code}</b><span className="ml-2 text-[10px] text-white/45">{o.customerName}</span></span><span className="text-[8px] text-white/30">{o.status}</span></button>)}</>}
          {!!remote.data?.customers.length&&<><div className="px-3 py-2 font-mono-ui text-[7px] uppercase tracking-[.18em] text-white/25">Clientes</div>{remote.data.customers.map(c=><button key={`c${c.phone}`} onClick={()=>go(`/admin/clientes?search=${encodeURIComponent(c.phone)}`)} className="flex w-full items-center justify-between rounded-[15px] px-3 py-2.5 text-left hover:bg-white/8"><span className="text-[11px] font-bold">{c.name}</span><span className="text-[8px] text-white/30">{c.phone}</span></button>)}</>}
          {remote.isLoading&&<div className="p-5 text-center text-[10px] text-white/30">Buscando…</div>}
          {!remote.isLoading&&remote.data&&!remote.data.products.length&&!remote.data.orders.length&&!remote.data.customers.length&&<div className="p-6 text-center text-[10px] text-white/30">No encontramos coincidencias.</div>}
        </div>}
      </div>
      <div className="flex items-center justify-between border-t border-white/8 px-5 py-3 text-[9px] text-white/25"><span>Ronda Admin · búsqueda global</span><span>Ctrl / ⌘ + K</span></div>
    </div>
  </div>;
}
