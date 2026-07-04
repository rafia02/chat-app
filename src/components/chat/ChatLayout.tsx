import ChatArea from "./ChatArea";
import Sidebar from "../sidebar/Sidebar";

export default function ChatLayout() {
  return (
    <main className="h-screen bg-[#070B14] p-5">
      <div className="flex h-full overflow-hidden rounded-[32px] border border-[#1B2233] bg-[#0B1120] shadow-2xl shadow-black/40">
        <Sidebar />
        <ChatArea />
      </div>
    </main>
  );
}
