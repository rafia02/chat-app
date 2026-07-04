import LeftRail from "./LeftRail";
import SidebarContent from "./SidebarContent";

export default function Sidebar() {
  return (
    <aside className="flex h-full w-[430px] border-r border-[#1B2233] bg-[#0D1322]">
      <LeftRail />
      <SidebarContent />
    </aside>
  );
}
