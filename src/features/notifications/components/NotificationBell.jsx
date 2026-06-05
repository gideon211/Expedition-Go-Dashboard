import { useEffect, useRef, useState } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useChatFloatingStore } from "@/stores/chatFloatingStore";
import { formatDateTime } from "@/lib/utils";
import { NOTIFICATION_TYPES } from "../constants";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "../hooks/useNotifications";

export default function NotificationBell() {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);

  const { data, isLoading, isFetching, isError } = useNotifications({ limit: 8 });
  const markAsRead = useMarkNotificationRead();
  const markAllAsRead = useMarkAllNotificationsRead();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead.mutateAsync(notification.id);
    }

    setOpen(false);

    if (notification.backendType === "NEW_MESSAGE") {
      useChatFloatingStore.getState().open(notification.data?.conversationId);
      return;
    }

    if (notification.action) {
      navigate(notification.action);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    await markAllAsRead.mutateAsync();
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative p-2 text-[#6f6f6f] hover:text-[#1e293b] hover:bg-[#f8fafc] rounded-lg transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-[#dc3545] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl border border-[#eaeaea] shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#eaeaea]">
            <div>
              <p className="text-sm font-semibold text-[#1e293b]">Notifications</p>
              <p className="text-xs text-[#64748b]">
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : isFetching && !isLoading
                    ? "Updating..."
                    : "You're all caught up"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={markAllAsRead.isPending}
                className="flex items-center gap-1 text-xs font-medium text-[#044b3b] hover:underline disabled:opacity-60"
              >
                {markAllAsRead.isPending ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Check size={12} />
                )}
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-sm text-[#64748b]">
                <Loader2 size={18} className="animate-spin mx-auto mb-2 text-[#044b3b]" />
                Loading notifications...
              </div>
            ) : isError ? (
              <div className="px-4 py-8 text-center text-sm text-[#64748b]">
                Unable to load notifications right now.
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[#64748b]">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notification) => {
                const typeConfig = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.system;
                const TypeIcon = typeConfig.icon;

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[#f8fafc] transition-colors border-b border-[#eaeaea] last:border-0 ${
                      notification.read ? "bg-white" : "bg-[#f8fafc]/70"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${typeConfig.color}`}
                    >
                      <TypeIcon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-[#044b3b] flex-shrink-0" />
                        )}
                        <p className="text-sm font-medium text-[#1e293b] truncate">{notification.title}</p>
                      </div>
                      <p className="text-xs text-[#64748b] line-clamp-2 mt-0.5">{notification.message}</p>
                      <p className="text-[11px] text-[#9e9e9e] mt-1">{formatDateTime(notification.date)}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="px-4 py-3 border-t border-[#eaeaea] bg-[#f8fafc]">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-sm font-medium text-[#044b3b] hover:underline"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}


