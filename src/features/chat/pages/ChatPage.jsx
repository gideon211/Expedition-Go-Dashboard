import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import ConversationList from "../components/ConversationList";
import ChatWindow from "../components/ChatWindow";
import CustomerDetailsPanel from "../components/CustomerDetailsPanel";
import { getConversations, getOrCreateConversation, getMessages, sendMessage, markConversationAsRead, deleteConversation } from "../api";
import { useChatSocket } from "../hooks/useChatSocket";

const PAGE_SIZE = 50;
const TABS = [
  { key: "all", label: "All Messages" },
  { key: "unread", label: "Unread" },
];

export default function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const currentUserId = user?.id;

  const tabParam = searchParams.get("tab") === "unread" ? "unread" : "all";
  const customerIdParam = searchParams.get("customerId");

  const [activeTab, setActiveTab] = useState(tabParam);
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
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const isFetchingRef = useRef(false);
  const lastProcessedCustomerId = useRef(null);

  const { onNewMessage, onMarkRead, onDelivered, emitMarkRead, emitDelivered } = useChatSocket(selectedConv?.id, currentUserId);

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

  // Auto-create conversation from customerId param
  useEffect(() => {
    if (!customerIdParam || !currentUserId) return;
    if (lastProcessedCustomerId.current === customerIdParam) return;
    lastProcessedCustomerId.current = customerIdParam;

    const existing = conversations.find(
      (c) =>
        c.participants?.some((p) => p.userId === customerIdParam)
    );

    if (existing) {
      handleSelectConversation(existing);
      return;
    }

    getOrCreateConversation(customerIdParam)
      .then((conv) => {
        setConversations((prev) => {
          if (prev.some((c) => c.id === conv.id)) return prev;
          return [...prev, conv];
        });
        handleSelectConversation(conv);
      })
      .catch(() => {});
  }, [customerIdParam, currentUserId, conversations]);

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
      const otherParticipant = conv?.participants?.find(
        (p) => currentUserId ? p.userId !== currentUserId : p.user.roles?.includes('admin')
      );
      const lastReadAt = otherParticipant?.lastReadAt ? new Date(otherParticipant.lastReadAt).getTime() : 0;
      msgs.forEach((m) => {
        initialStatuses[m.id] = new Date(m.createdAt).getTime() <= lastReadAt ? "read" : "sent";
      });
      setMessageStatuses(initialStatuses);
    } catch {
      // handled globally
    } finally {
      setLoadingMsgs(false);
      isFetchingRef.current = false;
    }
  }, [currentUserId]);

  const handleSelectConversation = useCallback(async (conv) => {
    setSelectedConv(conv);
    setShowDetailsPanel(false);
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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedConv(null);
    setMessages([]);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tab);
      return next;
    }, { replace: true });
  };

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
      const otherParticipant = selectedConv?.participants?.find(
        (p) => currentUserId ? p.userId !== currentUserId : p.user.roles?.includes('admin')
      );
      const lastReadAt = otherParticipant?.lastReadAt ? new Date(otherParticipant.lastReadAt).getTime() : 0;
      const statusUpdates = {};
      msgs.forEach((m) => {
        if (!messageStatuses[m.id]) {
          statusUpdates[m.id] = new Date(m.createdAt).getTime() <= lastReadAt ? "read" : "sent";
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

  const handleDeleteConversation = useCallback(async (conv) => {
    try {
      await deleteConversation(conv.id);
      setConversations((prev) => prev.filter((c) => c.id !== conv.id));
      if (selectedConv?.id === conv.id) {
        setSelectedConv(null);
        setMessages([]);
      }
    } catch {
      // handled globally
    }
  }, [selectedConv?.id]);

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
    if (!onDelivered) return;
    const unsub = onDelivered((data) => {
      setMessageStatuses((prev) => {
        const next = { ...prev };
        (data.messageIds || []).forEach((id) => {
          if (next[id] === "sent") next[id] = "delivered";
        });
        return next;
      });
    });
    return unsub;
  }, [onDelivered]);

  useEffect(() => {
    if (!selectedConv?.id || !currentUserId) return;
    emitMarkRead(selectedConv.id);
  }, [selectedConv?.id, currentUserId, emitMarkRead]);

  const filteredConversations = activeTab === "unread"
    ? conversations.filter((c) => (c.unreadCount ?? 0) > 0)
    : conversations;

  const otherParticipant = selectedConv?.participants?.find(
    (p) => currentUserId ? p.userId !== currentUserId : false
  )?.user;
  const isCustomerConv = Boolean(otherParticipant?.roles?.includes("customer"));

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="flex w-[340px] shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-1.5 bg-gray-100 rounded-xl p-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const unreadCount = conversations.filter((c) => (c.unreadCount ?? 0) > 0).length;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                  {tab.key === "unread" && unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full px-1.5 bg-[#044b3b] text-white text-[10px] font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationList
            conversations={filteredConversations}
            selectedId={selectedConv?.id}
            onSelect={handleSelectConversation}
            onDelete={handleDeleteConversation}
            loading={loadingConvs}
            currentUserId={currentUserId}
            emptyMessage={activeTab === "unread" ? "No unread messages" : "No conversations yet"}
          />
        </div>
      </div>
      <div className="relative flex-1">
        <ChatWindow
          conversation={selectedConv}
          messages={messages}
          messageStatuses={messageStatuses}
          onSendMessage={handleSend}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          loading={loadingMsgs}
          loadingMore={loadingMore}
          sending={sending}
          currentUserId={currentUserId}
          onOpenDetails={() => setShowDetailsPanel((v) => !v)}
          showDetailsButton={isCustomerConv}
        />
      </div>
      {showDetailsPanel && isCustomerConv && (
        <CustomerDetailsPanel
          conversation={selectedConv}
          currentUserId={currentUserId}
          onClose={() => setShowDetailsPanel(false)}
        />
      )}
    </div>
  );
}
