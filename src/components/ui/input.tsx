import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground/50 selection:bg-primary selection:text-primary-foreground dark:bg-black/20 border-white/10 h-11 w-full min-w-0 rounded-xl border bg-black/5 px-4 py-2 text-base shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.2)] transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm backdrop-blur-sm",
        "focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.2),0_0_0_1px_rgba(var(--primary),0.2)]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
