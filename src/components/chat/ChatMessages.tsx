"use client";

import { useMessages, useTypingDisplay } from "@/hooks";
import { LoadingState, ErrorState } from "@/components/ui";
import DateDivider from "./DateDivider";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { isSameDay } from "@/lib/date";
import { getUserById } from "@/mocks/users";
import type { Message } from "@/types";

interface ChatMessagesProps {
  conversationId: string;
}

export default function ChatMessages({ conversationId }: ChatMessagesProps) {
  const {
    messages,
    isLoading,
    error,
    bottomRef,
    currentUserId,
    addReaction,
    setReplyTo,
    editMessage,
    deleteMessage,
  } = useMessages(conversationId);

  const typingUserIds = useTypingDisplay(conversationId, currentUserId);

  if (isLoading && messages.length === 0) {
    return <LoadingState message="Loading messages..." />;
  }

  if (error && messages.length === 0) {
    return <ErrorState message={error} />;
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-slate-400">No messages yet. Say hello! 👋</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-4 md:px-8 lg:px-12 py-6 md:py-10 bg-[radial-gradient(circle_at_top,#1B2550_0%,#0B1120_45%,#0B1120_100%)]">
      {messages.map((message, index) => {
        const showDateDivider =
          index === 0 ||
          !isSameDay(messages[index - 1].createdAt, message.createdAt);

        return (
          <div key={message.id}>
            {showDateDivider && <DateDivider date={message.createdAt} />}
            <MessageItem
              message={message}
              currentUserId={currentUserId}
              onReact={addReaction}
              onReply={setReplyTo}
              onEdit={editMessage}
              onDelete={deleteMessage}
            />
          </div>
        );
      })}

      {typingUserIds.length > 0 && (
        <TypingIndicator userIds={typingUserIds} />
      )}

      <div ref={bottomRef} />
    </div>
  );
}

function MessageItem({
  message,
  currentUserId,
  onReact,
  onReply,
  onEdit,
  onDelete,
}: {
  message: Message;
  currentUserId: string;
  onReact: (messageId: string, emoji: string) => void;
  onReply: (reply: import("@/types").ReplyTo) => void;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
}) {
  const sender = getUserById(message.senderId);
  const isOwn = message.senderId === currentUserId;

  return (
    <MessageBubble
      message={message}
      own={isOwn}
      avatar={sender?.avatar}
      sender={sender?.name}
      currentUserId={currentUserId}
      onReact={(emoji) => onReact(message.id, emoji)}
      onReply={() =>
        onReply({
          messageId: message.id,
          senderId: message.senderId,
          senderName: sender?.name ?? "Unknown",
          content: message.content,
        })
      }
      onCopy={() => navigator.clipboard.writeText(message.content)}
      onEdit={(content) => onEdit(message.id, content)}
      onDelete={() => onDelete(message.id)}
    />
  );
}
