import { useState, useCallback, useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import ConversationList from "../components/ConversationList";
import ChatWindow from "../components/ChatWindow";
import { getConversations, getMessages, sendMessage, markConversationAsRead } from "../api";
import { useChatSocket } from "../hooks/useChatSocket";

const PAGE_SIZE = 50;

export default function ChatPage() {
  const user = useAuthStore((state) => state.user);
  const currentUserId = user?.id; // DB CUID, not Firebase UID

  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageStatuses, setMessageStatuses] = useState({});
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const isFetchingRef = useRef(false);

  const { onNewMessage, onMarkRead, emitMarkRead, emitDelivered } = useChatSocket(selectedConv?.id, currentUserId);

  const loadConversations = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const data = await getConversations();
      setConversations(data);
    } catch {
      // handled globally
    } finally {
      setLoadingConvs(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 30000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  const loadMessages = useCallback(async (convId, conv) => {
    if (!convId || isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoadingMsgs(true);
    setMessageStatuses({});
    setMessages([]);
    setCursor(null);
    setHasMore(false);
    try {
      const data = await getMessages(convId, null, PAGE_SIZE);
      const msgs = data.messages || [];
      setMessages(msgs);
      setCursor(data.cursor || null);
      setHasMore(data.hasMore || false);
      const initialStatuses = {};
      msgs.forEach((m) => {
        initialStatuses[m.id] = "sent";
      });
      setMessageStatuses(initialStatuses);
    } catch {
      // handled globally
    } finally {
      setLoadingMsgs(false);
      isFetchingRef.current = false;
    }
  }, []);

  const handleSelectConversation = useCallback(async (conv) => {
    setSelectedConv(conv);
    await loadMessages(conv.id, conv);
    try {
      await markConversationAsRead(conv.id);
      emitMarkRead(conv.id);
    } catch {
      // silent
    }
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
    );
  }, [loadMessages, emitMarkRead]);

  const handleLoadMore = useCallback(async () => {
    if (!selectedConv?.id || !hasMore || loadingMore || isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoadingMore(true);
    try {
      const data = await getMessages(selectedConv.id, cursor, PAGE_SIZE);
      const msgs = data.messages || [];
      setMessages((prev) => [...msgs, ...prev]);
      setCursor(data.cursor || null);
      setHasMore(data.hasMore || false);
      const statusUpdates = {};
      msgs.forEach((m) => {
        if (!messageStatuses[m.id]) {
          statusUpdates[m.id] = "sent";
        }
      });
      if (Object.keys(statusUpdates).length > 0) {
        setMessageStatuses((prev) => ({ ...prev, ...statusUpdates }));
      }
    } catch {
      // handled globally
    } finally {
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [selectedConv?.id, hasMore, loadingMore, cursor, messageStatuses]);

  const handleSend = useCallback(async (content, attachment) => {
    if (!selectedConv?.id || sending) return;
    setSending(true);
    try {
      const msg = await sendMessage(selectedConv.id, content, attachment);
      setMessages((prev) => [...prev, msg]);
      setMessageStatuses((prev) => ({ ...prev, [msg.id]: "sent" }));
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConv.id ? { ...c, updatedAt: msg.createdAt, messages: [msg] } : c
        )
      );
    } catch {
      // handled globally
    } finally {
      setSending(false);
    }
  }, [selectedConv?.id, sending]);

  useEffect(() => {
    if (!onNewMessage) return;
    const unsub = onNewMessage((msg, convId) => {
      emitDelivered(convId, msg.id);
      if (convId === selectedConv?.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId ? { ...c, updatedAt: msg.createdAt, messages: [msg] } : c
          )
        );
      } else {
        setConversations((prev) => {
          if (prev.some((c) => c.id === convId)) {
            return prev.map((c) =>
              c.id === convId ? { ...c, updatedAt: msg.createdAt, messages: [msg] } : c
            );
          }
          return prev;
        });
        loadConversations();
      }
    });
    return unsub;
  }, [onNewMessage, selectedConv?.id, loadConversations]);

  useEffect(() => {
    if (!onMarkRead) return;
    const unsub = onMarkRead((data) => {
      setMessageStatuses((prev) => {
        const next = { ...prev };
        (data.messageIds || []).forEach((id) => {
          if (next[id]) next[id] = "read";
        });
        return next;
      });
    });
    return unsub;
  }, [onMarkRead]);

  useEffect(() => {
    if (!selectedConv?.id || !currentUserId) return;
    emitMarkRead(selectedConv.id);
  }, [selectedConv?.id, currentUserId, emitMarkRead]);

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="flex w-[340px] shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3.5">
          <h2 className="text-base font-semibold text-gray-900">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationList
            conversations={conversations}
            selectedId={selectedConv?.id}
            onSelect={handleSelectConversation}
            loading={loadingConvs}
            currentUserId={currentUserId}
          />
        </div>
      </div>
      <div className="relative flex-1">
        {loadingMsgs ? (
          <div className="flex h-full items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-3">
              <svg className="h-6 w-6 animate-spin text-[#044b3b]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm text-gray-500">Loading messages...</span>
            </div>
          </div>
        ) : (
          <ChatWindow
            conversation={selectedConv}
            messages={messages}
            messageStatuses={messageStatuses}
            onSendMessage={handleSend}
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
            loadingMore={loadingMore}
            sending={sending}
            currentUserId={currentUserId}
          />
        )}
      </div>
    </div>
  );
}
