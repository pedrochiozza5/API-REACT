import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Image as ImageIcon, Search, X } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { AdminImageActions, type UploadedMedia } from '@/components/admin/AdminImageUpload';

type Media={id:number;url:string;fileName:string;mimeType?:string|null;sizeBytes:number;width?:number|null;height?:number|null;altText?:string|null};

export function AdminMediaPicker({open,onClose,onSelect,title='Elegir de biblioteca'}:{open:boolean;onClose:()=>void;onSelect:(url:string,media?:Media)=>void;title?:string}){
  const[search,setSearch]=useState('');
  const q=useQuery({queryKey:['admin-media-picker'],queryFn:()=>apiGet<Media[]>('/api/admin/media'),enabled:open});
  const rows=useMemo(()=>{const term=search.toLowerCase().trim();return(q.data||[]).filter(m=>!term||`${m.fileName} ${m.altText||''}`.toLowerCase().includes(term));},[q.data,search]);
  if(!open)return null;
  const selectUploaded=(media:UploadedMedia)=>{onSelect(media.url,media as Media);onClose();};
  return <div className="fixed inset-0 z-[260] grid place-items-center bg-[#07110c]/60 p-3 backdrop-blur-sm" onMouseDown={onClose}>
    <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/20 bg-[#f6f3eb] shadow-[0_36px_130px_rgba(0,0,0,.4)]" onMouseDown={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-black/7 px-5 py-4"><div><div className="admin-eyebrow">Multimedia</div><div className="mt-1 text-lg font-black">{title}</div><div className="mt-1 text-[9px] text-black/38">Elegí una existente o subila desde tu dispositivo sin salir de acá.</div></div><button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl bg-black/5"><X size={16}/></button></div>
      <div className="grid gap-3 border-b border-black/7 p-4 md:grid-cols-[1fr_auto] md:items-start"><label className="admin-search-field"><Search size={15}/><input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nombre…"/></label><AdminImageActions compact onUploaded={selectUploaded} uploadLabel="Subir y usar ahora"/></div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4"><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">{rows.map(m=><button type="button" key={m.id} onClick={()=>{onSelect(m.url,m);onClose();}} className="group overflow-hidden rounded-[18px] border border-black/7 bg-white text-left transition hover:-translate-y-0.5 hover:border-[#164b36]/30 hover:shadow-lg"><div className="aspect-square bg-[#f3efe5] p-2"><img src={m.url} alt={m.altText||m.fileName} className="h-full w-full object-contain"/></div><div className="p-2.5"><div className="truncate text-[9px] font-black">{m.fileName}</div><div className="mt-1 text-[7px] text-black/35">{m.width&&m.height?`${m.width}×${m.height} · `:''}{Math.max(1,Math.round(m.sizeBytes/1024))} KB</div></div></button>)}</div>{!rows.length&&!q.isLoading&&<div className="grid min-h-[240px] place-items-center text-center"><div><ImageIcon size={24} className="mx-auto text-black/20"/><div className="mt-3 text-sm font-black">Sin resultados</div><div className="mt-1 text-[10px] text-black/35">Podés subir una imagen desde tu dispositivo arriba.</div></div></div>}</div>
    </div>
  </div>;
}
