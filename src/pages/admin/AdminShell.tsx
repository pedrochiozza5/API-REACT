import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Boxes, DollarSign, ExternalLink, GalleryHorizontalEnd, Gauge, Globe2, Grid2X2, Images, ListChecks, LogOut, Menu, PackageSearch, Search, Settings, ShoppingBag, Users, X, MessageCircleQuestion, GripVertical } from 'lucide-react';
import { Navigate, NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { apiGet, apiSend } from '@/lib/api';
import { AdminCommandPalette } from '@/components/admin/AdminCommandPalette';
import { AdminContextProvider, type AdminPermission, type AdminUser, useAdmin } from '@/components/admin/AdminContext';

type NotificationItem={id:string;type:string;severity:string;title:string;count:number;href:string};
type Notifications={total:number;items:NotificationItem[]};

type NavItem={to:string;label:string;icon:any;permission:AdminPermission};
const groups:{label:string;items:NavItem[]}[]=[
  {label:'Operación',items:[
    {to:'/admin',label:'Resumen',icon:Gauge,permission:'dashboard.view'},
    {to:'/admin/pedidos',label:'Pedidos',icon:ShoppingBag,permission:'orders.view'},
    {to:'/admin/stock',label:'Inventario',icon:PackageSearch,permission:'inventory.view'},
    {to:'/admin/clientes',label:'Clientes',icon:Users,permission:'customers.view'},
  ]},
  {label:'Catálogo',items:[
    {to:'/admin/productos',label:'Productos',icon:Boxes,permission:'products.view'},
    {to:'/admin/mayoristas',label:'Mayoristas',icon:DollarSign,permission:'products.price'},
    {to:'/admin/categorias',label:'Categorías',icon:Grid2X2,permission:'products.view'},
    {to:'/admin/productos?order=1',label:'Orden de tienda',icon:GripVertical,permission:'products.edit'},
  ]},
  {label:'Contenido',items:[
    {to:'/admin/carrusel',label:'Carrusel',icon:GalleryHorizontalEnd,permission:'content.manage'},
    {to:'/admin/multimedia',label:'Multimedia',icon:Images,permission:'media.manage'},
    {to:'/admin/faqs',label:'Preguntas frecuentes',icon:MessageCircleQuestion,permission:'content.manage'},
  ]},
  {label:'Comunidad',items:[{to:'/admin/materos-por-el-mundo',label:'Materos por el mundo',icon:Globe2,permission:'materos.manage'}]},
  {label:'Sistema',items:[
    {to:'/admin/auditoria',label:'Auditoría',icon:ListChecks,permission:'audit.view'},
    {to:'/admin/configuracion',label:'Configuración',icon:Settings,permission:'settings.manage'},
  ]},
];

export function AdminShell(){
  const me=useQuery({queryKey:['admin-me'],queryFn:()=>apiGet<{user:AdminUser}>('/api/admin/me'),retry:false});
  if(me.isLoading)return <div className="grid min-h-screen place-items-center bg-[#0e1511] text-white"><div className="font-mono-ui text-[9px] uppercase tracking-[.22em] text-white/55">Cargando Ronda Admin…</div></div>;
  if(me.isError||!me.data?.user)return <Navigate to="/admin/login" replace/>;
  return <AdminContextProvider user={me.data.user}><AdminWorkspace/></AdminContextProvider>;
}

function AdminWorkspace(){
  const navigate=useNavigate();const location=useLocation();const qc=useQueryClient();const{user,brand,setBrand,can}=useAdmin();
  const[palette,setPalette]=useState(false);const[mobile,setMobile]=useState(false);const[notifsOpen,setNotifsOpen]=useState(false);
  const notifications=useQuery({queryKey:['admin-notifications',brand],queryFn:()=>apiGet<Notifications>(`/api/admin/notifications${brand==='all'?'':`?brand=${brand}`}`),refetchInterval:45_000});
  const visibleGroups=groups.map(g=>({...g,items:g.items.filter(i=>can(i.permission))})).filter(g=>g.items.length);
  const allLinks=visibleGroups.flatMap(g=>g.items);
  const activeLabel=useMemo(()=>allLinks.find(({to})=>{const path=to.split('?')[0];return path==='/admin'?location.pathname==='/admin':location.pathname.startsWith(path);})?.label||'Ronda Admin',[location.pathname,allLinks]);
  const logout=async()=>{await apiSend('/api/admin/auth/logout','POST');qc.clear();navigate('/admin/login');};
  return <div className="admin-shell">
    <AdminCommandPalette open={palette} onOpenChange={setPalette}/>
    {mobile&&<button aria-label="Cerrar menú" onClick={()=>setMobile(false)} className="fixed inset-0 z-[89] bg-black/45 backdrop-blur-sm lg:hidden"/>}
    <aside className={`admin-sidebar ${mobile?'admin-sidebar--open':''}`}>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-3 pb-4 pt-2">
          <div className="flex items-center gap-3"><img src="/brand/bien-amargos-mark.png" alt="Bien Amargos" className="h-11 w-11 rounded-[16px] object-cover shadow-[0_10px_28px_rgba(0,0,0,.14)]"/><div><div className="text-[15px] font-black tracking-[-.03em] text-white">Ronda Admin</div><div className="mt-1 font-mono-ui text-[7px] uppercase tracking-[.22em] text-white/30">Bien Amargos · Bien Yerbados</div></div></div>
          <button onClick={()=>setMobile(false)} className="grid h-9 w-9 place-items-center rounded-xl bg-white/6 text-white/55 lg:hidden"><X size={17}/></button>
        </div>
        <a href="/" target="_blank" rel="noreferrer" className="mx-2 mb-3 flex items-center justify-between rounded-[16px] border border-white/8 bg-white/[.045] px-3 py-2.5 text-[10px] font-bold text-white/65 transition hover:bg-white/[.08] hover:text-white"><span>Ver tienda</span><ExternalLink size={13}/></a>
        <nav className="admin-nav-scroll">
          {visibleGroups.map(group=><div key={group.label} className="mb-4"><div className="px-3 pb-1.5 font-mono-ui text-[7px] uppercase tracking-[.18em] text-white/24">{group.label}</div><div className="grid gap-1 px-2">{group.items.map(({to,label,icon:Icon})=><NavLink key={to} to={to} end={to==='/admin'} onClick={()=>setMobile(false)} className={({isActive})=>`admin-nav-item ${isActive&&location.search===new URL(to,'http://x').search?'admin-nav-item--active':''}`}><span className="admin-nav-icon"><Icon size={15}/></span><span className="min-w-0 flex-1 truncate">{label}</span>{label==='Pedidos'&&Boolean(notifications.data?.items.find(x=>x.id==='pending')?.count)&&<span className="admin-nav-badge">{notifications.data?.items.find(x=>x.id==='pending')?.count}</span>}{label==='Inventario'&&Boolean(notifications.data?.items.find(x=>x.id==='low')?.count)&&<span className="admin-nav-badge admin-nav-badge--danger">{notifications.data?.items.find(x=>x.id==='low')?.count}</span>}</NavLink>)}</div></div>)}
        </nav>
        <div className="mt-auto px-2 pb-2 pt-4"><div className="rounded-[18px] border border-white/8 bg-white/[.045] p-3"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-[10px] font-black text-white">{user.name.slice(0,2).toUpperCase()}</div><div className="min-w-0"><div className="truncate text-xs font-black text-white">{user.name}</div><div className="mt-1 truncate text-[8px] text-white/30">{user.role} · {user.brandScope||'todas las marcas'}</div></div></div><button onClick={logout} className="mt-3 flex w-full items-center justify-center gap-2 rounded-[12px] bg-white/6 px-3 py-2.5 text-[9px] font-black text-white/45 transition hover:bg-white/10 hover:text-white"><LogOut size={13}/> Cerrar sesión</button></div></div>
      </div>
    </aside>

    <div className="admin-workspace">
      <header className="admin-topbar"><div className="flex min-w-0 items-center gap-3"><button onClick={()=>setMobile(true)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-black/7 bg-white lg:hidden"><Menu size={18}/></button><div className="min-w-0"><div className="font-mono-ui text-[7px] uppercase tracking-[.18em] text-black/30">Ronda Admin</div><div className="mt-0.5 truncate text-sm font-black tracking-[-.02em] text-[#171914]">{activeLabel}</div></div></div>
        <div className="flex items-center gap-2">
          {!user.brandScope&&<label className="admin-brand-switcher hidden md:flex"><span>Vista</span><select value={brand} onChange={e=>setBrand(e.target.value as any)}><option value="all">Todo el negocio</option><option value="amargos">Bien Amargos</option><option value="enyerbados">Bien Yerbados</option></select></label>}
          {user.brandScope&&<span className="admin-scope-chip hidden md:inline-flex">{user.brandScope==='amargos'?'Bien Amargos':'Bien Yerbados'}</span>}
          <button onClick={()=>setPalette(true)} className="admin-search-trigger"><Search size={15}/><span className="hidden sm:inline">Buscar o ir a…</span><kbd>⌘K</kbd></button>
          <div className="relative"><button onClick={()=>setNotifsOpen(v=>!v)} aria-label="Notificaciones" className="relative grid h-10 w-10 place-items-center rounded-xl border border-black/7 bg-white text-black/55 shadow-sm"><Bell size={16}/>{Boolean(notifications.data?.total)&&<span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-[#efc51d] px-1 text-[8px] font-black text-[#1b211b] ring-2 ring-white">{Math.min(99,notifications.data?.total||0)}</span>}</button>{notifsOpen&&<div className="admin-notification-panel"><div className="flex items-center justify-between border-b border-black/6 px-4 py-3"><div><div className="text-xs font-black">Necesita atención</div><div className="mt-0.5 text-[9px] text-black/35">Se actualiza automáticamente</div></div><button onClick={()=>setNotifsOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg bg-black/4"><X size={14}/></button></div><div className="max-h-[360px] overflow-y-auto p-2">{notifications.data?.items.length?notifications.data.items.map(n=><Link key={n.id} to={n.href} onClick={()=>setNotifsOpen(false)} className={`admin-notification admin-notification--${n.severity}`}><span>{n.title}</span><strong>{n.count}</strong></Link>):<div className="p-6 text-center text-[10px] text-black/35">No hay alertas pendientes.</div>}</div></div>}</div>
        </div>
      </header>
      <main className="admin-main"><Outlet/></main>
    </div>
  </div>;
}
