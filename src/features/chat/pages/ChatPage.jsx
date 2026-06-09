import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
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
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const currentUserId = user?.id;

  const tabParam = searchParams.get("tab") === "unread" ? "unread" : "all";
  const customerIdParam = searchParams.get("customerId");

  const [activeTab, setActiveTab] = useState(tabParam);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const isFetchingRef = useRef(false);
  const lastProcessedCustomerId = useRef(null);

  const conversations = useChatStore((s) => s.conversations);
  const selectedConv = useChatStore((s) => s.selectedConv);
  const messages = useChatStore((s) => s.messages);
  const messageStatuses = useChatStore((s) => s.messageStatuses);
  const cursor = useChatStore((s) => s.cursor);
  const hasMore = useChatStore((s) => s.hasMore);
  const loadingConvs = useChatStore((s) => s.loadingConvs);
  const loadingMsgs = useChatStore((s) => s.loadingMsgs);
  const loaded = useChatStore((s) => s.loaded);

  const setConversations = useChatStore((s) => s.setConversations);
  const appendConversation = useChatStore((s) => s.appendConversation);
  const touchConversation = useChatStore((s) => s.touchConversation);
  const removeConversation = useChatStore((s) => s.removeConversation);
  const setSelectedConv = useChatStore((s) => s.setSelectedConv);
  const setMessages = useChatStore((s) => s.setMessages);
  const addMessage = useChatStore((s) => s.addMessage);
  const appendMessages = useChatStore((s) => s.appendMessages);
  const setMessageStatuses = useChatStore((s) => s.setMessageStatuses);
  const updateMessageStatuses = useChatStore((s) => s.updateMessageStatuses);
  const setCursor = useChatStore((s) => s.setCursor);
  const setHasMore = useChatStore((s) => s.setHasMore);
  const setLoadingMsgs = useChatStore((s) => s.setLoadingMsgs);
  const markAsRead = useChatStore((s) => s.markAsRead);
  const resetChat = useChatStore((s) => s.resetChat);

  const { onNewMessage, onMarkRead, onDelivered, emitMarkRead, emitDelivered } = useChatSocket(selectedConv?.id, currentUserId);

  const loadConversations = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const data = await getConversations();
      setConversations(data);
    } catch {
      // handled globally
    }
  }, [currentUserId, setConversations]);

  // Initial fetch only if store is empty
  useEffect(() => {
    if (!currentUserId) return;
    if (!loaded) {
      loadConversations();
    }
  }, [currentUserId, loaded, loadConversations]);

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
        appendConversation(conv);
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
  }, [currentUserId, setMessages, setCursor, setHasMore, setMessageStatuses, setLoadingMsgs]);

  const handleSelectConversation = useCallback(async (conv) => {
    setSelectedConv(conv);
    setShowDetailsPanel(false);
    await loadMessages(conv.id, conv);
    try {
      await markConversationAsRead(conv.id);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      emitMarkRead(conv.id);
    } catch {
      // silent
    }
    markAsRead(conv.id);
  }, [loadMessages, emitMarkRead, setSelectedConv, markAsRead, queryClient]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    resetChat();
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
      appendMessages(msgs);
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
        updateMessageStatuses((prev) => ({ ...prev, ...statusUpdates }));
      }
    } catch {
      // handled globally
    } finally {
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [selectedConv?.id, hasMore, loadingMore, cursor, messageStatuses, appendMessages, setCursor, setHasMore, updateMessageStatuses, currentUserId]);

  const handleSend = useCallback(async (content, attachment) => {
    if (!selectedConv?.id || sending) return;
    setSending(true);
    try {
      const msg = await sendMessage(selectedConv.id, content, attachment);
      addMessage(msg);
      updateMessageStatuses((prev) => ({ ...prev, [msg.id]: "sent" }));
      touchConversation(selectedConv.id, msg);
    } catch {
      // handled globally
    } finally {
      setSending(false);
    }
  }, [selectedConv?.id, sending, addMessage, updateMessageStatuses, touchConversation]);

  const handleDeleteConversation = useCallback(async (conv) => {
    try {
      await deleteConversation(conv.id);
      removeConversation(conv.id);
      if (selectedConv?.id === conv.id) {
        resetChat();
      }
    } catch {
      // handled globally
    }
  }, [selectedConv?.id, removeConversation, resetChat]);

  useEffect(() => {
    if (!onNewMessage) return;
    const unsub = onNewMessage((msg, convId) => {
      emitDelivered(convId, msg.id);
      if (convId === selectedConv?.id) {
        addMessage(msg);
        touchConversation(convId, msg);
      } else {
        touchConversation(convId, msg);
      }
    });
    return unsub;
  }, [onNewMessage, selectedConv?.id, addMessage, touchConversation, emitDelivered]);

  useEffect(() => {
    if (!onMarkRead) return;
    const unsub = onMarkRead((data) => {
      updateMessageStatuses((prev) => {
        const next = { ...prev };
        (data.messageIds || []).forEach((id) => {
          if (next[id]) next[id] = "read";
        });
        return next;
      });
    });
    return unsub;
  }, [onMarkRead, updateMessageStatuses]);

  useEffect(() => {
    if (!onDelivered) return;
    const unsub = onDelivered((data) => {
      updateMessageStatuses((prev) => {
        const next = { ...prev };
        (data.messageIds || []).forEach((id) => {
          if (next[id] === "sent") next[id] = "delivered";
        });
        return next;
      });
    });
    return unsub;
  }, [onDelivered, updateMessageStatuses]);

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
    <div className="p-4 h-[calc(100vh-64px)]">
      <div className="flex h-full rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex w-[340px] shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-1.5 bg-white rounded-xl p-1 border border-gray-200">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const unreadCount = conversations.filter((c) => (c.unreadCount ?? 0) > 0).length;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-[#044b3b] text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                  {tab.key === "unread" && unreadCount > 0 && (
                    <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full px-1.5 text-[10px] font-bold ${
                      isActive
                        ? "bg-white text-[#044b3b]"
                        : "bg-gray-200 text-gray-600"
                    }`}>
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
    </div>
  );
}
