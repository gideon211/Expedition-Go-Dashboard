import { useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import config from "@/config";

const SOCKET_URL = config.api.baseURL.replace("/api", "") || "";

export function useChatSocket(conversationId, userId) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;
    const token = localStorage.getItem("auth_token");
    socketRef.current = io(SOCKET_URL, {
      auth: { userId, role: "supplier", token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
    });
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  useEffect(() => {
    if (!conversationId || !socketRef.current) return;
    socketRef.current.emit("chat:join", conversationId);
    return () => {
      socketRef.current?.emit("chat:leave", conversationId);
    };
  }, [conversationId]);

  const onNewMessage = useCallback((cb) => {
    const handler = (data) => cb(data.message, data.conversationId);
    if (socketRef.current) socketRef.current.on("chat:message", handler);
    return () => socketRef.current?.off("chat:message", handler);
  }, []);

  const onMarkRead = useCallback((cb) => {
    const handler = (data) => cb(data);
    if (socketRef.current) socketRef.current.on("chat:mark-read", handler);
    return () => socketRef.current?.off("chat:mark-read", handler);
  }, []);

  const emitTyping = useCallback((convId) => {
    socketRef.current?.emit("chat:typing", { conversationId: convId });
  }, []);

  const emitMarkRead = useCallback((convId) => {
    socketRef.current?.emit("chat:mark-read", { conversationId: convId });
  }, []);

  const emitDelivered = useCallback((convId, messageIds) => {
    socketRef.current?.emit("chat:delivered", {
      conversationId: convId,
      messageIds: Array.isArray(messageIds) ? messageIds : [messageIds],
    });
  }, []);

  return { onNewMessage, onMarkRead, emitTyping, emitMarkRead, emitDelivered };
}