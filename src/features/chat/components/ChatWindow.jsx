import { useState, useRef, useEffect, useCallback } from "react";
import { Send, ChevronDown, Paperclip } from "lucide-react";
import { toast } from "sonner";
import MessageBubble from "./MessageBubble";
import { useChatSocket } from "../hooks/useChatSocket";
import { uploadChatImage } from "../api";

function formatDateSeparator(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (msgDate.getTime() === today.getTime()) return "Today";
  if (msgDate.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
}

function isNewDay(a, b) {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() !== db.getFullYear() || da.getMonth() !== db.getMonth() || da.getDate() !== db.getDate();
}

function formatLastSeen(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return "online";
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (msgDate.getTime() === today.getTime()) return "last seen today at " + time;
  if (msgDate.getTime() === yesterday.getTime()) return "last seen yesterday at " + time;
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return "last seen " + date + " at " + time;
}

export default function ChatWindow({ conversation, messages, messageStatuses, onSendMessage, onLoadMore, hasMore, loadingMore, sending, currentUserId }) {
  const [input, setInput] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const prevCountRef = useRef(messages.length);
  const prevConvIdRef = useRef(null);

  const { onNewMessage, emitTyping, emitMarkRead } = useChatSocket(conversation?.id, currentUserId);

  const isNearBottom = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  const scrollToBottom = useCallback((force) => {
    if (force || isNearBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: force ? "auto" : "smooth" });
    }
  }, [isNearBottom]);

  useEffect(() => {
    if (conversation?.id && prevConvIdRef.current !== conversation?.id) {
      prevConvIdRef.current = conversation?.id;
      requestAnimationFrame(() => scrollToBottom(true));
    }
    prevCountRef.current = messages.length;
  }, [messages.length, conversation?.id, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    setShowScrollBtn(!isNearBottom());
    if (el.scrollTop < 50 && hasMore && !loadingMore && onLoadMore) {
      const prevHeight = el.scrollHeight;
      onLoadMore();
      requestAnimationFrame(() => { el.scrollTop = el.scrollHeight - prevHeight; });
    }
  }, [hasMore, loadingMore, onLoadMore, isNearBottom]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setInput("");
    await onSendMessage(trimmed);
    requestAnimationFrame(() => scrollToBottom(true));
  }, [input, sending, onSendMessage, scrollToBottom]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (conversation?.id) emitTyping(conversation.id);
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px";
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !conversation?.id) return;
    try {
      const { url, type } = await uploadChatImage(file);
      await onSendMessage("", { url, type });
    } catch {
      toast.error("Failed to upload image");
    }
    e.target.value = "";
  };

  const otherParticipant = conversation?.participants?.find(
    (p) => p.userId !== currentUserId
  )?.user || conversation?.participants?.[0]?.user;
  const headerName = otherParticipant?.name || otherParticipant?.email || conversation?.title || "Chat";

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gray-50 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
          <Send className="h-6 w-6 text-[#044b3b]" />
        </div>
        <p className="mt-4 text-sm font-medium text-gray-600">Select a conversation</p>
        <p className="mt-1 text-xs text-gray-400">Choose a conversation to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-5 py-3">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#044b3b] text-sm font-bold text-white shadow-sm">
          <span>{headerName.charAt(0).toUpperCase()}</span>
          {otherParticipant?.photoURL && (
            <img
              src={otherParticipant.photoURL}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">{headerName}</p>
          <p className="text-xs text-gray-400">{formatLastSeen(otherParticipant?.lastLoginAt)}</p>
        </div>
      </div>

      <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto bg-gray-50/50">
        <div className="px-4 py-3">
          {hasMore && (
            <div className="mb-4 flex justify-center">
              <button onClick={onLoadMore} disabled={loadingMore} className="rounded-full bg-white px-4 py-1.5 text-xs text-[#044b3b] shadow-sm hover:bg-gray-50 disabled:opacity-50 transition-colors">
                {loadingMore ? "Loading..." : "Load older messages"}
              </button>
            </div>
          )}
          <div className="space-y-1">
            {messages.map((msg, idx) => {
              const isOwn = currentUserId ? msg.senderId === currentUserId : false;
              const prevMsg = idx > 0 ? messages[idx - 1] : null;
              const showDateSep = prevMsg && isNewDay(prevMsg.createdAt, msg.createdAt);
              const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId || isNewDay(prevMsg.createdAt, msg.createdAt);
              return (
                <div key={msg.id}>
                  {(showDateSep || idx === 0) && (
                    <div className="my-4 flex items-center gap-3">
                      <div className="flex-1 border-t border-gray-200" />
                      <span className="shrink-0 text-[11px] font-medium text-gray-400">{formatDateSeparator(msg.createdAt)}</span>
                      <div className="flex-1 border-t border-gray-200" />
                    </div>
                  )}
                  <div className="py-0.5">
                    <MessageBubble
                      message={msg}
                      isOwn={isOwn}
                      status={isOwn ? messageStatuses[msg.id] : undefined}
                      showAvatar={showAvatar && !isOwn}
                      senderAvatar={isOwn ? undefined : (msg.sender?.photoURL || otherParticipant?.photoURL)}
                      senderName={isOwn ? "You" : headerName}
                    />
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {showScrollBtn && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-20 right-8 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ChevronDown className="h-4 w-4 text-gray-600" />
        </button>
      )}

      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <div className="flex items-end gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full text-gray-400 hover:text-[#044b3b] hover:bg-gray-100 transition-colors"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" />
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              disabled={sending}
              className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:border-[#044b3b] focus-visible:bg-white transition-colors disabled:opacity-50"
              style={{ maxHeight: "120px" }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-[#044b3b] text-white transition-all hover:bg-[#033a2e] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            <Send className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}