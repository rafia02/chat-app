import { conversations } from "@/constants/conversations";
import ConversationItem from "./ConversationItem";

export default function ConversationList() {
  return (
    <div className="mt-6 2xl:mt-8 flex-1 overflow-y-auto px-4 2xl:px-5 pb-5">
      <div className="mb-5 flex items-center justify-between">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Conversations
        </h4>

        <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#151D31] text-xl text-white transition hover:bg-indigo-600">
          +
        </button>
      </div>

      {conversations.map((conversation, index) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          active={index === 0}
        />
      ))}
    </div>
  );
}
