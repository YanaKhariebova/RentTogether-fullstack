export type ChatMessage = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
};

export type ConversationPreview = {
  id: string;
  bookingId: string;
  itemTitle: string;
  otherParticipantName: string;
  lastMessage: ChatMessage | null;
  unreadCount: number;
  updatedAt: string;
};
