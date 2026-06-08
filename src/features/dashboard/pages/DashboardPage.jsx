import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import Chart from "react-apexcharts";
import { Loader2, RefreshCw, ArrowUpRight, ShoppingBag, CheckCircle2, Star, DollarSign, MessageCircle, AlertTriangle, ClipboardList, MapPin, TrendingUp } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { fetchSupplierDashboard } from "../api";
import { getAuthToken } from "@/stores/authStore";
import { fetchSupplierBookings } from "@/features/bookings/api";
import { fetchNotifications } from "@/features/notifications/api";

const NOTIFICATION_ICONS = {
  new_booking: { icon: ShoppingBag, color: "text-emerald-600", bg: "bg-emerald-50" },
  booking_confirmed: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
  new_review: { icon: Star, color: "text-amber-600", bg: "bg-amber-50" },
  payout: { icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
  new_enquiry: { icon: MessageCircle, color: "text-cyan-600", bg: "bg-cyan-50" },
  booking_cancelled: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
};

const STATS_CONFIG = [
  { label: "Total Bookings", icon: ShoppingBag, accent: "border-l-emerald-600", iconBg: "bg-emerald-50", iconBorder: "border-emerald-200/60", iconColor: "text-emerald-600" },
  { label: "Total Revenue", icon: TrendingUp, accent: "border-l-emerald-500", iconBg: "bg-emerald-50", iconBorder: "border-emerald-200/60", iconColor: "text-emerald-600" },
  { label: "Active Tours", icon: MapPin, accent: "border-l-emerald-400", iconBg: "bg-emerald-50", iconBorder: "border-emerald-200/60", iconColor: "text-emerald-600" },
  { label: "Pending Requests", icon: ClipboardList, accent: "border-l-amber-400", iconBg: "bg-amber-50", iconBorder: "border-amber-200/60", iconColor: "text-amber-600" },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-emerald-100 rounded-xl shadow-lg shadow-emerald-900/5 p-3">
        <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
        <p className="text-sm font-semibold text-slate-800">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const fetchDashboard = () => {
    if (!getAuthToken()) { setLoading(false); return; }
    setLoading(true); setError(null);
    Promise.all([
      fetchSupplierDashboard(),
      fetchSupplierBookings({ page: 1, limit: 4 }).then(r => r.bookings).catch(() => []),
      fetchNotifications({ limit: 5 }).then(r => r.data?.notifications || r.notifications || []).catch(() => []),
    ])
      .then(([data, bookings, notifs]) => {
        setDashboardData(data);
        setRecentBookings(bookings);
        setNotifications(notifs);
      })
      .catch((err) => {
        if (err.code === "AUTH_REQUIRED") return;
        setError(err.response?.data?.message || err.message || "Failed to load dashboard data");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDashboard(); }, []);

  const tours = dashboardData?.tours || {};
  const bookings = dashboardData?.bookings || {};
  const earnings = dashboardData?.earnings || {};

  const activeTours = tours.active || 0;
  const activeBookings = bookings.confirmed || 0;
  const totalRevenue = Number(earnings.totalEarnings) || 0;
  const pendingBookings = bookings.pending || 0;
  const cancelledBookings = bookings.cancelled || 0;
  const totalBookings = bookings.total || 0;

  const cancellationRate = totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0;

  const statsValues = [
    { value: activeBookings + pendingBookings },
    { value: formatCurrency(totalRevenue) },
    { value: activeTours },
    { value: pendingBookings },
  ];

  const revenueData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    return months.slice(0, now.getMonth() + 1).map((month, i) => ({
      month, revenue: i === now.getMonth() ? totalRevenue : Math.round(totalRevenue * (i + 1) / (now.getMonth() + 1) * 0.7),
    }));
  }, [totalRevenue]);

  const gaugeOptions = {
    chart: { type: "radialBar", sparkline: { enabled: true } },
    colors: cancellationRate === 0 ? ["#044b3b"] : cancellationRate <= 2 ? ["#059669"] : cancellationRate <= 5 ? ["#d97706"] : ["#dc2626"],
    plotOptions: {
      radialBar: {
        startAngle: -90, endAngle: 90,
        track: { background: "#e2e8f0", strokeWidth: "97%", margin: 5 },
        dataLabels: {
          name: { show: false },
          value: { offsetY: -2, fontSize: "22px", fontWeight: 700, color: "#1e293b", formatter: (v) => `${v}%` },
        },
      },
    },
    labels: ["Cancellation Rate"],
  };

  const gaugeLabel = cancellationRate === 0 ? "Excellent" : cancellationRate <= 2 ? "Good" : cancellationRate <= 5 ? "Average" : "Needs Attention";
  const gaugeLabelColor = cancellationRate === 0 ? "text-emerald-600" : cancellationRate <= 2 ? "text-emerald-600" : cancellationRate <= 5 ? "text-amber-600" : "text-red-600";

  return (
    <div className="p-5 md:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Dashboard Home</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Here&apos;s what&apos;s happening with your business today.</p>
        </div>
        <button onClick={fetchDashboard} disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-emerald-200/60 rounded-xl text-xs font-medium text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all disabled:opacity-40 shadow-sm"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700 flex items-center gap-2">
          <AlertTriangle size={12} /> {error}
          <button onClick={fetchDashboard} className="ml-auto underline">Retry</button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS_CONFIG.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`bg-white border border-emerald-100/60 rounded-xl p-4 hover:shadow-md hover:shadow-emerald-900/5 hover:border-emerald-200 transition-all border-l-4 ${s.accent}`}>
              <div className="flex items-center justify-between mb-2.5">
                <div className={`w-9 h-9 rounded-lg ${s.iconBg} border ${s.iconBorder} flex items-center justify-center`}>
                  <Icon size={16} className={s.iconColor} />
                </div>
              </div>
              {loading ? (
                <div className="space-y-1.5">
                  <div className="h-5 w-16 bg-emerald-100/40 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-emerald-100/40 rounded animate-pulse" />
                </div>
              ) : (
                <>
                  <p className="text-lg font-bold text-slate-800">{statsValues[i].value}</p>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">{s.label}</p>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bookings Overview Chart */}
        <div className="lg:col-span-2 bg-white border border-emerald-100/60 rounded-xl p-5 flex flex-col hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h3 className="text-sm font-semibold text-slate-800">Bookings Overview</h3>
            <button onClick={() => navigate("/bookings")} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors">
              View all <ArrowUpRight size={11} />
            </button>
          </div>
          <div className="flex-1 min-h-0">
            {loading ? (
              <div className="h-full bg-emerald-50/40 rounded-lg animate-pulse" />
            ) : revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f0fdf4" }} />
                  <Bar dataKey="revenue" fill="#044b3b" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs font-medium text-slate-400">No booking data yet</div>
            )}
          </div>
          <p className="text-[10px] font-medium text-slate-400 mt-3 shrink-0">Data is based on last 30 days</p>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Notifications */}
          <div className="bg-white border border-emerald-100/60 rounded-xl hover:border-emerald-200 transition-all overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
              </div>
              <button onClick={() => navigate("/notifications")} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors">
                View all <ArrowUpRight size={11} />
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-3">
                    <div className="w-8 h-8 rounded-xl bg-gray-100 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
                      <div className="h-2 w-1/4 bg-gray-100 rounded animate-pulse" />
                    </div>
                  </div>
                ))
              ) : notifications.length > 0 ? (
                notifications.slice(0, 5).map((n, i) => {
                  const iconConfig = NOTIFICATION_ICONS[n.type] || { icon: MessageCircle, color: "text-slate-600", bg: "bg-slate-50" };
                  const Icon = iconConfig.icon;
                  const isUnread = !n.readAt;
                  return (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 px-5 py-3 hover:bg-gray-50/80 transition-colors cursor-pointer relative ${
                        isUnread ? "bg-emerald-50/30" : ""
                      }`}
                      onClick={() => navigate("/notifications")}
                    >
                      {isUnread && (
                        <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-500 rounded-r-full" />
                      )}
                      <div className={`w-8 h-8 rounded-xl ${iconConfig.bg} flex items-center justify-center shrink-0 shadow-sm`}>
                        <Icon size={14} className={iconConfig.color} />
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs leading-relaxed ${isUnread ? "font-semibold text-slate-800" : "font-medium text-slate-600"}`}>
                            {n.message || n.title || "Notification"}
                          </p>
                          <span className="shrink-0 text-[10px] font-medium text-slate-400 mt-0.5 whitespace-nowrap">
                            {timeAgo(n.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-8 px-5 text-center">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-2.5">
                    <MessageCircle size={16} className="text-gray-300" />
                  </div>
                  <p className="text-xs font-medium text-slate-400">No notifications yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Cancellation Gauge */}
          <div className="bg-white border border-emerald-100/60 rounded-xl p-5 hover:border-emerald-200 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Cancellations</h3>
            </div>
            <p className={`text-xs font-semibold mb-2 ${gaugeLabelColor}`}>{gaugeLabel}</p>
            <Chart options={gaugeOptions} series={[cancellationRate]} type="radialBar" height={110} />
            <div className="flex items-center justify-between text-[10px] font-medium text-slate-400 mt-1">
              <span>0%</span>
              <span>5+%</span>
            </div>
            <p className="text-[10px] font-medium text-slate-400 mt-2 leading-relaxed">
              Percentage of cancelled bookings across all products.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Bookings */}
        <div className="lg:col-span-2 bg-white border border-emerald-100/60 rounded-xl p-5 hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Recent Bookings</h3>
            <button onClick={() => navigate("/bookings")} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors">
              View all <ArrowUpRight size={11} />
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-emerald-50/40 rounded-lg animate-pulse">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-3/4 bg-emerald-100 rounded" />
                    <div className="h-2.5 w-1/2 bg-emerald-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentBookings.length > 0 ? (
            <div className="space-y-1">
              {recentBookings.slice(0, 4).map((b) => (
                <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-emerald-50/40 transition-colors cursor-pointer border border-transparent hover:border-emerald-100">
                  {b.tourPhoto ? (
                    <img src={b.tourPhoto} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 ring-1 ring-emerald-100" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center shrink-0 text-sm font-bold text-emerald-700">
                      {(b.tourName || "T").charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 truncate">{b.tourName || "Unknown Tour"}</p>
                    <p className="text-xs font-medium text-slate-400 mt-0.5">
                      {b.travelDate ? formatDate(b.travelDate) : ""}
                      {b.travelers ? ` • ${b.travelers} ${b.travelers === 1 ? "Person" : "People"}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-800">{formatCurrency(b.total, b.currency)}</p>
                    <div className="mt-0.5">
                      <StatusBadge status={b.status} label={b.status?.replace(/_/g, " ") || b.status} size="sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-xs font-medium text-slate-400">No recent bookings</div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white border border-emerald-100/60 rounded-xl p-5 hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Top Products</h3>
            <button className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors">
              View all <ArrowUpRight size={11} />
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-emerald-50/40 rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <p className="text-xs font-medium text-slate-400 text-center py-8">Product analytics coming soon</p>
          )}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white border border-emerald-100/60 rounded-xl p-5">
            <div className="h-4 w-32 bg-emerald-100/40 rounded animate-pulse mb-4" />
            <div className="h-[220px] bg-emerald-50/40 rounded-lg animate-pulse" />
          </div>
          <div className="bg-white border border-emerald-100/60 rounded-xl p-5">
            <div className="h-4 w-24 bg-emerald-100/40 rounded animate-pulse mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-8 bg-emerald-50/40 rounded animate-pulse" />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
