import { formatDateDivider } from "@/lib/date";

interface DateDividerProps {
  date: string;
}

export default function DateDivider({ date }: DateDividerProps) {
  return (
    <div className="my-6 md:my-8 flex items-center gap-4">
      <div className="h-px flex-1 bg-[#243049]" />
      <div className="rounded-full border border-[#26314B] bg-[#131C2F] px-3 md:px-4 py-1 text-xs text-slate-400">
        {formatDateDivider(date)}
      </div>
      <div className="h-px flex-1 bg-[#243049]" />
    </div>
  );
}
