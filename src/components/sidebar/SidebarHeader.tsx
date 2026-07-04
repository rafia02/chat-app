export default function SidebarHeader() {
  return (
    <div className="flex items-center justify-between border-b border-[#1B2233] px-4 md:px-6 py-4 md:py-6 shrink-0">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-white">Nova Chat</h2>
        <p className="mt-0.5 md:mt-1 text-xs md:text-sm text-slate-400">
          Stay connected
        </p>
      </div>
    </div>
  );
}
