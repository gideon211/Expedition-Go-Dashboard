import { AnimatePresence, motion } from "framer-motion";
import {
  Star,
  MessageSquare,
  Search,
  Loader2,
  RefreshCw,
  Send,
  Trash2,
  X,
  Pen,
  Camera,
  ThumbsUp,
  TrendingUp,
  Clock,
  AlertCircle,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { useCallback, useEffect, useMemo, useState } from "react";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { optimizeImage } from "@/lib/image";
import { REVIEW_STATUSES } from "@/lib/constants";
import {
  addReviewResponse,
  deleteReviewResponse,
  fetchSupplierReviews,
  updateReviewResponse,
} from "../api";
import { getAuthToken } from "@/stores/authStore";

const REVIEW_TABS = [
  { key: "all", label: "All Reviews", status: undefined },
  { key: "approved", label: "Approved", status: "APPROVED" },
  { key: "pending", label: "Pending", status: "PENDING" },
  { key: "replied", label: "Replied", clientFilter: "replied" },
  { key: "unreplied", label: "Unreplied", clientFilter: "unreplied" },
];

const STAT_ACCENTS = {
  emerald: "border-emerald-200/50 hover:border-emerald-300/60",
  amber: "border-amber-200/50 hover:border-amber-300/60",
  blue: "border-blue-200/50 hover:border-blue-300/60",
};

const STAT_ICON_BG = {
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  blue: "bg-blue-50 text-blue-600",
};

const STAT_VALUE_COLOR = {
  emerald: "text-emerald-700",
  amber: "text-amber-700",
  blue: "text-blue-700",
};

const STAGGER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const FADE_UP = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

function StarRating({ rating, size = "sm", animated = false }) {
  const starSize = size === "lg" ? 18 : size === "md" ? 14 : 12;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          initial={animated ? { scale: 0, rotate: -180 } : undefined}
          animate={animated ? { scale: 1, rotate: 0 } : undefined}
          transition={{ delay: animated ? i * 0.06 : 0, type: "spring", stiffness: 300, damping: 12 }}
        >
          <Star
            size={starSize}
            className={cn(
              i < rating ? "text-amber-400 fill-amber-400" : "text-slate-200",
              "transition-colors duration-200"
            )}
          />
        </motion.div>
      ))}
    </div>
  );
}

function computeStats(reviews) {
  const total = reviews.length;
  if (!total) return { avgRating: 0, total: 0, responseRate: 0, withPhotos: 0 };

  const sumRating = reviews.reduce((acc, r) => acc + r.rating, 0);
  const avgRating = (sumRating / total).toFixed(1);
  const replied = reviews.filter((r) => Boolean(r.supplierResponse)).length;
  const responseRate = Math.round((replied / total) * 100);
  const withPhotos = reviews.filter((r) => r.photos > 0).length;

  return { avgRating, total, responseRate, withPhotos };
}

function StatPill({ icon: Icon, label, value, accent }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border bg-white transition-all duration-200",
        accent ? STAT_ACCENTS[accent] : "border-slate-100 hover:shadow-sm hover:border-slate-200"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
        accent ? STAT_ICON_BG[accent] : "bg-slate-50 text-slate-500"
      )}>
        <Icon size={18} />
      </div>
      <div>
        <p className={cn(
          "text-lg font-bold",
          accent ? STAT_VALUE_COLOR[accent] : "text-slate-800"
        )}>{value}</p>
        <p className="text-[11px] font-medium text-slate-500 leading-tight">{label}</p>
      </div>
    </motion.div>
  );
}

