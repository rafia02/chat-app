import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";
import EmptyChat from "./EmptyChat";

export default function ChatArea() {
  return (
    <section className="flex flex-1 flex-col bg-[#0B1120]">
      <ChatHeader />

      <div className="flex-1 overflow-hidden">
        {/* <EmptyChat /> */}
        <ChatMessages />
      </div>

      <ChatInput />
    </section>
  );
}
