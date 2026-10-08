import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { BrandId } from '@/lib/types';

export type AdminPermission =
  | 'dashboard.view'|'orders.view'|'orders.update_status'|'orders.cancel'|'products.view'|'products.create'|'products.edit'|'products.price'|'products.archive'
  | 'inventory.view'|'inventory.adjust'|'customers.view'|'media.manage'|'content.manage'|'materos.manage'|'settings.manage'|'audit.view'|'admins.manage';

export type AdminUser = { id:number; name:string; email:string; role:'superadmin'|'manager'|'operator'; brandScope:BrandId|null; permissions:AdminPermission[] };
export type AdminBrandFilter = 'all'|BrandId;

type Value = { user:AdminUser; brand:AdminBrandFilter; setBrand:(brand:AdminBrandFilter)=>void; can:(permission:AdminPermission)=>boolean };
const Ctx=createContext<Value|null>(null);

export function AdminContextProvider({user,children}:{user:AdminUser;children:ReactNode}){
  const [brand,setBrandState]=useState<AdminBrandFilter>(()=>{
    if(user.brandScope)return user.brandScope;
    const stored=window.localStorage.getItem('ba_admin_brand');
    return stored==='amargos'||stored==='enyerbados'||stored==='all'?stored:'all';
  });
  useEffect(()=>{ if(user.brandScope&&brand!==user.brandScope)setBrandState(user.brandScope); },[user.brandScope,brand]);
  const setBrand=(next:AdminBrandFilter)=>{
    const safe=user.brandScope ? user.brandScope : next;
    setBrandState(safe); window.localStorage.setItem('ba_admin_brand',safe);
  };
  const value=useMemo<Value>(()=>({user,brand,setBrand,can:(p)=>user.permissions.includes(p)}),[user,brand]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdmin(){const v=useContext(Ctx);if(!v)throw new Error('useAdmin debe usarse dentro de AdminContextProvider');return v;}
export function brandQuery(brand:AdminBrandFilter){return brand==='all'?'':`?brand=${brand}`;}
