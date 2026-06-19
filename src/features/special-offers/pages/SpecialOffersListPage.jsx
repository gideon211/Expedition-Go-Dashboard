import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Search, Edit, Power, Trash2, Package, CalendarDays, Percent, Tag, X, Infinity, TicketCheck, ArrowUp, Clock } from "lucide-react";
import { toast } from "sonner";
import { fetchSpecialOffers, deleteSpecialOffer, toggleSpecialOffer } from "@/features/special-offers/api";
import LoadingSkeleton from "@/components/shared/Skeleton";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const OFFER_TYPE_LABELS = { LIMITED_TIME: "Limited Time", EARLY_BIRD: "Early Bird", LAST_MINUTE: "Last Minute" };
const OFFER_TYPE_ACCENTS = { LIMITED_TIME: "bg-indigo-500", EARLY_BIRD: "bg-amber-500", LAST_MINUTE: "bg-rose-500" };

const STATUS_CONFIG = {
  active: { label: "Active", dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  scheduled: { label: "Scheduled", dot: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  expired: { label: "Expired", dot: "bg-slate-400", bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200" },
  inactive: { label: "Inactive", dot: "bg-gray-400", bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-200" },
};

const FADE_UP = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: "easeOut" },
};

export default function SpecialOffersListPage() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSpecialOffers();
      setOffers(res.data?.data?.offers || []);
    } catch { toast.error("Failed to load offers"); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = offers.filter((o) => {
    if (search && !o.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter && o.offerType !== typeFilter) return false;
    if (statusFilter && o.status !== statusFilter) return false;
    return true;
  });

  const handleDelete = async (id) => {
    setDeleteTarget(id);
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSpecialOffer(deleteTarget);
      toast.success("Offer deleted");
      setDeleteTarget(null);
      load();
    } catch { toast.error("Failed to delete offer"); setDeleteTarget(null); }
  };
  const cancelDelete = () => setDeleteTarget(null);

  const handleToggle = async (id) => {
    try {
      const res = await toggleSpecialOffer(id);
      const updated = res.data?.data?.offer;
      toast.success(updated?.isActive ? "Offer activated" : "Offer deactivated");
      load();
    } catch { toast.error("Failed to toggle offer"); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const getTourPrice = (tour) => {
    const sched = tour?.schedulesAndPricing?.pricingSchedules?.schedules;
    if (!sched?.[0]?.prices?.[0]?.retailPrice) return null;
    return Number(sched[0].prices[0].retailPrice);
  };

  const hasFilters = search || typeFilter || statusFilter;
  const clearFilters = () => { setSearch(""); setTypeFilter(""); setStatusFilter(""); };

  const stats = [
    { label: "Total Offers", value: offers.length, icon: TicketCheck, accent: "border-l-emerald-500", iconBg: "bg-emerald-50", iconBorder: "border-emerald-200", iconColor: "text-emerald-600" },
    { label: "Active", value: offers.filter((o) => o.status === "active").length, icon: ArrowUp, accent: "border-l-emerald-500", iconBg: "bg-emerald-50", iconBorder: "border-emerald-200", iconColor: "text-emerald-600" },
    { label: "Scheduled", value: offers.filter((o) => o.status === "scheduled").length, icon: Clock, accent: "border-l-emerald-500", iconBg: "bg-emerald-50", iconBorder: "border-emerald-200", iconColor: "text-emerald-600" },
  ];

  return (
    <div className="p-5 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div {...FADE_UP} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Special Offers</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage promotional discounts and offers</p>
        </div>
        <button
          onClick={() => navigate("/special-offers/build/new")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 shadow-sm shadow-emerald-600/10 transition-all"
        >
          <Plus size={18} />
          Create Offer
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div {...FADE_UP} transition={{ ...FADE_UP.transition, delay: 0.05 }} className="grid grid-cols-3 gap-3 mb-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={cn("bg-white border border-emerald-100/60 rounded-xl p-4 hover:shadow-md hover:shadow-emerald-900/5 hover:border-emerald-200 transition-all border-l-4", s.accent)}>
              <div className="flex items-center justify-between mb-2.5">
                <div className={cn("w-9 h-9 rounded-lg border flex items-center justify-center", s.iconBg, s.iconBorder)}>
                  <Icon size={16} className={s.iconColor} />
                </div>
              </div>
              <p className="text-lg font-bold text-slate-800">{s.value}</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </motion.div>

      {/* Filters */}
      <motion.div {...FADE_UP} transition={{ ...FADE_UP.transition, delay: 0.1 }} className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search offers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter || "all"} onValueChange={(v) => setTypeFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="LIMITED_TIME">Limited Time</SelectItem>
              <SelectItem value="EARLY_BIRD">Early Bird</SelectItem>
              <SelectItem value="LAST_MINUTE">Last Minute</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <LoadingSkeleton key={i} className="!h-28 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div {...FADE_UP} className="text-center py-16">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Percent size={28} className="text-slate-300" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 mb-1">
            {hasFilters ? "No matching offers" : "No offers yet"}
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-5">
            {hasFilters
              ? "Try adjusting your filters or search term"
              : "Create your first special offer to start promoting your tours with discounts"}
          </p>
          {!hasFilters && (
            <button
              onClick={() => navigate("/special-offers/build/new")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 shadow-sm transition-all"
            >
              <Plus size={18} />
              Create Offer
            </button>
          )}
          {hasFilters && (
            <button onClick={clearFilters} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              Clear all filters
            </button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-400 font-medium">
            Showing {filtered.length} of {offers.length} offer{offers.length !== 1 ? "s" : ""}
          </p>
          {filtered.map((offer, i) => {
            const statusCfg = STATUS_CONFIG[offer.status] || STATUS_CONFIG.inactive;
            const typeLabel = OFFER_TYPE_LABELS[offer.offerType] || offer.offerType;
            const capped = offer.capacityType === "CAPPED";
            const spotsUsed = capped ? ((offer.spotsSold / offer.maxSpots) * 100).toFixed(0) : 0;
            const firstTarget = offer.targets?.[0];
            const tour = firstTarget?.tour || firstTarget;

            return (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.03, ease: "easeOut" }}
                className="group relative bg-white rounded-xl border border-emerald-100/60 shadow-sm hover:shadow-md hover:shadow-emerald-900/5 hover:border-emerald-200 transition-all"
              >
                <div className="flex items-stretch">
                  {/* Product image panel (left) */}
                  {firstTarget && (
                    <div className="relative w-28 shrink-0 rounded-l-xl overflow-hidden border-r border-emerald-100/60">
                      <button
                        onClick={() => navigate(`/products/${tour?.id || firstTarget.tourId}`)}
                        className="absolute inset-0 z-10"
                        aria-label="View product"
                      />
                      {tour?.photos?.[0] || firstTarget.tourPhoto ? (
                        <img src={tour?.photos?.[0] || firstTarget.tourPhoto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100">
                          <Package size={20} className="text-slate-400" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 z-20">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-7 h-7 rounded-lg bg-white/90 backdrop-blur-sm border border-white/60 flex items-center justify-center hover:bg-white transition-all shadow-sm">
                              <MoreVerticalIcon size={14} className="text-slate-600" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => navigate(`/special-offers/build/${offer.id}`)}>
                              <Edit size={15} /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggle(offer.id)}>
                              <Power size={15} /> {offer.isActive ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(offer.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                              <Trash2 size={15} /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )}
                  {!firstTarget && (
                    <div className="flex items-start pt-3 pl-3 shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                            <MoreVerticalIcon size={15} className="text-slate-400" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => navigate(`/special-offers/build/${offer.id}`)}>
                            <Edit size={15} /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggle(offer.id)}>
                            <Power size={15} /> {offer.isActive ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(offer.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                            <Trash2 size={15} /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}

                  <div className="flex items-center gap-3 flex-1 min-w-0 px-3 py-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Tour title + Status */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const t = offer.targets?.[0]?.tour || offer.targets?.[0];
                          if (t) navigate(`/products/${t.id || t.tourId}`);
                        }}
                        className="text-sm font-semibold text-slate-800 hover:text-emerald-600 transition-colors text-left"
                      >
                        {firstTarget
                          ? (tour?.title || firstTarget.tourTitle || "Tour")
                          : offer.name}
                      </button>
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border shrink-0",
                        statusCfg.bg, statusCfg.text, statusCfg.border
                      )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dot)} />
                        {statusCfg.label}
                      </span>
                    </div>
                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
                      <span>{formatDate(offer.startDate)} – {formatDate(offer.endDate)}</span>
                      <span className="text-slate-300">|</span>
                      <span>{typeLabel}</span>
                      <span className="text-slate-300">|</span>
                      <span>{offer.targets?.length || 0} product{(offer.targets?.length || 0) !== 1 ? "s" : ""}</span>
                      {capped && (
                        <>
                          <span className="text-slate-300">|</span>
                          <span>{offer.maxSpots - offer.spotsSold} left</span>
                        </>
                      )}
                    </div>
                    {/* Product section */}
                    {offer.targets?.length > 0 && (
                      <div className="space-y-1.5 pt-0.5">
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-md">
                          <Tag size={11} className="text-emerald-500" />
                          <span className="text-xs font-semibold text-emerald-700">{offer.name}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {offer.targets.slice(0, 3).map((t) => {
                            const tData = t.tour || t;
                            const price = getTourPrice(t.tour);
                            return (
                              <button
                                key={t.id || t.tourId}
                                onClick={() => navigate(`/products/${tData.id || t.tourId}`)}
                                className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-md text-[11px] text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer"
                              >
                                <div className="w-4 h-4 rounded bg-slate-200 overflow-hidden shrink-0">
                                  {tData.photos?.[0] || t.tourPhoto ? (
                                    <img src={tData.photos?.[0] || t.tourPhoto} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <Package size={9} className="text-slate-400 m-auto" />
                                  )}
                                </div>
                                <span className="truncate max-w-[120px]">{tData.title || t.tourTitle || "Tour"}</span>
                                {price && (
                                  <span className="text-emerald-600 font-semibold shrink-0">
                                    ${Math.round(price * (1 - offer.discountPercentage / 100))}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                          {offer.targets.length > 3 && (
                            <span className="px-2 py-1 bg-slate-50 border border-slate-200/80 rounded-md text-[11px] text-slate-400">
                              +{offer.targets.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                  {/* Discount panel (right) */}
                  <div className="w-[52px] flex flex-col items-center justify-center bg-emerald-50/80 rounded-r-xl border-l border-emerald-100/60 gap-0.5 shrink-0">
                    <Percent size={13} className="text-emerald-500" />
                    <span className="text-lg font-bold text-emerald-700 leading-none">{offer.discountPercentage}</span>
                    <span className="text-[9px] font-medium text-emerald-500 uppercase tracking-wide">Off</span>
                  </div>
              </div>

              {/* Capacity progress bar */}
              {capped && offer.maxSpots > 0 && (
                <div className="h-1 bg-slate-100 rounded-b-xl overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-b-xl transition-all duration-500",
                      spotsUsed >= 90 ? "bg-red-500" : spotsUsed >= 70 ? "bg-amber-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${Math.min(Number(spotsUsed), 100)}%` }}
                  />
                </div>
              )}
            </motion.div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={cancelDelete}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Delete offer</h3>
                <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <div className="space-y-4 mb-6">
              <p className="text-sm text-slate-600">
                Are you sure you want to delete <span className="font-semibold text-slate-800">&ldquo;{offers.find((o) => o.id === deleteTarget)?.name}&rdquo;</span>?
              </p>
              {(() => {
                const target = offers.find((o) => o.id === deleteTarget);
                const tours = target?.targets?.slice(0, 3) || [];
                if (tours.length === 0) return null;
                return (
                  <div className="flex flex-wrap gap-1.5">
                    {tours.map((t) => {
                      const tData = t.tour || t;
                      return (
                        <span key={t.id || t.tourId} className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-600">
                          <div className="w-4 h-4 rounded bg-slate-200 overflow-hidden shrink-0">
                            {(tData.photos?.[0] || t.tourPhoto) ? (
                              <img src={tData.photos?.[0] || t.tourPhoto} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package size={9} className="text-slate-400 m-auto" />
                            )}
                          </div>
                          {tData.title || t.tourTitle || "Tour"}
                        </span>
                      );
                    })}
                    {(target?.targets?.length || 0) > 3 && (
                      <span className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-400">
                        +{target.targets.length - 3} more
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

function MoreVerticalIcon({ size, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

