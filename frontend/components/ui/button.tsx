import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/60 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: `
          bg-white/80 text-teal-700
          border border-teal-200/60
          backdrop-blur-md
          shadow-[0_6px_20px_-6px_rgba(13,148,136,0.35)]
          hover:bg-white
          hover:border-teal-300
          hover:shadow-[0_12px_30px_-6px_rgba(13,148,136,0.45)]
          hover:-translate-y-1
          active:translate-y-0
          active:shadow-[0_6px_18px_-6px_rgba(13,148,136,0.35)]
        `,
                destructive:
                    "bg-red-500/90 text-white hover:bg-red-600 shadow-md",
                outline:
                    "bg-transparent border border-slate-300 text-slate-700 hover:border-teal-400 hover:text-teal-600",
                secondary:
                    "bg-slate-100/80 text-slate-900 hover:bg-slate-200 shadow-sm",
                ghost:
                    "bg-transparent text-teal-600 hover:bg-teal-50",
                link:
                    "text-teal-600 underline-offset-4 hover:underline",
            },
            size: {
                default: "h-11 px-6",
                sm: "h-9 px-4 rounded-lg",
                lg: "h-12 px-8 text-base",
                icon: "h-11 w-11",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                ref={ref}
                className={cn(buttonVariants({ variant, size, className }))}
                {...props}
            />
        )
    }
)

Button.displayName = "Button"

export { Button, buttonVariants }
