import { createContext, useContext } from 'react';

export const MessageRealtimeContext = createContext({
  connected: false,
  lastIncomingMessageId: null as string | null,
});
export const useMessageRealtimeState = () => useContext(MessageRealtimeContext);
