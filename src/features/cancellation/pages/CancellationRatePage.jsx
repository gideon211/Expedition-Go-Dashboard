import { useState, useEffect } from "react";

import { CalendarX2, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import CancellationGauge from "@/components/shared/CancellationGauge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { fetchCancellationSummary, fetchCancellationRecords, fetchCancellationProducts } from "../api";

const SORT_FIELDS = {
  travelDate: "Travel Date",
  reason: "Cancellation Reason",
  bookingReference: "Booking Reference",
  productName: "Product",
  bookingValue: "Booking Value",
};

export default function CancellationRatePage() {
  
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const loadData = async (productId) => {
    setLoading(true);
    try {
      const [summaryData, recordsData, productsData] = await Promise.all([
        fetchCancellationSummary(productId === "all" ? undefined : productId),
        fetchCancellationRecords({ productId: productId === "all" ? undefined : productId }),
        fetchCancellationProducts(),
      ]);
      setSummary(summaryData);
      setRecords(recordsData.records);
      setProducts(productsData);
    } catch {
      // handled by api fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedProduct);
  }, [selectedProduct]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortedRecords = [...records].sort((a, b) => {
    if (!sortField) return 0;
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (typeof aVal === "string") {
      return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDir === "asc" ? aVal - bVal : bVal - aVal;
  });

  const totalLost = records.reduce((sum, r) => sum + (r.bookingValue || 0), 0);
  const productCount = products.length > 0 ? products.length : "—";

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown size={13} className="text-slate-300 shrink-0" />;
    return sortDir === "asc"
      ? <ArrowUp size={13} className="text-emerald-600 shrink-0" />
      : <ArrowDown size={13} className="text-emerald-600 shrink-0" />;
  };

  return (
    <div className="p-5 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-1 h-10 bg-gradient-to-b from-emerald-500 to-emerald-300 rounded-full" />
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Cancellation rate</h1>
          <p className="text-sm text-slate-500 mt-0.5">Monitor and review booking cancellations across your products</p>
        </div>
      </div>

      {/* Product Filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Product:</label>
        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="All products" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All products ({productCount})</SelectItem>
            {products.filter((p) => p.id !== "all").map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-[20px] shadow-none p-5">
              <div className="h-[200px] bg-slate-100 rounded-lg" />
            </div>
            <div className="space-y-4">
              <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-6">
                <div className="h-8 w-48 bg-slate-100 rounded mb-3" />
                <div className="h-4 w-64 bg-slate-100 rounded" />
              </div>
              <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-6">
                <div className="h-5 w-36 bg-slate-100 rounded mb-3" />
                <div className="h-4 w-full bg-slate-100 rounded" />
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="h-5 w-72 bg-slate-100 rounded mb-4" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
                  <div className="h-4 w-24 bg-slate-100 rounded" />
                  <div className="h-4 w-40 bg-slate-100 rounded" />
                  <div className="h-4 w-28 bg-slate-100 rounded" />
                  <div className="h-4 w-32 bg-slate-100 rounded ml-auto" />
                  <div className="h-4 w-20 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Gauge + Stats Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gauge Card */}
            <div className="bg-white border border-slate-200 rounded-[20px] shadow-none p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center">
                  <CalendarX2 size={16} className="text-emerald-600" />
                </div>
                <h2 className="text-sm font-semibold text-slate-800">Cancellation Rate</h2>
              </div>
              <CancellationGauge
                value={summary?.cancellationRate ?? 0}
                label={summary?.status || "Excellent"}
              />
            </div>

            {/* Stats Card */}
            <div className="space-y-4">
              <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-6">
                <p className="text-3xl font-bold text-slate-800">
                  {formatCurrency(summary?.bookingValueLost ?? 0)}
                </p>
                <p className="text-sm text-slate-500 mt-1">booking value lost in last 90 days</p>
              </div>

              <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={15} className="text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-800">About cancellation rate</h3>
                </div>
                <div className="space-y-3 text-xs text-slate-500 leading-relaxed">
                  <p>
                    Your cancellation rate is calculated by dividing supplier-caused cancellations
                    by total eligible bookings in the last 90 days. We exclude cancellations due to
                    weather, force majeure, or customer-requested cancellations.
                  </p>
                  <p>
                    Keep your rate below 2% to maintain Excellent status. Rates between 2% and 5%
                    are flagged as Warning, while anything above 5% is considered Poor and may
                    require attention to your product offerings and booking policies.
                  </p>
                  <p>
                    <span className="font-medium text-slate-700">Most common reason:</span>{" "}
                    {summary?.mostCommonReason || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100" />

          {/* Table Section */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-800">
                Cancellations used to calculate your rate
              </h2>
            </div>

            {sortedRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-5 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                  <CalendarX2 size={22} className="text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700">No cancelled bookings counted toward your rate</p>
                <p className="text-xs text-slate-400 mt-1.5 max-w-[320px] leading-relaxed">
                  Only supplier-caused cancellations from the last 90 days appear here. Weather,
                  force majeure, and customer-requested cancellations are excluded.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        {Object.entries(SORT_FIELDS).map(([key, label]) => (
                          <th
                            key={key}
                            onClick={() => handleSort(key)}
                            className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:text-slate-700 transition-colors"
                          >
                            <div className="flex items-center gap-1.5">
                              {label}
                              <SortIcon field={key} />
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRecords.map((r) => (
                        <tr
                          key={r.id}
                          className="border-b border-slate-50 last:border-0 hover:bg-slate-50/40 transition-colors"
                        >
                          <td className="px-4 py-3.5 text-slate-700 whitespace-nowrap">
                            {r.travelDate}
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 max-w-[240px] truncate" title={r.reason}>
                            {r.reason}
                          </td>
                          <td className="px-4 py-3.5 text-slate-700 whitespace-nowrap font-medium">
                            {r.bookingReference}
                          </td>
                          <td className="px-4 py-3.5 text-slate-700 whitespace-nowrap">
                            {r.productName}
                          </td>
                          <td className="px-4 py-3.5 text-slate-800 whitespace-nowrap font-semibold text-right">
                            {formatCurrency(r.bookingValue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className="px-4 py-3.5 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Total</span>
                  <span className="text-sm font-bold text-slate-800">{formatCurrency(totalLost)}</span>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
