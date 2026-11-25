import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[88px] w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 focus-visible:border-sky-400/60 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
