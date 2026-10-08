import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

export function AnimatedContent({ children, className = '', delay = 0, amount = .16 }: { children: ReactNode; className?: string; delay?: number; amount?: number }) {
  const reduce = useReducedMotion();
  return <motion.div
    className={className}
    initial={reduce ? false : { opacity: 0, y: 18 }}
    whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
    viewport={{ once: true, amount }}
    transition={{ duration: reduce ? 0 : .48, delay, ease: [0.22, 1, 0.36, 1] }}
  >{children}</motion.div>;
}
