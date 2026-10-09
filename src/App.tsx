import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ScrollToTop } from '@/components/storefront/ScrollToTop';
import { RouteTitle } from '@/components/storefront/RouteTitle';
import { useCart } from '@/store/cart';

const CartDrawer = lazy(() => import('@/components/storefront/CartDrawer').then((m) => ({ default: m.CartDrawer })));
const CanaBot = lazy(() => import('@/components/storefront/CanaBot').then((m) => ({ default: m.CanaBot })));
const BrandHome = lazy(() => import('@/pages/store/BrandHome').then((m) => ({ default: m.BrandHome })));
const CatalogPage = lazy(() => import('@/pages/store/CatalogPage').then((m) => ({ default: m.CatalogPage })));
const ProductPage = lazy(() => import('@/pages/store/ProductPage').then((m) => ({ default: m.ProductPage })));
const CheckoutPage = lazy(() => import('@/pages/store/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const AdminLogin = lazy(() => import('@/pages/admin/AdminLogin').then((m) => ({ default: m.AdminLogin })));
const AdminShell = lazy(() => import('@/pages/admin/AdminShell').then((m) => ({ default: m.AdminShell })));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminProducts = lazy(() => import('@/pages/admin/AdminProducts').then((m) => ({ default: m.AdminProducts })));
const AdminProductEditor = lazy(() => import('@/pages/admin/AdminProductEditor').then((m) => ({ default: m.AdminProductEditor })));
const AdminOrders = lazy(() => import('@/pages/admin/AdminOrders').then((m) => ({ default: m.AdminOrders })));
const AdminStock = lazy(() => import('@/pages/admin/AdminStock').then((m) => ({ default: m.AdminStock })));
const AdminWholesale = lazy(() => import('@/pages/admin/AdminWholesale').then((m) => ({ default: m.AdminWholesale })));
const AdminCategories = lazy(() => import('@/pages/admin/AdminCategories').then((m) => ({ default: m.AdminCategories })));
const AdminCustomers = lazy(() => import('@/pages/admin/AdminCustomers').then((m) => ({ default: m.AdminCustomers })));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings').then((m) => ({ default: m.AdminSettings })));
const AdminMedia = lazy(() => import('@/pages/admin/AdminMedia').then((m) => ({ default: m.AdminMedia })));
const AdminAudit = lazy(() => import('@/pages/admin/AdminAudit').then((m) => ({ default: m.AdminAudit })));
const AdminBanners = lazy(() => import('@/pages/admin/AdminBanners').then((m) => ({ default: m.AdminBanners })));
const AdminFaqs = lazy(() => import('@/pages/admin/AdminFaqs').then((m) => ({ default: m.AdminFaqs })));
const WorldMapPage = lazy(() => import('@/pages/store/WorldMapPage').then((m) => ({ default: m.WorldMapPage })));
const AdminWorldMap = lazy(() => import('@/pages/admin/AdminWorldMap').then((m) => ({ default: m.AdminWorldMap })));
const NotFoundPage = lazy(() => import('@/pages/store/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))); 

function Loading() { return <div className="grid min-h-screen place-items-center bg-[#f2efe7]"><div className="font-mono-ui text-[9px] uppercase tracking-[.22em] text-black/38">Cargando…</div></div>; }

function GlobalOverlays(){
  const {pathname}=useLocation();
  const cartOpen=useCart(state=>state.open);
  const [cartLoaded,setCartLoaded]=useState(false);
  const [showAssist,setShowAssist]=useState(false);
  useEffect(()=>{if(cartOpen)setCartLoaded(true);},[cartOpen]);
  useEffect(()=>{
    if(pathname.startsWith('/admin')) return;
    const w=window as typeof window & { requestIdleCallback?: (cb:()=>void, options?:{timeout:number})=>number; cancelIdleCallback?: (id:number)=>void };
    let timer:number|undefined;
    let idle:number|undefined;
    if(w.requestIdleCallback) idle=w.requestIdleCallback(()=>setShowAssist(true),{timeout:2200});
    else timer=window.setTimeout(()=>setShowAssist(true),1600);
    return ()=>{if(timer)window.clearTimeout(timer);if(idle&&w.cancelIdleCallback)w.cancelIdleCallback(idle);};
  },[pathname]);
  if(pathname.startsWith('/admin'))return null;
  return <>{cartLoaded&&<Suspense fallback={null}><CartDrawer/></Suspense>}{showAssist&&<Suspense fallback={null}><CanaBot/></Suspense>}</>;
}

export default function App() {
  return <>
    <ScrollToTop/><RouteTitle/>
    <Suspense fallback={<Loading/>}><Routes>
      <Route path="/" element={<BrandHome brand="amargos"/>}/>
      <Route path="/yerbados" element={<BrandHome brand="enyerbados"/>}/>
      <Route path="/enyerbados" element={<Navigate to="/yerbados" replace/>}/>
      <Route path="/catalogo" element={<CatalogPage/>}/>
      <Route path="/tienda" element={<Navigate to="/catalogo" replace/>}/>
      <Route path="/colecciones" element={<Navigate to="/catalogo" replace/>}/>
      <Route path="/producto/:slug" element={<ProductPage/>}/>
      <Route path="/checkout" element={<CheckoutPage/>}/>
      <Route path="/materos-por-el-mundo" element={<WorldMapPage/>}/>
      <Route path="/admin/login" element={<AdminLogin/>}/>
      <Route path="/admin" element={<AdminShell/>}>
        <Route index element={<AdminDashboard/>}/>
        <Route path="productos" element={<AdminProducts/>}/>
        <Route path="productos/nuevo" element={<AdminProductEditor/>}/>
        <Route path="productos/:id" element={<AdminProductEditor/>}/>
        <Route path="categorias" element={<AdminCategories/>}/>
        <Route path="pedidos" element={<AdminOrders/>}/>
        <Route path="stock" element={<AdminStock/>}/>
        <Route path="mayoristas" element={<AdminWholesale/>}/>
        <Route path="clientes" element={<AdminCustomers/>}/>
        <Route path="multimedia" element={<AdminMedia/>}/>
        <Route path="carrusel" element={<AdminBanners/>}/>
        <Route path="faqs" element={<AdminFaqs/>}/>
        <Route path="materos-por-el-mundo" element={<AdminWorldMap/>}/>
        <Route path="auditoria" element={<AdminAudit/>}/>
        <Route path="configuracion" element={<AdminSettings/>}/>
      </Route>
      <Route path="*" element={<NotFoundPage/>}/>
    </Routes></Suspense>
    <GlobalOverlays/>
  </>;
}
