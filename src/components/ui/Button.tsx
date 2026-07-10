import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg min-h-[36px]",
  md: "px-4 py-2.5 text-sm rounded-xl min-h-[44px]",
  lg: "px-6 py-3 text-sm rounded-xl min-h-[48px]",
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[image:var(--accent-gradient)] text-[var(--text-on-accent)] font-semibold shadow-[0_10px_15px_-3px_var(--accent-shadow)] hover:opacity-95 active:opacity-90",
  secondary:
    "bg-[var(--accent-primary-light)] text-[var(--accent-primary)] font-semibold border border-[var(--accent-primary-border)] hover:bg-[var(--accent-primary-border)]",
  ghost:
    "bg-transparent text-[var(--text-muted)] font-medium hover:bg-[var(--hover-subtle)] hover:text-[var(--text-secondary)]",
  danger:
    "bg-[var(--accent-red-light)] text-[var(--accent-red)] font-semibold border border-[var(--accent-red-border)] hover:opacity-90",
};

/**
 * Shared button — primary harvest CTA, secondary, ghost, and danger.
 * Uses design tokens so light/dark stay consistent.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className = "",
      children,
      type = "button",
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] disabled:opacity-50 disabled:pointer-events-none ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        {...rest}
      >
        {loading && (
          <span
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0"
            aria-hidden
          />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
