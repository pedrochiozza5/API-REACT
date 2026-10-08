import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

export function AdminPage({ children }: { children: ReactNode }) {
  return <section className="admin-page"><div className="admin-page-inner">{children}</div></section>;
}

export function AdminPageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  const reduce=useReducedMotion();
  return <motion.div initial={reduce?false:{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:reduce?0:.38,ease:[.22,1,.36,1]}} className="admin-page-header">
    <div className="min-w-0">
      <div className="admin-eyebrow">{eyebrow}</div>
      <h1 className="admin-title">{title}</h1>
      {description && <p className="admin-description">{description}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </motion.div>;
}

export function MetricCard({ label, value, detail, icon, tone = 'neutral' }: { label: string; value: ReactNode; detail?: string; icon?: ReactNode; tone?: 'neutral' | 'green' | 'yellow' | 'dark' }) {
  const reduce=useReducedMotion();
  return <motion.article initial={reduce?false:{opacity:0,y:10}} whileInView={reduce?undefined:{opacity:1,y:0}} viewport={{once:true,amount:.25}} transition={{duration:reduce?0:.34}} onPointerMove={(e)=>{const r=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty('--spot-x',`${e.clientX-r.left}px`);e.currentTarget.style.setProperty('--spot-y',`${e.clientY-r.top}px`);}} className={`admin-metric admin-metric--${tone}`}>
    <div className="flex items-start justify-between gap-4">
      <div className="admin-metric-label">{label}</div>
      {icon && <div className="admin-metric-icon">{icon}</div>}
    </div>
    <div className="admin-metric-value">{value}</div>
    {detail && <div className="admin-metric-detail">{detail}</div>}
  </motion.article>;
}

export function AdminCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduce=useReducedMotion();
  return <motion.div initial={reduce?false:{opacity:0,y:10}} whileInView={reduce?undefined:{opacity:1,y:0}} viewport={{once:true,amount:.12}} transition={{duration:reduce?0:.36,ease:[.22,1,.36,1]}} className={`admin-card ${className}`}>{children}</motion.div>;
}

export function AdminCardHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="admin-card-header">
    <div><div className="admin-card-title">{title}</div>{description && <div className="admin-card-description">{description}</div>}</div>
    {action}
  </div>;
}

export function AdminEmpty({ title, description }: { title: string; description?: string }) {
  return <div className="admin-empty"><div className="admin-empty-title">{title}</div>{description && <div className="admin-empty-description">{description}</div>}</div>;
}

export function MiniLink({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-1 text-[11px] font-black text-black/45">{children}<ChevronRight size={13}/></span>;
}

export function StatusPill({ status }: { status: string }) {
  const labels: Record<string,string> = { pending:'Pendiente', confirmed:'Confirmado', preparing:'Preparando', ready:'Listo', completed:'Entregado', cancelled:'Cancelado', expired:'Vencido' };
  const cls = status === 'completed' ? 'status-completed' : status === 'cancelled' || status === 'expired' ? 'status-cancelled' : status === 'ready' ? 'status-ready' : status === 'preparing' ? 'status-preparing' : status === 'confirmed' ? 'status-confirmed' : 'status-pending';
  return <span className={`admin-status ${cls}`}>{labels[status] || status}</span>;
}
