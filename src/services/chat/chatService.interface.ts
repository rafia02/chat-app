import type {
  Conversation,
  ConversationTab,
  Message,
  ReplyTo,
  ServiceResult,
} from "@/types";

export interface SendMessagePayload {
  conversationId: string;
  content: string;
  replyTo?: ReplyTo;
}

export interface IChatService {
  getConversations(): Promise<ServiceResult<Conversation[]>>;
  getConversation(id: string): Promise<ServiceResult<Conversation>>;
  getMessages(conversationId: string): Promise<ServiceResult<Message[]>>;
  sendMessage(payload: SendMessagePayload): Promise<ServiceResult<Message>>;
  markAsRead(conversationId: string): Promise<ServiceResult<void>>;
  addReaction(
    messageId: string,
    emoji: string,
    userId: string
  ): Promise<ServiceResult<Message>>;
  searchConversations(
    query: string,
    tab: ConversationTab
  ): Promise<ServiceResult<Conversation[]>>;
  simulateIncomingMessage(
    conversationId: string,
    senderId: string,
    content: string
  ): Promise<ServiceResult<Message>>;
}
