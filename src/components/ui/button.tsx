import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[14px] border text-sm font-extrabold transition-[transform,background-color,border-color,color,opacity] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174a36]/35 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 active:translate-y-px',
  {
    variants: {
      variant: {
        primary: 'border-[#174a36] bg-[#174a36] text-white hover:border-[#103d2d] hover:bg-[#103d2d]',
        secondary: 'border-[#d2b86f] bg-[#d8c59e] text-[#17311f] hover:border-[#c5ad68] hover:bg-[#cfba8d]',
        outline: 'border-black/12 bg-transparent text-[#172119] hover:border-[#174a36]/30 hover:bg-[#174a36]/[.05]',
        ghost: 'border-transparent bg-transparent text-[#172119] hover:bg-[#174a36]/[.07]',
        danger: 'border-[#a9472c] bg-[#a9472c] text-white hover:border-[#913a24] hover:bg-[#913a24]',
        success: 'border-[#197348] bg-[#197348] text-white hover:border-[#135f3a] hover:bg-[#135f3a]',
        dark: 'border-[#174a36] bg-[#174a36] text-white hover:border-[#103d2d] hover:bg-[#103d2d]',
        light: 'border-black/10 bg-[#fbf8f1] text-[#172119] hover:border-[#174a36]/25 hover:bg-white',
      },
      size: {
        sm: 'h-10 min-h-10 px-4 text-xs',
        default: 'h-12 px-5',
        lg: 'h-14 px-6',
        icon: 'h-11 w-11 min-h-11 p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
Button.displayName = 'Button';

export { buttonVariants };
