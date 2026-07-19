import { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import { BRAND_BLUE } from "@/lib/constants";

type Variant = "primary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
};

type ButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type AnchorProps = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "text-white hover:opacity-90",
  outline:
    "bg-white text-slate-700 border border-slate-300 hover:border-slate-400 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center font-semibold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-700 disabled:opacity-50 disabled:pointer-events-none";

export function Button(props: ButtonProps | AnchorProps) {
  const { children, variant = "primary", size = "md", className = "", ...rest } = props;
  const classes = `${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`;
  const style = variant === "primary" ? { backgroundColor: BRAND_BLUE } : undefined;

  if ("href" in props && props.href) {
    const anchorProps = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a {...anchorProps} href={props.href} style={style} className={classes}>
        {children}
      </a>
    );
  }

  const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button {...buttonProps} style={style} className={classes}>
      {children}
    </button>
  );
}
