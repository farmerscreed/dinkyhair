import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-b from-primary/90 to-primary text-primary-foreground shadow-[0_3px_0_0_oklch(0.5_0.25_330),0_4px_8px_rgba(236,72,153,0.3)] hover:translate-y-[1px] hover:shadow-[0_2px_0_0_oklch(0.5_0.25_330)] transition-all",
        secondary:
          "border-transparent bg-gradient-to-b from-secondary/90 to-secondary text-secondary-foreground shadow-[0_3px_0_0_oklch(0.5_0.15_190),0_4px_8px_rgba(0,200,200,0.3)] hover:translate-y-[1px] hover:shadow-[0_2px_0_0_oklch(0.5_0.15_190)] transition-all",
        destructive:
          "border-transparent bg-gradient-to-b from-destructive/90 to-destructive text-destructive-foreground shadow-[0_3px_0_0_oklch(0.4_0.2_20),0_4px_8px_rgba(200,50,50,0.4)] hover:translate-y-[1px] hover:shadow-[0_2px_0_0_oklch(0.4_0.2_20)] transition-all",
        outline: "text-foreground border-primary/30 shadow-[0_2px_0_0_rgba(255,255,255,0.1)] backdrop-blur-sm bg-white/5",
        neon: "border-primary/50 text-primary bg-primary/10 shadow-[0_0_10px_rgba(var(--primary),0.3)] animate-pulse",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
