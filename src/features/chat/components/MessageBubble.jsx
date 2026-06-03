import { Check, CheckCheck, Loader2 } from "lucide-react";

function formatMessageTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

const statusIcon = {
  sending: <Loader2 className="h-3 w-3 animate-spin" />,
  sent: <Check className="h-3 w-3" />,
  delivered: <CheckCheck className="h-3 w-3" />,
  read: <CheckCheck className="h-3 w-3 text-[#53bdeb]" />,
};

export default function MessageBubble({ message, isOwn, status, showAvatar, senderAvatar, senderName }) {
  return (
    <div className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {isOwn ? (
        <div className="w-8 shrink-0" />
      ) : showAvatar ? (
        <div className="relative mt-1 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#044b3b] text-xs font-bold text-white">
          <span>{senderName?.charAt(0)?.toUpperCase() || "?"}</span>
          {senderAvatar && (
            <img
              src={senderAvatar}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          )}
        </div>
      ) : (
        <div className="w-8 shrink-0" />
      )}

      <div className={`flex max-w-[75%] flex-col ${isOwn ? "items-end" : "items-start"}`}>
        <div
          className={`relative px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
            isOwn
              ? "bg-[#044b3b] text-white rounded-[18px] rounded-br-[4px]"
              : "bg-white text-gray-800 border border-gray-200 rounded-[18px] rounded-bl-[4px]"
          }`}
        >
          {message.attachmentUrl && (
            <div className="-mx-3.5 -mt-2 mb-2 overflow-hidden rounded-t-[18px]">
              <img
                src={message.attachmentUrl}
                alt=""
                className="max-w-full object-cover"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            </div>
          )}
          {message.content && (
            <span className="whitespace-pre-wrap break-words">{message.content}</span>
          )}
          <div className={`mt-1 flex items-center gap-1 ${isOwn ? "justify-end" : "justify-start"}`}>
            <span className={`text-[10px] leading-none ${isOwn ? "text-white/70" : "text-gray-400"}`}>
              {formatMessageTime(message.createdAt)}
            </span>
            {isOwn && status && <span className="flex">{statusIcon[status]}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}