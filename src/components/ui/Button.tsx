import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loading?: boolean;
  variant?: "primary" | "secondary" | "ghost";
}

const variants = {
  primary:
    "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/20",
  secondary:
    "bg-[#151D31] border border-[#222C43] hover:border-indigo-500 hover:bg-[#1a2540]",
  ghost: "bg-transparent hover:bg-[#151D31] text-slate-300",
};

export function Button({
  children,
  className,
  loading,
  variant = "primary",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "h-11 rounded-xl transition-all duration-300 px-5 font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}

export default Button;