function ReviewSkeleton() {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
            <div className="h-3 w-16 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="h-2.5 w-36 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse" />
        <div className="h-3 w-full bg-slate-100 rounded animate-pulse" />
        <div className="h-3 w-5/6 bg-slate-100 rounded animate-pulse" />
      </div>
      <div className="flex gap-2">
        <div className="h-6 w-16 bg-slate-100 rounded-lg animate-pulse" />
        <div className="h-6 w-16 bg-slate-100 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

function ReplyModal({ review, onClose, onSubmit, submitting }) {
  const [text, setText] = useState(review.supplierResponse || "");
  const maxChars = 1000;

  const handleSubmit = () => {
    if (text.trim().length < 10) {
      toast.error("Response must be at least 10 characters");
      return;
    }
    onSubmit(review, text.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-900/10 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center">
              <MessageSquare size={16} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                {review.supplierResponse ? "Edit Response" : "Reply to Review"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{review.customerName} · {review.tourName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <StarRating rating={review.rating} />
              <span className="text-xs font-medium text-slate-400">{review.rating}/5</span>
            </div>
            {review.comment && (
              <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                "{review.comment}"
              </p>
            )}
          </div>

          <label className="block text-sm font-semibold text-slate-700 mb-2">
            {review.supplierResponse ? "Update your response" : "Write your response"}
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, maxChars))}
            rows={5}
            placeholder="Share your thoughts on this review..."
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 resize-none placeholder:text-slate-400 transition-all"
          />
          <div className="flex items-center justify-between mt-2">
            <span className={cn(
              "text-xs font-medium",
              text.length > maxChars * 0.9 ? "text-amber-500" :
              text.length > maxChars * 0.75 ? "text-slate-500" :
              "text-slate-400"
            )}>
              {text.length}/{maxChars}
            </span>
            <span className="text-[11px] text-slate-400">Minimum 10 characters</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/60 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-700 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || text.trim().length < 10}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-emerald-200"
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} className="-ml-0.5" />
            )}
            {review.supplierResponse ? "Update Response" : "Post Response"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [replyTarget, setReplyTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const currentTab = REVIEW_TABS.find((t) => t.key === activeTab) || REVIEW_TABS[0];

  const loadReviews = useCallback(async () => {
    if (!getAuthToken()) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const params = { limit: 50 };
      if (currentTab.status) params.status = currentTab.status;
      const result = await fetchSupplierReviews(params);
      setReviews(result.reviews);
    } catch (err) {
      if (err.code === "AUTH_REQUIRED") return;
      setError(err.response?.data?.message || err.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [currentTab.status]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const filteredReviews = useMemo(() => {
    let data = [...reviews];
    if (currentTab.clientFilter === "replied") {
      data = data.filter((r) => Boolean(r.supplierResponse));
    } else if (currentTab.clientFilter === "unreplied") {
      data = data.filter((r) => !r.supplierResponse);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.tourName.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.comment.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q)
      );
    }
    return data;
  }, [reviews, currentTab.clientFilter, search]);

  const stats = useMemo(() => computeStats(reviews), [reviews]);

  const handleOpenReply = (review) => setReplyTarget(review);

  const handleSubmitReply = async (review, text) => {
    setSubmitting(true);
    try {
      if (review.supplierResponse) {
        await updateReviewResponse(review.id, text);
        toast.success("Response updated");
      } else {
        await addReviewResponse(review.id, text);
        toast.success("Response posted");
      }
      setReplyTarget(null);
      await loadReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save response");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReply = async (reviewId) => {
    if (!confirm("Remove your response to this review?")) return;
    try {
      await deleteReviewResponse(reviewId);
      toast.success("Response removed");
      await loadReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove response");
    }
  };

  return (
    <div className="p-5 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-1 h-10 bg-gradient-to-b from-emerald-500 to-emerald-300 rounded-full" />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">Reviews</h1>
              {!loading && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                >
                  {stats.total}
                </motion.span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">Customer feedback across your tours</p>
          </div>
        </div>
        <button
          onClick={loadReviews}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-40 shadow-sm"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          Refresh
        </button>
      </div>

      {/* Stats Banner */}
      {!loading && !error && reviews.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
        >
          <StatPill icon={Star} label="Average Rating" value={stats.avgRating} accent="amber" />
          <StatPill icon={MessageSquare} label="Total Reviews" value={stats.total} accent="emerald" />
          <StatPill icon={TrendingUp} label="Response Rate" value={`${stats.responseRate}%`} accent="blue" />
          <StatPill icon={Camera} label="With Photos" value={stats.withPhotos} accent="emerald" />
        </motion.div>
      )}

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl flex-1 min-w-0 overflow-x-auto">
          {REVIEW_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "relative px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                activeTab === tab.key
                  ? "text-white"
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/60"
              )}
            >
              {activeTab === tab.key && (
                <motion.span
                  layoutId="activeTab"
                  className={cn(
                    "absolute inset-0 rounded-lg bg-emerald-600"
                  )}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px] sm:min-w-[240px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 placeholder:text-slate-400 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 overflow-hidden"
          >
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200/60 rounded-xl">
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800">Failed to load reviews</p>
                <p className="text-xs text-red-600 mt-0.5">{error}</p>
              </div>
              <button
                onClick={loadReviews}
                className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors shrink-0"
              >
                Retry
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <ReviewSkeleton key={i} />
            ))}
          </motion.div>
        ) : filteredReviews.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-20 px-5"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center mb-6 ring-1 ring-emerald-200/60 shadow-inner">
              {search ? (
                <Search size={32} className="text-emerald-300" />
              ) : (
                <Inbox size={32} className="text-emerald-300" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1.5">
              {search ? "No matching reviews" : "No reviews yet"}
            </h3>
            <p className="text-sm text-slate-400 max-w-[260px] text-center leading-relaxed">
              {search
                ? "Try adjusting your search terms or filtering by a different status."
                : "Customer reviews will appear here once guests start leaving feedback on your tours."}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-4 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-xl hover:bg-emerald-100 transition-colors"
              >
                Clear search
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key={activeTab + search}
            variants={STAGGER}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {filteredReviews.map((review) => (
              <motion.div
                key={review.id}
                variants={FADE_UP}
                layout
                className="group relative bg-white border border-slate-100 rounded-xl hover:border-slate-200 hover:shadow-md hover:shadow-slate-900/5 transition-all duration-200"
              >
                {/* Status accent bar */}
                <div className={cn(
                  "absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-all duration-300",
                  !review.supplierResponse && review.status === "pending"
                    ? "bg-gradient-to-b from-amber-400 to-amber-300"
                    : review.supplierResponse
                      ? "bg-gradient-to-b from-emerald-400 to-emerald-300"
                      : review.status === "approved"
                        ? "bg-gradient-to-b from-emerald-400 to-emerald-300"
                        : "bg-gradient-to-b from-slate-300 to-slate-200"
                )} />

                <div className="pl-5 pr-5 py-5">
                  {/* Top row */}
                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="w-10 h-10 rounded-full shrink-0 ring-1 ring-emerald-200/50 overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                      {review.customerPhoto ? (
                        <img src={optimizeImage(review.customerPhoto, 40)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-emerald-700">
                          {(review.customerName || "?").charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1">
                        <span className="text-sm font-semibold text-slate-800">{review.customerName}</span>
                        <StarRating rating={review.rating} />
                        <span className="text-[11px] font-medium text-slate-400">{review.rating}.0</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400">{review.tourName}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs text-slate-400">{formatDate(review.date)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge
                        status={review.status.toUpperCase()}
                        label={REVIEW_STATUSES[review.status.toUpperCase()]?.label || review.status}
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Title + Comment */}
                  {review.title && (
                    <h3 className="text-sm font-semibold text-slate-800 mb-1.5">{review.title}</h3>
                  )}
                  {review.comment && (
                    <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>
                  )}

                  {/* Metadata badges */}
                  <div className="flex items-center gap-3 mt-3">
                    {review.photos > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/50">
                        <Camera size={12} />
                        {review.photos} {review.photos === 1 ? "photo" : "photos"}
                      </span>
                    )}
                    {review.helpful > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/50">
                        <ThumbsUp size={12} />
                        {review.helpful}
                      </span>
                    )}
                  </div>

                  {/* Supplier Response */}
                  {review.supplierResponse && (
                    <div className="relative mt-4 ml-2 pl-4 border-l-2 border-emerald-200/80">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      </div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Your Response</span>
                        <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenReply(review)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Edit response"
                          >
                            <Pen size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteReply(review.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove response"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{review.supplierResponse}</p>
                      {review.supplierResponseAt && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Clock size={11} className="text-slate-400" />
                          <span className="text-[11px] font-medium text-slate-400">
                            Posted {formatDate(review.supplierResponseAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reply action */}
                  {!review.supplierResponse && (
                    <div className="mt-4 flex items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-200">
                      <button
                        onClick={() => handleOpenReply(review)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-xl hover:bg-emerald-100 hover:border-emerald-300 transition-all"
                      >
                        <MessageSquare size={13} />
                        Reply to this review
                      </button>
                    </div>
                  )}

                  {/* Always show reply/edit for replied reviews */}
                  {review.supplierResponse && (
                    <div className="mt-3 flex items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-200">
                      <button
                        onClick={() => handleOpenReply(review)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-700 transition-all"
                      >
                        <Pen size={12} />
                        Edit response
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply Modal */}
      <AnimatePresence>
        {replyTarget && (
          <ReplyModal
            review={replyTarget}
            onClose={() => setReplyTarget(null)}
            onSubmit={handleSubmitReply}
            submitting={submitting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
