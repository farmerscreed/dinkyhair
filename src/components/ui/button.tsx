import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-primary/90 to-primary text-primary-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_4px_0_0_oklch(0.5_0.25_330),0_8px_15px_rgba(236,72,153,0.4)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_3px_0_0_oklch(0.5_0.25_330),0_6px_12px_rgba(236,72,153,0.5)] hover:translate-y-[1px] active:shadow-[inset_0_4px_4px_0_rgba(0,0,0,0.2)] active:translate-y-[4px] border-none backdrop-blur-sm",
        destructive:
          "bg-gradient-to-b from-destructive/90 to-destructive text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_4px_0_0_oklch(0.4_0.2_20),0_8px_15px_rgba(200,50,50,0.4)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_3px_0_0_oklch(0.4_0.2_20),0_6px_12px_rgba(200,50,50,0.5)] hover:translate-y-[1px] active:shadow-[inset_0_4px_4px_0_rgba(0,0,0,0.2)] active:translate-y-[4px] border-none",
        outline:
          "border-2 border-primary/30 bg-background/50 text-foreground shadow-[0_4px_0_0_rgba(255,255,255,0.1)] hover:bg-primary/10 hover:border-primary hover:shadow-[0_4px_0_0_var(--primary)] hover:translate-y-[-2px] active:translate-y-[2px] active:shadow-none backdrop-blur-md",
        secondary:
          "bg-gradient-to-b from-secondary/90 to-secondary text-secondary-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_4px_0_0_oklch(0.5_0.15_190),0_8px_15px_rgba(0,200,200,0.3)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_3px_0_0_oklch(0.5_0.15_190),0_6px_12px_rgba(0,200,200,0.4)] hover:translate-y-[1px] active:shadow-[inset_0_4px_4px_0_rgba(0,0,0,0.2)] active:translate-y-[4px] border-none",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 hover:shadow-[0_0_20px_rgba(var(--accent),0.3)] transition-all duration-300",
        link: "text-primary underline-offset-4 hover:underline",
        neon: "bg-black/40 border border-primary text-primary shadow-[0_0_10px_var(--primary),inset_0_0_10px_var(--primary)] hover:shadow-[0_0_25px_var(--primary),inset_0_0_20px_var(--primary)] hover:bg-primary hover:text-primary-foreground hover:border-transparent transition-all duration-300 active:scale-95",
        glass: "bg-white/5 backdrop-blur-xl border border-white/20 text-white shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] hover:bg-white/10 hover:border-white/40 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.5)] transition-all duration-300",
      },
      size: {
        default: "h-11 px-6 has-[>svg]:px-4 text-base",
        xs: "h-7 gap-1 rounded-lg px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 rounded-lg gap-1.5 px-4 has-[>svg]:px-2.5 text-sm",
        lg: "h-12 rounded-xl px-8 has-[>svg]:px-6 text-lg",
        icon: "size-11 rounded-xl",
        "icon-xs": "size-7 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 rounded-lg",
        "icon-lg": "size-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
