"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export function Switch({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-zinc-700 bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 data-[state=checked]:border-sky-400 data-[state=checked]:bg-sky-400",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block h-4 w-4 translate-x-1 rounded-full bg-zinc-200 shadow transition-transform data-[state=checked]:translate-x-6 data-[state=checked]:bg-zinc-950"
        )}
      />
    </SwitchPrimitive.Root>
  );
}
