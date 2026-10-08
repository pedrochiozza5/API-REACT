import type { ReactNode } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';

export function Magnet({ children, className = '', strength = 7 }: { children: ReactNode; className?: string; strength?: number }) {
  const reduce = useReducedMotion();
  const xRaw = useMotionValue(0); const yRaw = useMotionValue(0);
  const x = useSpring(xRaw, { stiffness: 320, damping: 24, mass: .45 });
  const y = useSpring(yRaw, { stiffness: 320, damping: 24, mass: .45 });
  return <motion.span
    className={`inline-flex ${className}`}
    style={reduce ? undefined : { x, y }}
    onPointerMove={(e) => {
      if (reduce || e.pointerType === 'touch') return;
      const r = e.currentTarget.getBoundingClientRect();
      xRaw.set(((e.clientX - r.left) / r.width - .5) * strength);
      yRaw.set(((e.clientY - r.top) / r.height - .5) * strength);
    }}
    onPointerLeave={() => { xRaw.set(0); yRaw.set(0); }}
  >{children}</motion.span>;
}
