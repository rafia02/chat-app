const tabs = ["All", "Unread", "Groups", "DM"];

export default function SidebarTabs() {
  return (
    <div className="flex gap-3">
      {tabs.map((tab, index) => (
        <button
          key={tab}
          className={`rounded-3xl px-4 py-1 text-sm transition ${
            index === 0
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-white"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
