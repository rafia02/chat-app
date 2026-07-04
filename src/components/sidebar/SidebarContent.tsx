import SidebarHeader from "./SidebarHeader";
import SidebarSearch from "./SidebarSearch";
import SidebarTabs from "./SidebarTabs";
import ConversationList from "./ConversationList";
import SidebarFooter from "./SidebarFooter";

export default function SidebarContent() {
  return (
    <div className="flex h-full flex-1 flex-col">
      <SidebarHeader />

      <div className="px-4 2xl:px-5 pt-0 2xl:pt-6">
        <SidebarSearch />
      </div>

      <div className="px-4 2xl:px-5 pt-4 2xl:pt-6">
        <SidebarTabs />
      </div>

      <ConversationList />

      <SidebarFooter />
    </div>
  );
}
