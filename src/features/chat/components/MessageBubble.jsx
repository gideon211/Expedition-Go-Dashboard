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
  read: <CheckCheck className="h-3 w-3 text-emerald-400" />,
};

export default function MessageBubble({ message, isOwn, status, showAvatar, senderAvatar, senderName, compact }) {
  const a = compact ? "h-6 w-6 text-[9px] mt-0" : "h-8 w-8 text-xs mt-1";
  const spacer = compact ? "w-6" : "w-8";
  const bubblePad = compact ? "px-2.5 py-1.5" : "px-3.5 py-2";
  const bubbleText = compact ? "text-xs leading-snug" : "text-sm leading-relaxed";
  const bubbleRadius = compact ? "rounded-[14px]" : "rounded-[18px]";
  const bubbleRadiusOwn = compact ? "rounded-br-[3px]" : "rounded-br-[4px]";
  const bubbleRadiusOther = compact ? "rounded-bl-[3px]" : "rounded-bl-[4px]";
  const attMargin = compact ? "-mx-2.5 -mt-1.5 mb-1.5" : "-mx-3.5 -mt-2 mb-2";
  const attRadius = compact ? "rounded-t-[14px]" : "rounded-t-[18px]";
  const tsSize = compact ? "text-[9px]" : "text-[10px]";
  const maxW = compact ? "max-w-[72%]" : "max-w-[65%]";

  return (
    <div className={`flex gap-1.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {isOwn ? (
        <div className={`${spacer} shrink-0`} />
      ) : showAvatar ? (
        <div className={`relative flex ${a} shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-600 font-bold text-white`}>
          {compact ? (
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
              <circle cx="12" cy="12" r="10" fill="currentColor" className="text-white/90" />
              <circle cx="8.5" cy="10" r="1.2" fill="#059669" />
              <circle cx="15.5" cy="10" r="1.2" fill="#059669" />
              <path d="M7.5 14.5c1.2 1.2 3 1.8 4.5 1.8s3.3-0.6 4.5-1.8" stroke="#059669" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          ) : (
            <>
              <span>{senderName?.charAt(0)?.toUpperCase() || "?"}</span>
              {senderAvatar && (
                <img
                  src={senderAvatar}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              )}
            </>
          )}
        </div>
      ) : (
        <div className={`${spacer} shrink-0`} />
      )}

      <div className={`flex ${maxW} min-w-0 flex-col ${isOwn ? "items-end" : "items-start"}`}>
        <div
          className={`relative ${bubblePad} ${bubbleText} shadow-sm ${
            isOwn
              ? `bg-emerald-600 text-white ${bubbleRadius} ${bubbleRadiusOwn}`
              : `bg-white text-slate-800 border border-slate-200 ${bubbleRadius} ${bubbleRadiusOther}`
          }`}>
          {message.attachmentUrl && (
            <div className={`${attMargin} overflow-hidden ${attRadius}`}>
              <img
                src={message.attachmentUrl}
                alt=""
                className="max-w-full object-cover"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            </div>
          )}
          {message.content && (
            <span className="whitespace-pre-wrap" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>{message.content}</span>
          )}
          <div className={`mt-0.5 flex items-center gap-1 ${isOwn ? "justify-end" : "justify-start"}`}>
            <span className={`${tsSize} leading-none ${isOwn ? "text-white/70" : "text-slate-400"}`}>
              {formatMessageTime(message.createdAt)}
            </span>
            {isOwn && status && <span className="flex">{statusIcon[status]}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
