import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Filter, X, ChevronDown, Calendar, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import {
  BOOKING_STATUSES,
  BOOKING_SORT_OPTIONS,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  SUPPLIER_BOOKING_STATUS_OPTIONS,
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import DatePicker from "@/components/forms/DatePicker";
import { fetchSupplierBookings, updateBookingStatus } from "../api";
import { getAuthToken } from "@/stores/authStore";

const QUICK_FILTERS = [
  { key: "ALL", label: "All Bookings" },
  { key: "PENDING", label: "Pending" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
  { key: "REFUNDED", label: "Refunded" },
  { key: "NO_SHOW", label: "No Show" },
];

export default function BookingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const page = parseInt(searchParams.get("page") || "0", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || String(DEFAULT_PAGE_SIZE), 10);
  const sortBy = searchParams.get("sortBy") || "NEW_BOOKINGS";
  const searchQuery = searchParams.get("search") || "";
  const statusFilters = searchParams.getAll("status");
  const travelDateFrom = searchParams.get("travelDateFrom") || "";
  const travelDateTo = searchParams.get("travelDateTo") || "";
  const activeTab = searchParams.get("tab") || "ALL";

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState(statusFilters.length > 0 ? statusFilters : []);
  const [dateFrom, setDateFrom] = useState(travelDateFrom);
  const [dateTo, setDateTo] = useState(travelDateTo);

  const apiStatus = activeTab !== "ALL" ? activeTab : selectedStatuses.length === 1 ? selectedStatuses[0] : undefined;

  const loadBookings = useCallback(async () => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchSupplierBookings({
        page: page + 1,
        limit: pageSize,
        ...(apiStatus ? { status: apiStatus } : {}),
      });
      setBookings(result.bookings);
      setPagination(result.pagination);
    } catch (err) {
      if (err.code === "AUTH_REQUIRED") return;
      setError(err.response?.data?.message || err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, apiStatus]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const updateFilters = useCallback(
    (updates) => {
      const params = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === "" || value === null || value === undefined) {
          params.delete(key);
        } else if (Array.isArray(value)) {
          params.delete(key);
          value.forEach((v) => params.append(key, v));
        } else {
          params.set(key, String(value));
        }
      });
      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  const handleSearch = () => updateFilters({ search: localSearch || null, page: 0 });

  const toggleStatus = (status) => {
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter((s) => s !== status)
      : [...selectedStatuses, status];
    setSelectedStatuses(newStatuses);
    updateFilters({ status: newStatuses.length > 0 ? newStatuses : null, tab: "ALL", page: 0 });
  };

  const applyDateFilter = () => {
    updateFilters({
      travelDateFrom: dateFrom || null,
      travelDateTo: dateTo || null,
      page: 0,
    });
  };

  const handleTabClick = (tabKey) => {
    if (tabKey === "ALL") {
      setSelectedStatuses([]);
      updateFilters({ tab: "ALL", status: null, page: 0 });
    } else {
      setSelectedStatuses([tabKey]);
      updateFilters({ tab: tabKey, status: [tabKey], page: 0 });
    }
  };

  const clearFilters = () => {
    setLocalSearch("");
    setSelectedStatuses([]);
    setDateFrom("");
    setDateTo("");
    setSearchParams({});
  };

  const handleStatusUpdate = useCallback(async (bookingId, status) => {
    setUpdatingId(bookingId);
    try {
      await updateBookingStatus(bookingId, { status });
      toast.success("Booking status updated");
      await loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update booking status");
    } finally {
      setUpdatingId(null);
    }
  }, [loadBookings]);

  const filteredData = useMemo(() => {
    let data = [...bookings];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (b) =>
          b.bookingNumber.toLowerCase().includes(q) ||
          b.customerName.toLowerCase().includes(q) ||
          b.customerEmail.toLowerCase().includes(q) ||
          b.tourName.toLowerCase().includes(q)
      );
    }

    if (travelDateFrom) {
      const from = new Date(travelDateFrom);
      data = data.filter((b) => new Date(b.travelDate) >= from);
    }
    if (travelDateTo) {
      const to = new Date(travelDateTo);
      data = data.filter((b) => new Date(b.travelDate) <= to);
    }

    data.sort((a, b) => {
      switch (sortBy) {
        case "OLDEST_FIRST":
          return new Date(a.bookingDate) - new Date(b.bookingDate);
        case "TRAVEL_DATE_ASC":
          return new Date(a.travelDate) - new Date(b.travelDate);
        case "TRAVEL_DATE_DESC":
          return new Date(b.travelDate) - new Date(a.travelDate);
        case "HIGHEST_VALUE":
          return b.total - a.total;
        case "LOWEST_VALUE":
          return a.total - b.total;
        case "NEW_BOOKINGS":
        default:
          return new Date(b.bookingDate) - new Date(a.bookingDate);
      }
    });

    return data;
  }, [bookings, searchQuery, travelDateFrom, travelDateTo, sortBy]);

  const totalItems = pagination?.totalCount ?? filteredData.length;
  const totalPages = pagination?.totalPages ?? (Math.ceil(filteredData.length / pageSize) || 1);

  const columns = useMemo(
    () => [
      {
        accessorKey: "bookingNumber",
        header: "Booking ID",
        cell: ({ row }) => (
          <span className="font-medium text-[#044b3b]">{row.original.bookingNumber}</span>
        ),
      },
      {
        accessorKey: "customerName",
        header: "Customer",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-[#1e293b]">{row.original.customerName}</p>
            <p className="text-xs text-[#64748b]">{row.original.customerEmail}</p>
          </div>
        ),
      },
      { accessorKey: "tourName", header: "Tour" },
      {
        accessorKey: "travelDate",
        header: "Travel Date",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-[#1e293b]">
            <Calendar size={14} className="text-[#64748b]" />
            {formatDate(row.original.travelDate)}
          </div>
        ),
      },
      {
        accessorKey: "travelers",
        header: "Travelers",
        cell: ({ row }) => <span className="text-[#1e293b]">{row.original.travelers}</span>,
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }) => (
          <span className="font-semibold text-[#1e293b]">
            {formatCurrency(row.original.total, row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
            label={BOOKING_STATUSES[row.original.status]?.label || row.original.status}
          />
        ),
      },
      {
        accessorKey: "paymentStatus",
        header: "Payment",
        cell: ({ row }) => (
          <StatusBadge status={row.original.paymentStatus} label={row.original.paymentStatus} size="sm" />
        ),
      },
      {
        id: "actions",
        header: "Update",
        cell: ({ row }) => (
          <select
            value=""
            disabled={updatingId === row.original.id}
            onChange={(e) => {
              if (e.target.value) handleStatusUpdate(row.original.id, e.target.value);
            }}
            className="px-2 py-1.5 border border-[#eaeaea] rounded-lg text-xs text-[#64748b] bg-white focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20"
          >
            <option value="">Set status...</option>
            {SUPPLIER_BOOKING_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ),
      },
    ],
    [updatingId, handleStatusUpdate]
  );

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1e293b]">Bookings</h1>
          <p className="text-sm text-[#64748b] mt-1">Manage and track customer bookings for your tours</p>
        </div>
        <button
          onClick={loadBookings}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] hover:text-[#1e293b] transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Refresh
        </button>
      </div>

      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
        {QUICK_FILTERS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabClick(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "bg-[#044b3b] text-white"
                : "bg-white text-[#64748b] hover:bg-[#f8fafc] hover:text-[#1e293b] border border-[#eaeaea]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-[#eaeaea] p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" />
            <input
              type="text"
              placeholder="Search by booking ID, customer, tour..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-9 pr-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm text-[#1e293b] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b]"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
                selectedStatuses.length > 0
                  ? "border-[#044b3b] text-[#044b3b] bg-[#f0fdf4]"
                  : "border-[#eaeaea] text-[#64748b] hover:bg-[#f8fafc]"
              }`}
            >
              <Filter size={16} />
              Status
              {selectedStatuses.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-[#044b3b] text-white rounded-full text-xs">
                  {selectedStatuses.length}
                </span>
              )}
              <ChevronDown size={14} />
            </button>

            {showFilters && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-[#eaeaea] rounded-lg shadow-lg z-50 p-2">
                <div className="flex items-center justify-between px-2 py-1 border-b border-[#eaeaea] mb-1">
                  <span className="text-xs font-semibold text-[#64748b]">Filter by Status</span>
                  <button onClick={() => setShowFilters(false)} className="text-[#9e9e9e] hover:text-[#1e293b]">
                    <X size={14} />
                  </button>
                </div>
                {Object.entries(BOOKING_STATUSES).map(([key, value]) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 px-2 py-2 hover:bg-[#f8fafc] rounded-md cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(key)}
                      onChange={() => toggleStatus(key)}
                      className="w-4 h-4 rounded border-[#eaeaea] text-[#044b3b] focus:ring-[#044b3b]"
                    />
                    <StatusBadge status={key} label={value.label} size="sm" />
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            <DatePicker
              value={dateFrom}
              onChange={setDateFrom}
              placeholder="From date"
              size="sm"
              className="w-[9.5rem] sm:w-40"
              maxDate={dateTo || undefined}
            />
            <span className="text-[#9e9e9e] shrink-0">to</span>
            <DatePicker
              value={dateTo}
              onChange={setDateTo}
              placeholder="To date"
              size="sm"
              className="w-[9.5rem] sm:w-40"
              minDate={dateFrom || undefined}
            />
            <button
              onClick={applyDateFilter}
              className="shrink-0 px-3 py-2.5 bg-[#044b3b] text-white rounded-lg text-sm font-medium hover:bg-[#033629] transition-colors"
            >
              Apply
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => updateFilters({ sortBy: e.target.value })}
            className="px-3 py-2.5 border border-[#eaeaea] rounded-lg text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20"
          >
            {BOOKING_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {(searchQuery || selectedStatuses.length > 0 || travelDateFrom || travelDateTo) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2.5 text-sm text-[#dc3545] hover:bg-[#ffebeb] rounded-lg transition-colors"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-[#ffebeb] border border-[#fecaca] rounded-lg text-sm text-[#991b1b]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-[#044b3b]" />
        </div>
      ) : (
        <DataTable
          data={filteredData}
          columns={columns}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={(newPage) => updateFilters({ page: newPage })}
          onPageSizeChange={(newSize) => updateFilters({ pageSize: newSize, page: 0 })}
        />
      )}
    </div>
  );
}
