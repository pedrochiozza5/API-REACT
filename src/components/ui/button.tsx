import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[14px] border text-sm font-extrabold transition-[transform,background-color,border-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174a36]/35 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45 active:translate-y-px',
  {
    variants: {
      variant: {
        dark: 'border-[#173e2e] bg-[#173e2e] text-white hover:border-[#102f23] hover:bg-[#102f23]',
        light: 'border-black/10 bg-[#fbf8f1] text-[#172119] hover:border-[#174a36]/25 hover:bg-white',
        ghost: 'border-transparent bg-transparent text-[#172119] hover:bg-[#174a36]/[.07]',
        outline: 'border-black/12 bg-transparent text-[#172119] hover:border-[#174a36]/30 hover:bg-[#174a36]/[.05]',
      },
      size: {
        sm: 'h-10 px-4 text-xs',
        default: 'h-12 px-5',
        lg: 'h-14 px-6',
        icon: 'h-11 w-11 p-0',
      },
    },
    defaultVariants: { variant: 'dark', size: 'default' },
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
