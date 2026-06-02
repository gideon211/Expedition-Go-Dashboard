import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  AlertCircle,
  Clock,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { fetchSupplierDashboard } from "../api";
import { getAuthToken } from "@/stores/authStore";

const BOOKING_STATUS_COLORS = {
  CONFIRMED: "#00d67f",
  PENDING: "#ffc400",
  CANCELLED: "#dc3545",
  REFUNDED: "#298dff",
  COMPLETED: "#00d67f",
  NO_SHOW: "#dc3545",
};

function StatCard({ title, value, change, isPositive, icon: Icon, iconBg, iconColor, loading }) {
  return (
    <div className="bg-white rounded-lg border border-[#eaeaea] p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
          {loading ? (
            <Loader2 size={20} className="animate-spin text-[#9e9e9e]" />
          ) : (
            <Icon size={20} className={iconColor} />
          )}
        </div>
        {!loading && change !== null && (
          <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? "text-[#00d67f]" : "text-[#dc3545]"}`}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-8 w-24 bg-[#f0f0f0] rounded animate-pulse" />
          <div className="h-4 w-32 bg-[#f0f0f0] rounded animate-pulse" />
        </div>
      ) : (
        <>
          <p className="text-2xl font-bold text-[#1e293b]">{value}</p>
          <p className="text-sm text-[#64748b] mt-1">{title}</p>
        </>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#eaeaea] rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-[#1e293b] mb-1">{label}</p>
        <p className="text-xs text-[#64748b]">
          Revenue: {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = () => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    fetchSupplierDashboard()
      .then((data) => {
        setDashboardData(data);
      })
      .catch((err) => {
        if (err.code === "AUTH_REQUIRED") {
          return;
        }
        setError(err.response?.data?.message || err.message || "Failed to load dashboard data");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, []);

  const tours = dashboardData?.tours || {};
  const bookings = dashboardData?.bookings || {};
  const earnings = dashboardData?.earnings || {};
  const reviewsData = dashboardData?.reviews || {};

  // Derived stats
  const totalTours = tours.total || 0;
  const activeTours = tours.active || 0;
  const activeBookings = bookings.confirmed || 0;
  const totalRevenue = Number(earnings.totalEarnings) || 0;

  // Booking status distribution for pie chart
  const BOOKING_STATUS_MAP = {
    pending: "PENDING",
    confirmed: "CONFIRMED",
    completed: "COMPLETED",
    cancelled: "CANCELLED",
  };
  const bookingStatusData = Object.entries(BOOKING_STATUS_MAP)
    .map(([key, status]) => ({
      name: status.replace(/_/g, " "),
      value: bookings[key] || 0,
      color: BOOKING_STATUS_COLORS[status] || "#9e9e9e",
    }))
    .filter((b) => b.value > 0);

  // Monthly revenue for chart
  const revenueData = [];

  // Recent reviews
  const recentReviews = reviewsData.recentReviews || [];
  // Recent bookings - backend doesn't return these in the dashboard endpoint
  const recentBookings = [];

  return (
    <div className="p-4 md:p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1e293b]">Dashboard</h1>
          <p className="text-sm text-[#64748b] mt-1">
            {loading ? "Loading..." : `Welcome back! Here's what's happening with your business.`}
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] transition-colors"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Error State */}
      {error && !loading && (
        <div className="bg-[#fef2f2] border border-[#fca5a5] rounded-lg p-6 text-center mb-6">
          <AlertCircle size={40} className="text-[#dc2626] mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-[#991b1b] mb-2">Failed to Load Dashboard</h2>
          <p className="text-sm text-[#b91c1c] mb-4">{error}</p>
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 bg-[#044b3b] text-white rounded-lg text-sm font-medium hover:bg-[#033629] transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Revenue"
          value={loading ? "" : formatCurrency(totalRevenue)}
          change={null}
          isPositive={true}
          icon={DollarSign}
          iconBg="bg-[#f0fdf4]"
          iconColor="text-[#044b3b]"
          loading={loading}
        />
        <StatCard
          title="Active Bookings"
          value={loading ? "" : String(activeBookings)}
          change={null}
          isPositive={true}
          icon={ShoppingCart}
          iconBg="bg-[#ecfeff]"
          iconColor="text-[#0f766e]"
          loading={loading}
        />
        <StatCard
          title="Total Tours"
          value={loading ? "" : String(totalTours)}
          change={null}
          isPositive={true}
          icon={Package}
          iconBg="bg-[#ecfdff]"
          iconColor="text-[#0891b2]"
          loading={loading}
        />
        <StatCard
          title={loading ? "" : "Active Tours"}
          value={loading ? "" : String(activeTours)}
          change={null}
          isPositive={true}
          icon={Users}
          iconBg="bg-[#fefce8]"
          iconColor="text-[#ca8a04]"
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Create New Tour", count: "+", route: "/products/build/new/type", color: "text-[#044b3b]", bg: "bg-[#f0fdf4]" },
          { label: "Manage Tours", count: totalTours, route: "/products", color: "text-[#1d4ed8]", bg: "bg-[#eff6ff]" },
          { label: "View Bookings", count: activeBookings, route: "/bookings", color: "text-[#f97316]", bg: "bg-[#fff7ed]" },
          { label: "View Finance", count: "", route: "/finance", color: "text-[#044b3b]", bg: "bg-[#f0fdf4]" },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.route)}
            className={`flex items-center justify-between p-4 rounded-lg border border-[#eaeaea] hover:shadow-md transition-all text-left ${item.bg} ${loading ? "opacity-60 pointer-events-none" : ""}`}
          >
            <div>
              <p className={`text-2xl font-bold ${item.color} ${item.count === "+" ? "text-3xl" : ""}`}>{item.count}</p>
              <p className="text-sm text-[#64748b] mt-0.5">{item.label}</p>
            </div>
            <ChevronRight size={18} className="text-[#9e9e9e]" />
          </button>
        ))}
      </div>

      {/* Charts Row */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-[#eaeaea] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#1e293b]">Revenue Trend</h3>
              <span className="text-xs text-[#64748b]">Last 12 months</span>
            </div>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#044b3b" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#044b3b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#044b3b" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-sm text-[#64748b]">
                No revenue data yet
              </div>
            )}
          </div>

          {/* Booking Status Distribution */}
          <div className="bg-white rounded-lg border border-[#eaeaea] p-5">
            <h3 className="text-sm font-semibold text-[#1e293b] mb-4">Booking Status</h3>
            {bookingStatusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={bookingStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {bookingStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1.5">
                  {bookingStatusData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[#64748b]">{item.name}</span>
                      </span>
                      <span className="font-medium text-[#1e293b]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-sm text-[#64748b]">
                No bookings yet
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Row */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bookings */}
          <div className="bg-white rounded-lg border border-[#eaeaea] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#1e293b]">Recent Bookings</h3>
              <button
                onClick={() => navigate("/bookings")}
                className="text-xs text-[#044b3b] font-medium hover:underline flex items-center gap-1"
              >
                View All
                <ArrowUpRight size={12} />
              </button>
            </div>
            {recentBookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#eaeaea]">
                      <th className="text-left py-2 text-xs font-semibold text-[#64748b] uppercase">Booking</th>
                      <th className="text-left py-2 text-xs font-semibold text-[#64748b] uppercase">Customer</th>
                      <th className="text-left py-2 text-xs font-semibold text-[#64748b] uppercase">Amount</th>
                      <th className="text-left py-2 text-xs font-semibold text-[#64748b] uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((booking) => (
                      <tr key={booking.id} className="border-b border-[#eaeaea] last:border-0 hover:bg-[#f8fafc] transition-colors">
                        <td className="py-3">
                          <p className="text-sm font-medium text-[#044b3b]">{booking.bookingNumber || booking.id?.slice(0, 8)}</p>
                          <p className="text-xs text-[#64748b]">{formatDate(booking.selectedDate || booking.createdAt)}</p>
                        </td>
                        <td className="py-3">
                          <p className="text-sm text-[#1e293b]">{booking.customer?.name || "Anonymous"}</p>
                          <p className="text-xs text-[#64748b] truncate max-w-[150px]">{booking.tour?.title || ""}</p>
                        </td>
                        <td className="py-3 font-medium text-[#1e293b]">{formatCurrency(booking.total)}</td>
                        <td className="py-3">
                          <StatusBadge status={booking.status} label={booking.status?.replace(/_/g, " ")} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-sm text-[#64748b]">
                <ShoppingCart size={32} className="mb-2 text-[#9e9e9e]" />
                <p>No bookings yet</p>
                <p className="text-xs mt-1">Bookings will appear here once customers start booking your tours.</p>
              </div>
            )}
          </div>

          {/* Top Tours */}
          <div className="bg-white rounded-lg border border-[#eaeaea] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#1e293b]">Recent Reviews</h3>
              <button
                onClick={() => navigate("/reviews")}
                className="text-xs text-[#044b3b] font-medium hover:underline flex items-center gap-1"
              >
                View All
                <ArrowUpRight size={12} />
              </button>
            </div>
            {recentReviews.length > 0 ? (
              <div className="space-y-4">
                {recentReviews.map((review) => (
                  <div key={review.id} className="flex items-start gap-3 pb-3 border-b border-[#eaeaea] last:border-0 last:pb-0">
                    <div className="w-8 h-8 rounded-full bg-[#044b3b] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                      {review.customer?.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-[#1e293b]">{review.customer?.name || "Anonymous"}</p>
                        <span className="text-xs text-[#ffc400]">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                      </div>
                      <p className="text-xs text-[#64748b]">{review.tour?.title || ""}</p>
                      {review.comment && (
                        <p className="text-xs text-[#1e293b] mt-1 line-clamp-2">{review.comment}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-sm text-[#64748b]">
                <Clock size={32} className="mb-2 text-[#9e9e9e]" />
                <p>No reviews yet</p>
                <p className="text-xs mt-1">Customer reviews will appear here once tours start getting booked.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-lg border border-[#eaeaea] p-5">
            <div className="h-4 w-32 bg-[#f0f0f0] rounded animate-pulse mb-4" />
            <div className="h-[250px] bg-[#f0f0f0] rounded animate-pulse" />
          </div>
          <div className="bg-white rounded-lg border border-[#eaeaea] p-5">
            <div className="h-4 w-32 bg-[#f0f0f0] rounded animate-pulse mb-4" />
            <div className="h-[200px] bg-[#f0f0f0] rounded animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );
}