import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Grid3X3, List, Plus, Eye, Edit, Trash2, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import StatusBadge from "@/components/shared/StatusBadge";
import { PRODUCT_STATUSES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { listMyProducts, listProducts, deleteProduct } from "@/features/products/api";
import EmptyState from "@/components/shared/EmptyState";
import { useAuthStore } from "@/stores/authStore";

function extractPrice(tour) {
  try {
    const prices = tour?.schedulesAndPricing?.pricingSchedules?.schedules?.[0]?.prices;
    if (prices?.length > 0) {
      const minPrice = Math.min(...prices.map((p) => p.retailPrice || Infinity));
      return minPrice !== Infinity ? minPrice : null;
    }
  } catch {}
  return null;
}

function extractCurrency(tour) {
  try {
    return tour?.schedulesAndPricing?.pricingSchedules?.currency || "USD";
  } catch {
    return "USD";
  }
}

function extractCategory(tour) {
  try {
    return tour?.categorization?.category || tour?.category || "";
  } catch {
    return "";
  }
}

function extractSupplierName(tour) {
  try {
    return tour?.supplier?.name || tour?.supplier?.supplierProfile?.businessInfo?.businessName || "";
  } catch {
    return "";
  }
}

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "Cultural", label: "Cultural" },
  { value: "Adventure", label: "Adventure" },
  { value: "Nature", label: "Nature" },
  { value: "Food & Drink", label: "Food & Drink" },
  { value: "City Tour", label: "City Tour" },
  { value: "Wildlife", label: "Wildlife" },
  { value: "Trekking", label: "Trekking" },
];

