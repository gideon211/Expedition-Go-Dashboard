import { useCallback, useEffect, useState } from "react";
import {
  DollarSign,
  Wallet,
  CreditCard,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import StatusBadge from "@/components/shared/StatusBadge";
import DataTable from "@/components/shared/DataTable";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  createPayoutMethod,
  deletePayoutMethod,
  fetchEarnings,
  fetchPayoutMethods,
  fetchPayouts,
} from "../api";
import { getAuthToken } from "@/stores/authStore";

const TABS = [
  { key: "earnings", label: "Earnings", icon: DollarSign },
  { key: "payouts", label: "Payouts", icon: Wallet },
  { key: "methods", label: "Payout Methods", icon: CreditCard },
];

const METHOD_TYPES = [
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "PAYPAL", label: "PayPal" },
];

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState("earnings");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [earnings, setEarnings] = useState([]);
  const [earningsSummary, setEarningsSummary] = useState({});
  const [payouts, setPayouts] = useState([]);
  const [payoutsSummary, setPayoutsSummary] = useState({});
  const [methods, setMethods] = useState([]);
  const [showMethodForm, setShowMethodForm] = useState(false);
  const [methodForm, setMethodForm] = useState({
    type: "BANK_TRANSFER",
    accountName: "",
    accountNumber: "",
    bankName: "",
    bankCountry: "",
    mobileProvider: "",
    mobileNumber: "",
    paypalEmail: "",
    currency: "USD",
  });
  const [savingMethod, setSavingMethod] = useState(false);

  const loadData = useCallback(async () => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (activeTab === "earnings") {
        const result = await fetchEarnings({ limit: 50 });
        setEarnings(result.earnings);
        setEarningsSummary(result.summary);
      } else if (activeTab === "payouts") {
        const result = await fetchPayouts({ limit: 50 });
        setPayouts(result.payouts);
        setPayoutsSummary(result.summary);
      } else {
        const result = await fetchPayoutMethods();
        setMethods(result);
      }
    } catch (err) {
      if (err.code === "AUTH_REQUIRED") return;
      setError(err.response?.data?.message || err.message || "Failed to load finance data");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddMethod = async (e) => {
    e.preventDefault();
    setSavingMethod(true);

    try {
      const payload = { type: methodForm.type, currency: methodForm.currency };

      if (methodForm.type === "BANK_TRANSFER") {
        Object.assign(payload, {
          accountName: methodForm.accountName,
          accountNumber: methodForm.accountNumber,
          bankName: methodForm.bankName,
          bankCountry: methodForm.bankCountry,
        });
      } else {
        payload.paypalEmail = methodForm.paypalEmail;
      }

      await createPayoutMethod(payload);
      toast.success("Payout method added");
      setShowMethodForm(false);
      setMethodForm({
        type: "BANK_TRANSFER",
        accountName: "",
        accountNumber: "",
        bankName: "",
        bankCountry: "",
        paypalEmail: "",
        currency: "USD",
      });
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add payout method");
    } finally {
      setSavingMethod(false);
    }
  };

  const handleDeleteMethod = async (id) => {
    if (!confirm("Delete this payout method?")) return;

    try {
      await deletePayoutMethod(id);
      toast.success("Payout method deleted");
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete payout method");
    }
  };

  const earningsColumns = [
    {
      accessorKey: "bookingNumber",
      header: "Booking",
      cell: ({ row }) => <span className="font-mono text-xs text-[#044b3b]">{row.original.bookingNumber}</span>,
    },
    { accessorKey: "tour", header: "Tour" },
    { accessorKey: "customer", header: "Customer" },
    {
      accessorKey: "travelDate",
      header: "Travel Date",
      cell: ({ row }) => formatDate(row.original.travelDate),
    },
    {
      accessorKey: "supplierPayout",
      header: "Your Payout",
      cell: ({ row }) => (
        <span className="font-semibold text-[#00d67f]">
          {formatCurrency(row.original.supplierPayout, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: "commissionAmount",
      header: "Commission",
      cell: ({ row }) => formatCurrency(row.original.commissionAmount, row.original.currency),
    },
    {
      accessorKey: "total",
      header: "Booking Total",
      cell: ({ row }) => formatCurrency(row.original.total, row.original.currency),
    },
  ];

  const payoutColumns = [
    {
      accessorKey: "id",
      header: "Payout ID",
      cell: ({ row }) => <span className="font-mono text-xs text-[#044b3b]">{row.original.id.slice(0, 8)}...</span>,
    },
    { accessorKey: "bookingNumber", header: "Booking" },
    { accessorKey: "tour", header: "Tour" },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-semibold">{formatCurrency(row.original.amount, row.original.currency)}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} label={row.original.status} size="sm" />,
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.date),
    },
    { accessorKey: "method", header: "Method" },
  ];

  const summaryStats =
    activeTab === "earnings"
      ? [
          { label: "Total Earnings", value: formatCurrency(Number(earningsSummary.totalEarnings) || 0) },
          { label: "Total Revenue", value: formatCurrency(Number(earningsSummary.totalRevenue) || 0) },
          { label: "Commission Paid", value: formatCurrency(Number(earningsSummary.totalCommission) || 0) },
          { label: "Confirmed Bookings", value: earningsSummary.totalBookings || 0 },
        ]
      : activeTab === "payouts"
        ? [
            { label: "Total Paid Out", value: formatCurrency(Number(payoutsSummary.totalEarned) || 0) },
            { label: "Payout Records", value: payoutsSummary.totalPayouts || 0 },
          ]
        : [{ label: "Payout Methods", value: methods.length }];

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1e293b]">Finance</h1>
          <p className="text-sm text-[#64748b] mt-1">Track earnings, payouts, and payment methods</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryStats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-[#eaeaea] p-5">
            <p className="text-2xl font-bold text-[#1e293b]">{stat.value}</p>
            <p className="text-sm text-[#64748b] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? "bg-[#044b3b] text-white"
                  : "bg-white text-[#64748b] border border-[#eaeaea] hover:bg-[#f8fafc]"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
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
      ) : activeTab === "earnings" ? (
        <DataTable data={earnings} columns={earningsColumns} pageSize={25} />
      ) : activeTab === "payouts" ? (
        <DataTable data={payouts} columns={payoutColumns} pageSize={25} />
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowMethodForm((value) => !value)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#044b3b] text-white rounded-lg text-sm font-medium hover:bg-[#033629] transition-colors"
            >
              <Plus size={16} />
              Add Payout Method
            </button>
          </div>

          {showMethodForm && (
            <form onSubmit={handleAddMethod} className="bg-white border border-[#eaeaea] rounded-lg p-5 space-y-4">
              <h3 className="text-sm font-semibold text-[#1e293b]">New Payout Method</h3>
              <select
                value={methodForm.type}
                onChange={(e) => setMethodForm((prev) => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2.5 border border-[#eaeaea] rounded-lg text-sm"
              >
                {METHOD_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              {methodForm.type === "BANK_TRANSFER" && (
                <>
                  <input
                    placeholder="Account name"
                    value={methodForm.accountName}
                    onChange={(e) => setMethodForm((prev) => ({ ...prev, accountName: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-[#eaeaea] rounded-lg text-sm"
                    required
                  />
                  <input
                    placeholder="Account number"
                    value={methodForm.accountNumber}
                    onChange={(e) => setMethodForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-[#eaeaea] rounded-lg text-sm"
                    required
                  />
                  <input
                    placeholder="Bank name"
                    value={methodForm.bankName}
                    onChange={(e) => setMethodForm((prev) => ({ ...prev, bankName: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-[#eaeaea] rounded-lg text-sm"
                    required
                  />
                  <input
                    placeholder="Bank country code (e.g. GH, NG, US)"
                    value={methodForm.bankCountry}
                    onChange={(e) => setMethodForm((prev) => ({ ...prev, bankCountry: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-[#eaeaea] rounded-lg text-sm"
                    required
                  />
                </>
              )}

              {methodForm.type === "PAYPAL" && (
                <input
                  type="email"
                  placeholder="PayPal email"
                  value={methodForm.paypalEmail}
                  onChange={(e) => setMethodForm((prev) => ({ ...prev, paypalEmail: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-[#eaeaea] rounded-lg text-sm"
                  required
                />
              )}

              <button
                type="submit"
                disabled={savingMethod}
                className="px-4 py-2.5 bg-[#044b3b] text-white rounded-lg text-sm font-medium hover:bg-[#033629] disabled:opacity-50"
              >
                {savingMethod ? "Saving..." : "Save Method"}
              </button>
            </form>
          )}

          {methods.length === 0 ? (
            <div className="text-center py-12 bg-white border border-[#eaeaea] rounded-lg">
              <CreditCard size={32} className="mx-auto text-[#9e9e9e] mb-3" />
              <p className="text-sm text-[#64748b]">No payout methods yet. Add one to receive payouts.</p>
            </div>
          ) : (
            methods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 bg-white border border-[#eaeaea] rounded-lg"
              >
                <div>
                  <p className="text-sm font-semibold text-[#1e293b]">
                    {method.type.replace(/_/g, " ")}
                    {method.isDefault && (
                      <span className="ml-2 text-xs px-2 py-0.5 bg-[#f0fdf4] text-[#044b3b] rounded-full">
                        Default
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[#64748b] mt-1">
                    {method.accountName || method.mobileProvider || method.paypalEmail || "—"}
                    {method.verified ? " · Verified" : " · Pending verification"}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteMethod(method.id)}
                  className="p-2 text-[#64748b] hover:text-[#dc3545] hover:bg-[#ffebeb] rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
