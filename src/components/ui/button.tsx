import { cn } from "@/lib/utils/cn";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const raised =
  "border-2 border-btn-ledge bg-btn-face text-btn-ink shadow-[0_3px_0_0_var(--btn-ledge)] " +
  "hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_var(--btn-ledge)] hover:bg-[#f7f7f5] " +
  "active:translate-y-[2px] active:shadow-[0_1px_0_0_var(--btn-ledge)] " +
  "disabled:translate-y-0 disabled:shadow-[0_3px_0_0_var(--btn-ledge)]";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: raised,
      secondary: raised,
      outline: raised,
      destructive:
        "border-2 border-destructive bg-btn-face text-destructive shadow-[0_3px_0_0_var(--destructive)] " +
        "hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-[0_5px_0_0_var(--destructive)] " +
        "active:translate-y-[2px] active:shadow-[0_1px_0_0_var(--destructive)]",
      ghost: "bg-transparent text-foreground shadow-none hover:bg-[#e8e8e6] hover:text-foreground",
    };
    const sizes = {
      sm: "h-8 px-4 py-1.5 text-sm",
      md: "h-9 px-5 py-1.5 text-[0.95rem]",
      lg: "h-10 px-6 py-2 text-base",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-semibold transition-[transform,box-shadow,background-color,filter] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