export default function ProductsListPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("grid");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [usingSupplierEndpoint, setUsingSupplierEndpoint] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const fetchProducts = () => {
    setLoading(true);
    setError(null);

    const attempt = (useSupplier) => {
      const apiCall = useSupplier ? listMyProducts({ limit: 100 }) : listProducts({ limit: 100 });

      return apiCall
        .then((res) => {
          const tours = res.data?.data?.tours || [];
          setProducts(tours);
          setUsingSupplierEndpoint(useSupplier);
        })
        .catch((err) => {
          const status = err.response?.status;
          if (useSupplier && (status === 401 || status === 403)) {
            return attempt(false);
          }
          throw err;
        });
    };

    attempt(isAuthenticated)
      .catch((err) => {
        setError(err.response?.data?.message || err.message || "Failed to load products");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, [isAuthenticated]);

  const handleDelete = (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title || "this product"}"? This action cannot be undone.`)) return;

    setDeletingId(id);
    deleteProduct(id)
      .then(() => {
        toast.success("Product deleted successfully");
        setProducts((prev) => prev.filter((p) => p.id !== id));
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || err.message || "Failed to delete product");
      })
      .finally(() => setDeletingId(null));
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = !search ||
      product.title?.toLowerCase().includes(search.toLowerCase()) ||
      extractSupplierName(product).toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || extractCategory(product) === categoryFilter;
    const matchesStatus = !statusFilter || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="p-4 md:p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1e293b]">Products</h1>
          <p className="text-sm text-[#64748b] mt-1">Manage your tour products and experiences</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] transition-colors"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={() => navigate("/products/build/new/type")}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#044b3b] text-white rounded-lg text-sm font-medium hover:bg-[#033629] transition-colors"
          >
            <Plus size={16} />
            Create Product
          </button>
        </div>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm text-[#1e293b] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b]"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2.5 border border-[#eaeaea] rounded-lg text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b]"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border border-[#eaeaea] rounded-lg text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b]"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="INACTIVE">Inactive</option>
            <option value="PAUSED">Paused</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        <div className="flex items-center border border-[#eaeaea] rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2.5 transition-colors ${viewMode === "grid" ? "bg-[#044b3b] text-white" : "bg-white text-[#64748b] hover:bg-[#f8fafc]"}`}
          >
            <Grid3X3 size={18} />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`p-2.5 transition-colors ${viewMode === "table" ? "bg-[#044b3b] text-white" : "bg-white text-[#64748b] hover:bg-[#f8fafc]"}`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && products.length === 0 && (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-[#044b3b]" />
            <p className="text-sm text-[#64748b]">Loading products...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-[#fef2f2] border border-[#fca5a5] rounded-lg p-6 text-center">
          <AlertCircle size={40} className="text-[#dc2626] mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-[#991b1b] mb-2">Failed to Load Products</h2>
          <p className="text-sm text-[#b91c1c] mb-4">{error}</p>
          <button
            onClick={fetchProducts}
            className="px-4 py-2 bg-[#044b3b] text-white rounded-lg text-sm font-medium hover:bg-[#033629] transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Auth Mode Banner */}
      {!loading && !error && !usingSupplierEndpoint && (
        <div className="mb-4 p-3 bg-[#fffbeb] border border-[#fcd34d] rounded-lg flex items-start gap-3">
          <AlertCircle size={18} className="text-[#b45309] mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[#1e293b]">Browsing public tours</p>
            <p className="text-xs text-[#64748b] mt-0.5">
              Sign in as a supplier to view and manage your own products, including drafts.
            </p>
          </div>
        </div>
      )}

      {/* Results Count */}
      {!loading && !error && (
        <p className="text-sm text-[#64748b] mb-4">
          Showing {filteredProducts.length} of {products.length} product{products.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Grid View */}
      {!loading && !error && viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg border border-[#eaeaea] overflow-hidden hover:shadow-md transition-shadow"
            >
                <div
                  className="h-48 bg-[#f8fafc] relative cursor-pointer overflow-hidden"
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  {/* Placeholder always rendered underneath */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-[#eaeaea] flex items-center justify-center text-2xl text-[#9e9e9e]">
                      <span>🏞️</span>
                    </div>
                  </div>

                  {/* Image overlaid on top — disappears on error, revealing placeholder */}
                  {(product.coverPhoto || product.photos?.[0]) && (
                    <img
                      src={product.coverPhoto || product.photos[0]}
                      alt={product.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="eager"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = "none";
                      }}
                    />
                  )}

                  <div className="absolute top-3 left-3">
                    <StatusBadge status={product.status} label={PRODUCT_STATUSES[product.status]?.label} size="sm" />
                  </div>
                </div>

              <div className="p-4">
                <h3
                  className="text-sm font-semibold text-[#1e293b] line-clamp-1 cursor-pointer hover:text-[#044b3b]"
                  title={product.title}
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  {product.title}
                </h3>
                <p className="text-xs text-[#64748b] mt-1">{extractSupplierName(product) || "No supplier"}</p>

                <div className="flex items-center gap-2 mt-3">
                  {extractPrice(product) !== null ? (
                    <>
                      <span className="text-lg font-bold text-[#044b3b]">
                        {formatCurrency(extractPrice(product), extractCurrency(product))}
                      </span>
                      <span className="text-xs text-[#64748b]">/ person</span>
                    </>
                  ) : (
                    <span className="text-sm text-[#9e9e9e]">Price not set</span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#eaeaea]">
                  <div className="flex items-center gap-3 text-xs text-[#64748b]">
                    <span>{product._count?.bookings ?? 0} bookings</span>
                    {product.averageRating > 0 && (
                      <span className="flex items-center gap-0.5">
                        ⭐ {product.averageRating}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/products/${product.id}`)}
                      className="p-1.5 text-[#64748b] hover:text-[#0284c7] hover:bg-[#f0f9ff] rounded-md transition-colors"
                      title="View"
                    >
                      <Eye size={14} />
                    </button>
                    {usingSupplierEndpoint && (
                      <>
                        <button
                          onClick={() => navigate(`/products/build/${product.id}/type`)}
                          className="p-1.5 text-[#64748b] hover:text-[#044b3b] hover:bg-[#f0fdf4] rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.title)}
                          disabled={deletingId === product.id}
                          className="p-1.5 text-[#64748b] hover:text-[#dc3545] hover:bg-[#ffebeb] rounded-md transition-colors disabled:opacity-40"
                          title="Delete"
                        >
                          {deletingId === product.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {!loading && !error && viewMode === "table" && (
        <div className="bg-white rounded-lg border border-[#eaeaea] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#eaeaea] bg-[#f8fafc]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase">Bookings</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase">Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase">Last Updated</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-[#eaeaea] hover:bg-[#f8fafc] transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p
                          className="font-medium text-[#1e293b] cursor-pointer hover:text-[#044b3b]"
                          onClick={() => navigate(`/products/${product.id}`)}
                        >
                          {product.title}
                        </p>
                        <p className="text-xs text-[#64748b]">{extractSupplierName(product) || "No supplier"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-[#64748b]">{extractCategory(product) || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={product.status} label={PRODUCT_STATUSES[product.status]?.label} size="sm" />
                    </td>
                    <td className="px-4 py-3 font-medium text-[#1e293b]">
                      {extractPrice(product) !== null
                        ? formatCurrency(extractPrice(product), extractCurrency(product))
                        : <span className="text-[#9e9e9e]">—</span>}
                    </td>
                    <td className="px-4 py-3 text-[#1e293b]">{product._count?.bookings ?? 0}</td>
                    <td className="px-4 py-3">
                      {product.averageRating > 0 ? (
                        <span className="flex items-center gap-1 text-[#1e293b]">
                          ⭐ {product.averageRating}
                        </span>
                      ) : (
                        <span className="text-[#9e9e9e]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#64748b]">{formatDate(product.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/products/${product.id}`)}
                          className="p-1.5 text-[#64748b] hover:text-[#0284c7] hover:bg-[#f0f9ff] rounded-md transition-colors"
                          title="View"
                        >
                          <Eye size={14} />
                        </button>
                        {usingSupplierEndpoint && (
                          <>
                            <button
                              onClick={() => navigate(`/products/build/${product.id}/type`)}
                              className="p-1.5 text-[#64748b] hover:text-[#044b3b] hover:bg-[#f0fdf4] rounded-md transition-colors"
                              title="Edit"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id, product.title)}
                              disabled={deletingId === product.id}
                              className="p-1.5 text-[#64748b] hover:text-[#dc3545] hover:bg-[#ffebeb] rounded-md transition-colors disabled:opacity-40"
                              title="Delete"
                            >
                              {deletingId === product.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredProducts.length === 0 && (
        <EmptyState
          icon="products"
          title={products.length === 0 ? "No products yet" : "No products match your filters"}
          description={products.length === 0 ? "Create your first product to start selling tours." : "Try adjusting your search or filters."}
          action={
            products.length === 0 ? (
              <button
                onClick={() => navigate("/products/build/new/type")}
                className="flex items-center gap-2 px-4 py-2 bg-[#044b3b] text-white rounded-lg text-sm font-medium hover:bg-[#033629] transition-colors"
              >
                <Plus size={16} />
                Create Product
              </button>
            ) : (
              <button
                onClick={() => { setSearch(""); setCategoryFilter(""); setStatusFilter(""); }}
                className="text-sm text-[#044b3b] hover:underline"
              >
                Clear all filters
              </button>
            )
          }
        />
      )}
    </div>
  );
}
