import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface Props extends InputHTMLAttributes<HTMLInputElement> {}

export default function Input({ className, ...props }: Props) {
  return (
    <input
      className={cn(
        "w-full h-11 rounded-xl border border-slate-700 bg-slate-900 px-4 text-white placeholder:text-slate-400 focus:border-indigo-500 transition-all outline-none",
        className,
      )}
      {...props}
    />
  );
}
