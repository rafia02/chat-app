import ChatLayout from "@/components/chat/ChatLayout";

interface Props {
  params: Promise<{ conversationId: string }>;
}

export default async function ConversationPage({ params }: Props) {
  const { conversationId } = await params;
  return <ChatLayout conversationId={conversationId} />;
}
