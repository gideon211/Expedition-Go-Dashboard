import { useCallback, useEffect, useState, useRef } from "react";
import {
  DollarSign, Wallet, CreditCard, Loader2, RefreshCw, Plus, Trash2,
  TrendingUp, TrendingDown, Building2, Landmark, Eye, EyeOff,
  ChevronDown, CheckCircle2, XCircle, AlertTriangle, ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  createPayoutMethod, deletePayoutMethod, fetchEarnings, fetchPayoutMethods, fetchPayouts,
} from "../api";
import { getAuthToken } from "@/stores/authStore";

const TABS = [
  { key: "earnings", label: "Earnings", icon: DollarSign },
  { key: "payouts", label: "Payouts", icon: Wallet },
  { key: "methods", label: "Payout Methods", icon: CreditCard },
];

const METHOD_TYPES = [
  { value: "BANK_TRANSFER", label: "Bank Transfer", icon: Building2 },
  { value: "PAYPAL", label: "PayPal", icon: Wallet },
];

const INITIAL_METHOD_FORM = {
  type: "BANK_TRANSFER", accountName: "", accountNumber: "", bankName: "", bankCountry: "",
  mobileProvider: "", mobileNumber: "", paypalEmail: "", currency: "USD",
};

function TabPanel({ active, children }) {
  return (
    <div className={active ? "block" : "hidden"}>
      {children}
    </div>
  );
}

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
  const [methodForm, setMethodForm] = useState(INITIAL_METHOD_FORM);
  const [savingMethod, setSavingMethod] = useState(false);
  const [expandedMethod, setExpandedMethod] = useState(null);
  const prevTabRef = useRef(activeTab);

  const loadData = useCallback(async () => {
    if (!getAuthToken()) { setLoading(false); return; }
    setLoading(true); setError(null);
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
    } finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddMethod = async (e) => {
    e.preventDefault(); setSavingMethod(true);
    try {
      const payload = { type: methodForm.type, currency: methodForm.currency };
      if (methodForm.type === "BANK_TRANSFER") {
        Object.assign(payload, { accountName: methodForm.accountName, accountNumber: methodForm.accountNumber, bankName: methodForm.bankName, bankCountry: methodForm.bankCountry });
      } else { payload.paypalEmail = methodForm.paypalEmail; }
      await createPayoutMethod(payload);
      toast.success("Payout method added");
      setShowMethodForm(false);
      setMethodForm(INITIAL_METHOD_FORM);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add payout method");
    } finally { setSavingMethod(false); }
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

  const summaryStats = activeTab === "earnings" ? [
    { label: "Total Earnings", value: formatCurrency(Number(earningsSummary.totalEarnings) || 0), icon: DollarSign, color: "#044b3b", bar: "bg-emerald-200/60" },
    { label: "Total Revenue", value: formatCurrency(Number(earningsSummary.totalRevenue) || 0), icon: TrendingUp, color: "#0f766e", bar: "bg-blue-200/60" },
    { label: "Commission Paid", value: formatCurrency(Number(earningsSummary.totalCommission) || 0), icon: TrendingDown, color: "#ca8a04", bar: "bg-amber-200/60" },
    { label: "Confirmed Bookings", value: earningsSummary.totalBookings || 0, icon: CheckCircle2, color: "#0891b2", bar: "bg-cyan-200/60" },
  ] : activeTab === "payouts" ? [
    { label: "Total Paid Out", value: formatCurrency(Number(payoutsSummary.totalEarned) || 0), icon: Wallet, color: "#044b3b", bar: "bg-emerald-200/60" },
    { label: "Payout Records", value: payoutsSummary.totalPayouts || 0, icon: CreditCard, color: "#0f766e", bar: "bg-blue-200/60" },
  ] : [
    { label: "Payout Methods", value: methods.length, icon: CreditCard, color: "#044b3b", bar: "bg-emerald-200/60" },
  ];

  return (
    <div className="p-5 md:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Finance</h1>
          <p className="text-xs text-slate-400 mt-0.5">Track earnings, payouts, and payment methods</p>
        </div>
        <button onClick={loadData} disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-emerald-100/60 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-40 shadow-sm"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className={`grid gap-3 ${activeTab === "earnings" ? "grid-cols-2 lg:grid-cols-4" : activeTab === "payouts" ? "grid-cols-2 lg:grid-cols-2" : "grid-cols-1 lg:grid-cols-1 max-w-xs"}`}>
        {summaryStats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white border border-emerald-100/60 rounded-xl p-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center">
                  <Icon size={16} style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-lg font-bold text-slate-800">{s.value}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{s.label}</p>
              <div className={`mt-2 h-0.5 w-full rounded-full ${s.bar}`} />
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 border border-emerald-100/60 w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => { prevTabRef.current = activeTab; setActiveTab(tab.key); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                activeTab === tab.key ? "bg-emerald-600 text-white" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle size={12} /> {error}
        </div>
      )}

      {/* Content */}
      <div className="relative">
        {/* Earnings */}
        <TabPanel active={activeTab === "earnings"}>
          {loading ? (
            <div className="bg-white border border-emerald-100/60 rounded-xl overflow-hidden">
              <div className="p-4 space-y-3">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-4 w-24 bg-emerald-100/40 rounded animate-pulse" />
                    <div className="h-4 w-32 bg-emerald-100/40 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-emerald-100/40 rounded animate-pulse ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          ) : earnings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-emerald-100/60 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                <DollarSign size={20} className="text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-700 mb-1">No earnings yet</p>
              <p className="text-xs text-slate-400">Earnings will appear once bookings start coming in.</p>
            </div>
          ) : (
            <div className="bg-white border border-emerald-100/60 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Booking</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Tour</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Customer</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Travel Date</th>
                      <th className="text-right py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Payout</th>
                      <th className="text-right py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Commission</th>
                      <th className="text-right py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.map((e) => (
                      <tr key={e.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4"><span className="font-mono text-[11px] text-[#044b3b] font-semibold">{e.bookingNumber}</span></td>
                        <td className="py-3 px-4 text-[11px] text-slate-600">{e.tour}</td>
                        <td className="py-3 px-4 text-[11px] text-slate-600">{e.customer}</td>
                        <td className="py-3 px-4 text-[11px] text-slate-500">{formatDate(e.travelDate)}</td>
                        <td className="py-3 px-4 text-right text-[11px] font-semibold text-emerald-600">{formatCurrency(e.supplierPayout, e.currency)}</td>
                        <td className="py-3 px-4 text-right text-[11px] text-slate-500">{formatCurrency(e.commissionAmount, e.currency)}</td>
                        <td className="py-3 px-4 text-right text-[11px] font-semibold text-slate-800">{formatCurrency(e.total, e.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabPanel>

        {/* Payouts */}
        <TabPanel active={activeTab === "payouts"}>
          {loading ? (
            <div className="bg-white border border-emerald-100/60 rounded-xl overflow-hidden">
              <div className="p-4 space-y-3">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-4 w-20 bg-emerald-100/40 rounded animate-pulse" />
                    <div className="h-4 w-28 bg-emerald-100/40 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-emerald-100/40 rounded animate-pulse ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          ) : payouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-emerald-100/60 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                <Wallet size={20} className="text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-700 mb-1">No payouts yet</p>
              <p className="text-xs text-slate-400">Payouts are processed once bookings are completed.</p>
            </div>
          ) : (
            <div className="bg-white border border-emerald-100/60 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Payout ID</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Booking</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Tour</th>
                      <th className="text-right py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                      <th className="text-center py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((p) => (
                      <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4"><span className="font-mono text-[10px] text-[#044b3b] font-semibold">{p.id}</span></td>
                        <td className="py-3 px-4 text-[11px] text-slate-600">{p.bookingNumber}</td>
                        <td className="py-3 px-4 text-[11px] text-slate-600">{p.tour}</td>
                        <td className="py-3 px-4 text-right text-[11px] font-semibold text-slate-800">{formatCurrency(p.amount, p.currency)}</td>
                        <td className="py-3 px-4 text-center"><StatusBadge status={p.status} label={p.status.replace(/_/g, " ")} size="sm" /></td>
                        <td className="py-3 px-4 text-[11px] text-slate-500">{formatDate(p.date)}</td>
                        <td className="py-3 px-4 text-[11px] text-slate-500">{p.method}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabPanel>

        {/* Payout Methods */}
        <TabPanel active={activeTab === "methods"}>
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setShowMethodForm((v) => !v)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                  showMethodForm ? "bg-slate-100 text-slate-600 border border-emerald-100/60" : "bg-[#044b3b] text-white hover:bg-[#033629] shadow-sm"
                }`}
              >
                <Plus size={13} />
                {showMethodForm ? "Cancel" : "Add Method"}
              </button>
            </div>

            {/* Add Method Form */}
            <div className={`transition-all duration-300 overflow-hidden ${showMethodForm ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
              <form onSubmit={handleAddMethod} className="bg-white border border-emerald-100/60 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-800">New Payout Method</h3>
                <div className="flex gap-2">
                  {METHOD_TYPES.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button key={t.value} type="button" onClick={() => setMethodForm((prev) => ({ ...prev, type: t.value }))}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-all flex-1 ${
                          methodForm.type === t.value ? "bg-[#044b3b] text-white shadow-sm" : "bg-slate-50 text-slate-600 border border-emerald-100/60 hover:bg-slate-100"
                        }`}
                      >
                        <Icon size={14} /> {t.label}
                      </button>
                    );
                  })}
                </div>

                {methodForm.type === "BANK_TRANSFER" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Account name" value={methodForm.accountName} onChange={(e) => setMethodForm((p) => ({ ...p, accountName: e.target.value }))}
                      className="col-span-2 px-3 py-2.5 bg-slate-50 border border-emerald-100/60 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] focus:bg-white transition-all" required />
                    <input placeholder="Account number" value={methodForm.accountNumber} onChange={(e) => setMethodForm((p) => ({ ...p, accountNumber: e.target.value }))}
                      className="px-3 py-2.5 bg-slate-50 border border-emerald-100/60 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] focus:bg-white transition-all" required />
                    <input placeholder="Bank name" value={methodForm.bankName} onChange={(e) => setMethodForm((p) => ({ ...p, bankName: e.target.value }))}
                      className="px-3 py-2.5 bg-slate-50 border border-emerald-100/60 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] focus:bg-white transition-all" required />
                    <input placeholder="Country (e.g. GH)" value={methodForm.bankCountry} onChange={(e) => setMethodForm((p) => ({ ...p, bankCountry: e.target.value }))}
                      className="px-3 py-2.5 bg-slate-50 border border-emerald-100/60 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] focus:bg-white transition-all" required />
                  </div>
                ) : (
                  <input type="email" placeholder="PayPal email" value={methodForm.paypalEmail} onChange={(e) => setMethodForm((p) => ({ ...p, paypalEmail: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-emerald-100/60 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] focus:bg-white transition-all" required />
                )}

                <button type="submit" disabled={savingMethod}
                  className="w-full py-2.5 bg-[#044b3b] text-white rounded-lg text-xs font-medium hover:bg-[#033629] transition-colors disabled:opacity-50"
                >
                  {savingMethod ? "Saving..." : "Save Method"}
                </button>
              </form>
            </div>

            {/* Methods List */}
            {loading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white border border-emerald-100/60 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100/40 animate-pulse" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-4 w-32 bg-emerald-100/40 rounded animate-pulse" />
                        <div className="h-3 w-48 bg-emerald-100/40 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : methods.length === 0 && !showMethodForm ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-emerald-100/60 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                  <CreditCard size={20} className="text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-700 mb-1">No payout methods</p>
                <p className="text-xs text-slate-400">Add one to start receiving payouts.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {methods.map((method) => {
                  const isExpanded = expandedMethod === method.id;
                  return (
                    <div key={method.id} className={`bg-white border rounded-xl transition-all cursor-pointer ${isExpanded ? "border-emerald-300 shadow-sm" : "border-emerald-100/60 hover:border-emerald-200 hover:shadow-sm"}`}>
                      <div className="p-4" onClick={() => setExpandedMethod(isExpanded ? null : method.id)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#044b3b]/10 flex items-center justify-center shrink-0">
                              {method.type === "BANK_TRANSFER" ? <Landmark size={18} className="text-[#044b3b]" /> : <Wallet size={18} className="text-[#044b3b]" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-slate-800">{method.type.replace(/_/g, " ")}</p>
                                {method.isDefault && <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Default</span>}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {method.accountName || method.mobileProvider || method.paypalEmail || "—"}
                                <span className={`ml-2 inline-flex items-center gap-1 ${method.verified ? "text-emerald-600" : "text-amber-600"}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${method.verified ? "bg-emerald-500" : "bg-amber-500"}`} />
                                  {method.verified ? "Verified" : "Pending"}
                                </span>
                              </p>
                            </div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteMethod(method.id); }}
                            className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                      {/* Expanded details */}
                      <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"}`}>
                        <div className="px-4 pb-4 pt-0 border-t border-emerald-100/40 mx-4">
                          <div className="pt-3 grid grid-cols-2 gap-3 text-xs">
                            {method.type === "BANK_TRANSFER" && (
                              <>
                                <div>
                                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Account Name</p>
                                  <p className="text-sm font-medium text-slate-700 mt-0.5">{method.accountName || "—"}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Account Number</p>
                                  <p className="text-sm font-medium text-slate-700 mt-0.5 font-mono">{method.accountNumber || "—"}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Bank Name</p>
                                  <p className="text-sm font-medium text-slate-700 mt-0.5">{method.bankName || "—"}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Country</p>
                                  <p className="text-sm font-medium text-slate-700 mt-0.5">{method.bankCountry || method.country || "—"}</p>
                                </div>
                              </>
                            )}
                            {method.type === "PAYPAL" && (
                              <div className="col-span-2">
                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">PayPal Email</p>
                                <p className="text-sm font-medium text-slate-700 mt-0.5">{method.paypalEmail || "—"}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Currency</p>
                              <p className="text-sm font-medium text-slate-700 mt-0.5">{method.currency || "USD"}</p>
                            </div>
                            {method.createdAt && (
                              <div>
                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Added</p>
                                <p className="text-sm font-medium text-slate-700 mt-0.5">{formatDate(method.createdAt)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabPanel>
      </div>
    </div>
  );
}
