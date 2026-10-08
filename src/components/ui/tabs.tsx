import * as TabsPrimitive from '@radix-ui/react-tabs';
import type * as React from 'react';
import { cn } from '@/lib/cn';

export const Tabs = TabsPrimitive.Root;
export const TabsList = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>) => <TabsPrimitive.List className={cn('inline-flex rounded-full bg-black/5 p-1', className)} {...props} />;
export const TabsTrigger = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) => <TabsPrimitive.Trigger className={cn('rounded-full px-4 py-2 text-xs font-extrabold text-black/45 transition data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm', className)} {...props} />;
export const TabsContent = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) => <TabsPrimitive.Content className={cn('outline-none', className)} {...props} />;
