import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  open?: boolean;
  className?: string;
};

/** Classic three-line hamburger; morphs to X when open. */
export function AnimatedHamburger({ open, className }: Props) {
  return (
    <div className={cn("relative h-[18px] w-[22px]", className)} aria-hidden>
      <span
        className={cn(
          "absolute left-0 right-0 top-0 block h-[2.5px] rounded-full bg-current origin-center transition-all duration-300 ease-out",
          open ? "top-[8px] rotate-45" : "animate-hamburger-bar-top",
        )}
      />
      <span
        className={cn(
          "absolute left-0 right-0 top-[8px] block h-[2.5px] rounded-full bg-current transition-all duration-300 ease-out",
          open ? "scale-x-0 opacity-0" : "animate-hamburger-bar-mid",
        )}
      />
      <span
        className={cn(
          "absolute left-0 right-0 bottom-0 block h-[2.5px] rounded-full bg-current origin-center transition-all duration-300 ease-out",
          open ? "bottom-[8px] -rotate-45" : "animate-hamburger-bar-bottom",
        )}
      />
    </div>
  );
}

type ButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  open?: boolean;
  attention?: boolean;
  variant?: "dashboard" | "admin";
};

/** Mobile menu trigger with pulse ring and animated hamburger icon. */
export const MobileMenuButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function MobileMenuButton(
    { open, attention = true, variant = "dashboard", className, children, ...props },
    ref,
  ) {
    const accent =
      variant === "admin"
        ? "border-amber-400/30 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300"
        : "border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary";

    return (
      <button
        ref={ref}
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        className={cn(
          "relative inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200",
          "active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          accent,
          attention && !open && "hamburger-btn-attention",
          className,
        )}
        {...props}
      >
        {attention && !open && (
          <span
            className="pointer-events-none absolute inset-0 rounded-xl animate-hamburger-glow"
            aria-hidden
          />
        )}
        {children ?? <AnimatedHamburger open={open} />}
      </button>
    );
  },
);
