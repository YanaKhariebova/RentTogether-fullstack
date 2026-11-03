export type ChatMessage = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  editedAt: string | null;
  replyTo: { id: string; senderId: string; body: string } | null;
};

export type ConversationPreview = {
  id: string;
  bookingId: string;
  itemTitle: string;
  otherParticipantName: string;
  bookingStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'ACTIVE' | 'COMPLETED';
  lastMessage: ChatMessage | null;
  unreadCount: number;
  updatedAt: string;
};

export type Conversation = {
  id: string;
  bookingId: string;
  createdAt: string;
  updatedAt: string;
};
