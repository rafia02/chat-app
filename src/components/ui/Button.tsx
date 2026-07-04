import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loading?: boolean;
}

export default function Button({
  children,
  className,
  loading,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-all duration-300 px-5 font-medium text-white disabled:opacity-50",
        className,
      )}
      disabled={loading}
      {...props}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}
