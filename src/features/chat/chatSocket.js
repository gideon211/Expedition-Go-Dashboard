import { io } from "socket.io-client";
import config from "@/config";

const SOCKET_URL = config.api.baseURL.replace("/api", "") || "";
let socket = null;
let currentUserId = null;

export function getChatSocket(userId) {
  if (!socket || currentUserId !== userId) {
    if (socket) {
      socket.disconnect();
    }
    const token = localStorage.getItem("auth_token");
    socket = io(SOCKET_URL, {
      auth: { userId, role: "supplier", token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
    });
    currentUserId = userId;
  }
  return socket;
}

export function isChatSocketConnected() {
  return socket?.connected || false;
}

export function disconnectChatSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentUserId = null;
  }
}
