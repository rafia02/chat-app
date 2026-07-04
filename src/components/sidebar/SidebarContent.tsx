import SidebarHeader from "./SidebarHeader";
import SidebarSearch from "./SidebarSearch";
import SidebarTabs from "./SidebarTabs";
import ConversationList from "./ConversationList";
import SidebarFooter from "./SidebarFooter";
import SocketStatus from "../chat/SocketStatus";

export default function SidebarContent() {
  return (
    <div className="flex h-full flex-1 flex-col min-h-0">
      <SidebarHeader />
      <SocketStatus />

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
