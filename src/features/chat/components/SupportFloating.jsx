import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  MessageCircle, X, Send, Paperclip, Loader2, MessageSquare,
  Phone, Mail, Clock, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { io } from "socket.io-client";
import config from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { useChatFloatingStore } from "@/stores/chatFloatingStore";
import MessageBubble from "./MessageBubble";
import {
  getConversations,
  getMessages,
  sendMessage,
  markConversationAsRead,
  getOrCreateConversation,
  getUnreadCount,
  uploadChatImage,
} from "../api";

const SOCKET_URL = config.api.baseURL.replace("/api", "") || "";
const ADMIN_SUPPORT_ID = config.support?.adminId || "";
const POLL_INTERVAL = 15000;

const SUPPORT_PHONE = "+233 XX XXX XXXX";
const SUPPORT_EMAIL = "support@expedition-go.com";
const SUPPORT_HOURS = [
  { label: "Mon - Fri", value: "8:00 AM - 6:00 PM" },
  { label: "Saturday", value: "9:00 AM - 2:00 PM" },
  { label: "Sunday", value: "Closed" },
];

function formatDateSeparator(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (msgDate.getTime() === today.getTime()) return "Today";
  if (msgDate.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    month: "long", day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function isNewDay(a, b) {
  const da = new Date(a), db = new Date(b);
  return (
    da.getFullYear() !== db.getFullYear() ||
    da.getMonth() !== db.getMonth() ||
    da.getDate() !== db.getDate()
  );
}

export default function SupportFloating() {
  const user = useAuthStore((state) => state.user);
  const currentUserId = user?.id;

  const { isOpen, pendingConversationId, open: openStore, close: closeStore, clearPendingConversation } = useChatFloatingStore();
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageStatuses, setMessageStatuses] = useState({});
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadBadge, setUnreadBadge] = useState(0);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [input, setInput] = useState("");
  const [welcomePage, setWelcomePage] = useState("main");
  const [slideDir, setSlideDir] = useState("right");

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const isFetchingRef = useRef(false);
  const selectedIdRef = useRef(null);
  const conversationsRef = useRef([]);

  useEffect(() => {
    selectedIdRef.current = selectedConv?.id || null;
  }, [selectedConv?.id]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const loadAndSetMessages = useCallback(async (convId) => {
    if (!convId || isFetchingRef.current) return;
    isFetchingRef.current = true;
    setMessages([]);
    setMessageStatuses({});
    setCursor(null);
    setHasMore(false);
    try {
      const data = await getMessages(convId, null, 50);
      const msgs = data.messages || [];
      setMessages(msgs);
      setCursor(data.cursor || null);
      setHasMore(data.hasMore || false);
      const statuses = {};
      msgs.forEach((m) => { statuses[m.id] = "sent"; });
      setMessageStatuses(statuses);
    } catch {} finally {
      isFetchingRef.current = false;
    }
  }, []);

  const openModal = useCallback(() => {
    openStore();
  }, [openStore]);

  const closeModal = useCallback(() => {
    closeStore();
  }, [closeStore]);

  useEffect(() => {
    if (!isOpen || !currentUserId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setInput("");
      setWelcomePage("main");
      setSelectedConv(null);
      setMessages([]);
      try {
        const convs = await getConversations();
        if (cancelled) return;
        setConversations(convs);
        const state = useChatFloatingStore.getState();
        const targetConvId = state.pendingConversationId;
        if (targetConvId) state.clearPendingConversation();
        let target = null;
        if (convs.length > 0) {
          target = targetConvId
            ? convs.find((c) => c.id === targetConvId) || convs[0]
            : convs[0];
          if (target) {
            setSelectedConv(target);
            await loadAndSetMessages(target.id);
            if (!cancelled) {
              try { await markConversationAsRead(target.id); } catch {}
            }
          }
        }
        if (!cancelled) {
          const badgeCount = convs.reduce((sum, c) => sum + (c.id === target?.id ? 0 : (c.unreadCount || 0)), 0);
          setUnreadBadge(badgeCount);
        }
      } catch {} finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, loadAndSetMessages]);

  useEffect(() => {
    if (!isOpen || !currentUserId) return;
    const token = localStorage.getItem("auth_token");
    const socket = io(SOCKET_URL, {
      auth: { userId: currentUserId, role: "supplier", token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      if (selectedIdRef.current) socket.emit("chat:join", selectedIdRef.current);
    });

    socket.on("chat:message", (data) => {
      const { message: msg, conversationId } = data;
      socket.emit("chat:delivered", { conversationId, messageIds: [msg.id] });
      if (conversationId === selectedIdRef.current) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      } else {
        const existing = conversationsRef.current.find((c) => c.id === conversationId);
        if (!existing || !existing.unreadCount) {
          setUnreadBadge((prev) => prev + 1);
        }
      }
      setConversations((prev) => {
        if (prev.some((c) => c.id === conversationId)) {
          return prev.map((c) =>
            c.id === conversationId ? { ...c, updatedAt: msg.createdAt, messages: [msg], unreadCount: 1 } : c
          );
        }
        return prev;
      });
    });

    socket.on("chat:mark-read", (data) => {
      if (data.conversationId === selectedIdRef.current) {
        setMessageStatuses((prev) => {
          const next = { ...prev };
          (data.messageIds || []).forEach((id) => { if (next[id]) next[id] = "read"; });
          return next;
        });
      }
    });

    return () => {
      if (selectedIdRef.current) socket.emit("chat:leave", selectedIdRef.current);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isOpen, currentUserId]);
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !selectedConv?.id) return;
    socket.emit("chat:join", selectedConv.id);
    return () => { socket.emit("chat:leave", selectedConv.id); };
  }, [selectedConv?.id]);

  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  useEffect(() => {
    if (!currentUserId) return;
    const poll = async () => {
      try {
        const count = await getUnreadCount();
        setUnreadBadge(count);
      } catch {}
    };
    poll();
    const id = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [currentUserId]);

  const handleSend = useCallback(async (content, attachment) => {
    const text = content?.trim();
    if (!text && !attachment) return;
    if (sending) return;
    setSending(true);

    try {
      let conv = selectedConv;

      if (!conv) {
        let adminId = ADMIN_SUPPORT_ID;
        if (!adminId) {
          const adminParticipant = conversations
            .flatMap((c) => c.participants || [])
            .find((p) => p.user?.roles?.includes("admin"));
          adminId = adminParticipant?.userId || "";
        }
        if (!adminId) {
          toast.error("Support is not configured yet");
          setSending(false);
          return;
        }
        conv = await getOrCreateConversation(adminId);
        setSelectedConv(conv);
        setConversations((prev) => [conv, ...prev]);
        if (socketRef.current) socketRef.current.emit("chat:join", conv.id);
      }

      const msg = await sendMessage(conv.id, text || "", attachment);
      setMessages((prev) => [...prev, msg]);
      setMessageStatuses((prev) => ({ ...prev, [msg.id]: "sent" }));
      setConversations((prev) =>
        prev.map((c) => c.id === conv.id ? { ...c, updatedAt: msg.createdAt, messages: [msg] } : c)
      );
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  }, [selectedConv, sending, conversations, loadAndSetMessages]);

  const handleSubmit = useCallback(() => {
    if (!input.trim() || sending) return;
    setInput("");
    handleSend(input);
  }, [input, sending, handleSend]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { url, type } = await uploadChatImage(file);
      await handleSend("", { url, type });
    } catch {
      toast.error("Failed to upload image");
    }
    e.target.value = "";
  }, [handleSend]);

  const handleLoadMore = useCallback(async () => {
    if (!selectedConv?.id || !hasMore || loadingMore || isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoadingMore(true);
    try {
      const data = await getMessages(selectedConv.id, cursor, 50);
      const msgs = data.messages || [];
      setMessages((prev) => [...msgs, ...prev]);
      setCursor(data.cursor || null);
      setHasMore(data.hasMore || false);
    } catch {} finally {
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [selectedConv?.id, hasMore, loadingMore, cursor]);

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el || !hasMore || loadingMore) return;
    if (el.scrollTop < 50) {
      const prevHeight = el.scrollHeight;
      handleLoadMore();
      requestAnimationFrame(() => { el.scrollTop = el.scrollHeight - prevHeight; });
    }
  }, [hasMore, loadingMore, handleLoadMore]);

  const showContactPage = useCallback(() => {
    setSlideDir("right");
    setWelcomePage("contact");
  }, []);

  const showMainPage = useCallback(() => {
    setSlideDir("left");
    setWelcomePage("main");
  }, []);

  const focusInput = useCallback(() => {
    const ta = document.querySelector("#support-floating-input");
    ta?.focus();
  }, []);

  const otherParticipant = selectedConv?.participants?.find(
    (p) => p.userId !== currentUserId
  )?.user;

  return (
    <>
      {/* Floating button — circular icon, text expands on hover */}
      <button
        onClick={openModal}
        className={cn(
          "group fixed bottom-6 right-6 z-50 flex h-14 items-center rounded-full bg-[#044b3b] text-white shadow-lg transition-[width,box-shadow,transform] duration-300 ease-out hover:shadow-xl active:scale-95",
          "w-14 hover:w-[180px]",
          isOpen && "hidden"
        )}
      >
        <span className="relative flex h-full w-14 shrink-0 items-center justify-center">
          <MessageCircle className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
          {unreadBadge > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-white">
              {unreadBadge > 99 ? "99+" : unreadBadge}
            </span>
          )}
        </span>
        <div className="overflow-hidden transition-all duration-300 ease-out max-w-0 group-hover:max-w-[120px]">
          <span className="block whitespace-nowrap pr-5 text-sm font-semibold opacity-0 transition-opacity duration-200 delay-100 group-hover:opacity-100">
            Need help?
          </span>
        </div>
      </button>

      {/* Backdrop + Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50" onClick={closeModal}>
          <div className="absolute bottom-6 right-6 w-[380px] max-w-[calc(100vw-36px)] origin-bottom-right animate-[supportSlideUp_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl" style={{ height: "528px", maxHeight: "calc(100vh-120px)" }}>
            {/* Header — rounded-t-2xl fills top corners, no white gap */}
            <div className="flex shrink-0 items-center justify-between rounded-t-2xl bg-[#044b3b] px-4 py-3 text-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold leading-tight">Admin Support</p>
                  <p className="truncate text-[10px] text-white/70 leading-tight">We typically reply in minutes</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/20 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-hidden">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <svg className="h-6 w-6 animate-spin text-[#044b3b]" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-xs text-gray-400">Loading...</span>
                  </div>
                </div>
              ) : selectedConv ? (
                /* ─── Messages view ─── */
                <div className="flex h-full flex-col">
                  <div
                    ref={messagesContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto bg-gray-50/50 px-4 py-3"
                  >
                    {hasMore && (
                      <div className="mb-3 flex justify-center">
                        <button
                          onClick={handleLoadMore}
                          disabled={loadingMore}
                          className="rounded-full bg-white px-3 py-1 text-[10px] font-medium text-[#044b3b] shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
                        >
                          {loadingMore ? "Loading..." : "Load older messages"}
                        </button>
                      </div>
                    )}
                    <div className="space-y-1">
                      {messages.map((msg, idx) => {
                        const isOwn = currentUserId ? msg.senderId === currentUserId : false;
                        const prevMsg = idx > 0 ? messages[idx - 1] : null;
                        const showDateSep = prevMsg && isNewDay(prevMsg.createdAt, msg.createdAt);
                        const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId || showDateSep;
                        return (
                          <div key={msg.id}>
                            {(showDateSep || idx === 0) && (
                              <div className="my-3 flex items-center gap-3">
                                <div className="flex-1 border-t border-gray-200" />
                                <span className="shrink-0 text-[10px] font-medium text-gray-400">
                                  {formatDateSeparator(msg.createdAt)}
                                </span>
                                <div className="flex-1 border-t border-gray-200" />
                              </div>
                            )}
                            <MessageBubble
                              message={msg}
                              isOwn={isOwn}
                              status={isOwn ? messageStatuses[msg.id] : undefined}
                              showAvatar={showAvatar && !isOwn}
                              senderAvatar={isOwn ? undefined : (msg.sender?.photoURL || otherParticipant?.photoURL)}
                              senderName={isOwn ? "You" : "Admin Support"}
                              compact
                            />
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                  <InputBar value={input} onChange={setInput} onSend={handleSubmit} onKeyDown={handleKeyDown} onFileChange={handleFileChange} sending={sending} fileInputRef={fileInputRef} />
                </div>
              ) : (
                /* ─── Welcome state ─── */
                <div key={welcomePage} className={cn(
                  "flex h-full flex-col",
                  welcomePage === "contact" ? "animate-[supportSlideInFromRight_0.22s_ease-out]" : slideDir === "left" ? "animate-[supportSlideInFromLeft_0.22s_ease-out]" : ""
                )}>
                  {welcomePage === "main" ? (
                    /* ── Main welcome ── */
                    <>
                      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#044b3b] to-[#0f766e] shadow-lg shadow-[#044b3b]/20">
                          <MessageCircle className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="mt-4 text-base font-bold text-gray-900">Hi! Welcome to Expedition Go</h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-gray-500 max-w-[260px]">
                          We're here to help. Choose an option below or send us a message.
                        </p>

                        <div className="mt-6 w-full max-w-[280px] space-y-2.5">
                          <button
                            onClick={showContactPage}
                            className="group flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition-all duration-200 hover:border-[#044b3b]/30 hover:shadow-md hover:-translate-y-0.5"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#044b3b]/10 transition-colors group-hover:bg-[#044b3b]/15">
                              <Phone className="h-4 w-4 text-[#044b3b]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900">Contact Us</p>
                              <p className="truncate text-[11px] text-gray-500">Call or email our support team</p>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#044b3b]" />
                          </button>

                          <button
                            onClick={focusInput}
                            className="group flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition-all duration-200 hover:border-[#044b3b]/30 hover:shadow-md hover:-translate-y-0.5"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#044b3b]/10 transition-colors group-hover:bg-[#044b3b]/15">
                              <MessageCircle className="h-4 w-4 text-[#044b3b]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900">Send a Message</p>
                              <p className="truncate text-[11px] text-gray-500">Chat with us in real-time</p>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#044b3b]" />
                          </button>
                        </div>
                      </div>
                      <InputBar value={input} onChange={setInput} onSend={handleSubmit} onKeyDown={handleKeyDown} onFileChange={handleFileChange} sending={sending} fileInputRef={fileInputRef} inputId="support-floating-input" />
                    </>
                  ) : (
                    /* ── Contact details page ── */
                    <>
                      <div className="flex-1 overflow-y-auto px-5 py-4">
                        <button
                          onClick={showMainPage}
                          className="mb-4 flex items-center gap-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-[#044b3b]"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                          Back
                        </button>

                        <h3 className="text-base font-bold text-gray-900">Get in Touch</h3>
                        <p className="mt-1 text-xs text-gray-500">We're available during business hours</p>

                        <div className="mt-4 space-y-3">
                          {/* Phone card */}
                          <a
                            href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`}
                            className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-[#044b3b]/30 hover:shadow-md hover:-translate-y-0.5"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#044b3b]/10 transition-colors group-hover:bg-[#044b3b]/15">
                              <Phone className="h-5 w-5 text-[#044b3b]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-gray-500">Phone</p>
                              <p className="mt-0.5 text-sm font-semibold text-gray-900">{SUPPORT_PHONE}</p>
                            </div>
                            <span className="shrink-0 rounded-full bg-[#044b3b]/10 px-2 py-0.5 text-[10px] font-medium text-[#044b3b] transition-colors group-hover:bg-[#044b3b]/15">
                              Tap to call
                            </span>
                          </a>

                          {/* Email card */}
                          <a
                            href={`mailto:${SUPPORT_EMAIL}`}
                            className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-[#044b3b]/30 hover:shadow-md hover:-translate-y-0.5"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#044b3b]/10 transition-colors group-hover:bg-[#044b3b]/15">
                              <Mail className="h-5 w-5 text-[#044b3b]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-gray-500">Email</p>
                              <p className="mt-0.5 text-sm font-semibold text-gray-900">{SUPPORT_EMAIL}</p>
                            </div>
                            <span className="shrink-0 rounded-full bg-[#044b3b]/10 px-2 py-0.5 text-[10px] font-medium text-[#044b3b] transition-colors group-hover:bg-[#044b3b]/15">
                              Tap to email
                            </span>
                          </a>
                        </div>

                        {/* Business hours */}
                        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                          <div className="flex items-center gap-2.5">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-xs font-semibold text-gray-700">Business Hours</span>
                          </div>
                          <div className="mt-3 space-y-1.5">
                            {SUPPORT_HOURS.map((item) => (
                              <div key={item.label} className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">{item.label}</span>
                                <span className={cn(
                                  "font-medium",
                                  item.value === "Closed" ? "text-red-500" : "text-gray-800"
                                )}>
                                  {item.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <InputBar value={input} onChange={setInput} onSend={handleSubmit} onKeyDown={handleKeyDown} onFileChange={handleFileChange} sending={sending} fileInputRef={fileInputRef} />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      <style>{`
        @keyframes supportSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes supportSlideInFromRight {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes supportSlideInFromLeft {
          from { opacity: 0; transform: translateX(-24px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

function InputBar({ value, onChange, onSend, onKeyDown, onFileChange, sending, fileInputRef, inputId }) {
  const handleChange = useCallback((e) => onChange(e.target.value), [onChange]);

  return (
    <div className="shrink-0 border-t border-gray-200 bg-white px-3 py-2.5">
      <div className="flex items-end gap-1.5">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-[#044b3b]"
          type="button"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
        <div className="relative flex-1">
          <textarea
            id={inputId}
            value={value}
            onChange={handleChange}
            onKeyDown={onKeyDown}
            placeholder="Type a message..."
            rows={1}
            disabled={sending}
            className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:border-[#044b3b] focus-visible:bg-white transition-colors disabled:opacity-60"
            style={{ maxHeight: "80px" }}
          />
        </div>
        <button
          onClick={onSend}
          disabled={!value.trim() || sending}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#044b3b] text-white shadow-sm transition-all hover:bg-[#033629] disabled:cursor-not-allowed disabled:opacity-40"
          type="button"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}






