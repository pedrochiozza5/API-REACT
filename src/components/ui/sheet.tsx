import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

export function SheetContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-[3px] data-[state=open]:animate-[fadeIn_.22s_ease-out]" />
      <Dialog.Content className={cn('fixed bottom-0 right-0 top-0 z-[90] w-full max-w-[470px] bg-[#f5f1e8] shadow-2xl outline-none data-[state=open]:animate-[sheetIn_.35s_cubic-bezier(.22,1,.36,1)] data-[state=closed]:animate-[sheetOut_.24s_ease-in]', className)}>
        {children}
        <Dialog.Close className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-black/5 transition hover:bg-black/10" aria-label="Cerrar"><X size={18} /></Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

export const SheetTitle = Dialog.Title;
export const SheetDescription = Dialog.Description;
