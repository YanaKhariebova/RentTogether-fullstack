import type { ConversationPreview } from '../types/message';

export function orderConversations(conversations: ConversationPreview[]) {
  return [...conversations].sort((first, second) => {
    const unreadDifference = Number(second.unreadCount > 0) - Number(first.unreadCount > 0);
    if (unreadDifference) return unreadDifference;

    const dateDifference = second.updatedAt.localeCompare(first.updatedAt);
    return dateDifference || second.id.localeCompare(first.id);
  });
}

export function shouldPlayMessageTone({
  previousCount,
  unreadCount,
  isPageVisible,
}: {
  previousCount: number | null;
  unreadCount: number;
  isPageVisible: boolean;
}) {
  return previousCount !== null && unreadCount > previousCount && isPageVisible;
}
