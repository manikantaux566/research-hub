import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type ButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
  title?: string;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-fg hover:bg-primary-hover shadow-xs",
  secondary:
    "border border-border-strong bg-surface text-foreground hover:bg-surface-hover hover:border-strong",
  ghost: "text-muted hover:bg-surface-hover hover:text-foreground",
  subtle: "bg-surface-muted text-foreground hover:bg-surface-hover",
  danger:
    "bg-danger text-danger-fg hover:bg-danger-hover shadow-xs",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-3 text-xs rounded-lg",
  md: "h-9 gap-2 px-3.5 text-sm rounded-lg",
  lg: "h-11 gap-2 px-5 text-sm rounded-xl",
  icon: "h-9 w-9 rounded-lg",
  "icon-sm": "h-7 w-7 rounded-md",
};

export function Button({
  children,
  variant = "secondary",
  size = "md",
  onClick,
  disabled,
  className = "",
  type = "button",
  title,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex shrink-0 items-center justify-center font-medium transition-[background-color,border-color,color,box-shadow] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/55 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </button>
  );
}

export function IconButton({
  children,
  label,
  onClick,
  variant = "ghost",
  size = "icon",
  className = "",
  disabled,
}: {
  children: ReactNode;
  label: string;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: "icon" | "icon-sm";
  className?: string;
  disabled?: boolean;
}) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={className}
      title={label}
    >
      <span className="sr-only">{label}</span>
      {children}
    </Button>
  );
}
