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
  file?: File;
  onUploadProgress?: (percentage: number) => void;
}

export interface IChatService {
  getConversations(): Promise<ServiceResult<Conversation[]>>;
  getConversation(id: string): Promise<ServiceResult<Conversation>>;
  getMessages(
    conversationId: string,
    page?: number,
    limit?: number,
  ): Promise<ServiceResult<Message[]>>;
  sendMessage(payload: SendMessagePayload): Promise<ServiceResult<Message>>;
  editMessage(
    messageId: string,
    content: string,
  ): Promise<ServiceResult<Message>>;
  deleteMessage(messageId: string): Promise<ServiceResult<Message>>;
  markAsRead(conversationId: string): Promise<ServiceResult<void>>;
  addReaction(
    messageId: string,
    emoji: string,
    userId: string,
  ): Promise<ServiceResult<Message>>;
  createDM(otherUserId: string): Promise<ServiceResult<Conversation>>;
  createGroup(
    name: string,
    members: string[],
    avatar?: File,
  ): Promise<ServiceResult<Conversation>>;
  updateGroup(
    conversationId: string,
    updates: { name?: string; avatar?: File },
  ): Promise<ServiceResult<Conversation>>;
  addGroupMembers(
    conversationId: string,
    members: string[],
  ): Promise<ServiceResult<Conversation>>;
  removeGroupMember(
    conversationId: string,
    userId: string,
  ): Promise<ServiceResult<Conversation>>;
  leaveGroup(conversationId: string): Promise<ServiceResult<Conversation>>;
  searchConversations(
    query: string,
    tab: ConversationTab,
  ): Promise<ServiceResult<Conversation[]>>;
}
