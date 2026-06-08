import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Grid3X3, List, Plus, Eye, Edit, Trash2, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import StatusBadge from "@/components/shared/StatusBadge";
import { PRODUCT_STATUSES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { listMyProducts, listProducts, deleteProduct } from "@/features/products/api";
import EmptyState from "@/components/shared/EmptyState";
import { getAuthToken, useAuthStore } from "@/stores/authStore";
import config from "@/config";

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
    const businessInfo = tour?.supplier?.supplierProfile?.businessInfo;
    return (
      businessInfo?.displayName ||
      businessInfo?.legalBusinessName ||
      businessInfo?.businessName ||
      tour?.supplier?.name ||
      ""
    );
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
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [viewMode, setViewMode] = useState("grid");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [imgErrors, setImgErrors] = useState({});
  const [imgLoaded, setImgLoaded] = useState({});

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ["products", "list"],
    queryFn: async () => {
      const useSupplier = Boolean(getAuthToken());
      const apiCall = useSupplier
        ? listMyProducts({ limit: 100 })
        : listProducts({ limit: 100 });
      const res = await apiCall;
      return { tours: res.data?.data?.tours || [], useSupplier };
    },
    staleTime: 30_000,
    retry: 1,
  });

  const deleteMut = useMutation({
    mutationFn: (id) => deleteProduct(id),
    onSuccess: (_, id) => {
      toast.success("Product deleted successfully");
      queryClient.setQueryData(["products", "list"], (old) => {
        if (!old) return old;
        return { ...old, tours: old.tours.filter((p) => p.id !== id) };
      });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || "Failed to delete product");
    },
  });

  const products = data?.tours || [];
  const usingSupplierEndpoint = data?.useSupplier ?? Boolean(getAuthToken());

  const getSupplierLabel = (product) => {
    const name = extractSupplierName(product) || (usingSupplierEndpoint ? user?.name : "");
    return name || "No supplier";
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = !search ||
      product.title?.toLowerCase().includes(search.toLowerCase()) ||
      getSupplierLabel(product).toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || extractCategory(product) === categoryFilter;
    const matchesStatus = !statusFilter || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getPhotoSrc = useCallback((product) => {
    const photoUrl = product.coverPhoto || product.photos?.find(p => p);
    if (!photoUrl) return null;
    if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) return photoUrl;
    return `${config.api.baseURL}/tours/${product.id}/photo`;
  }, []);

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
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] transition-colors"
          >
            <RefreshCw size={16} className={isRefetching ? "animate-spin" : ""} />
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

      {/* Skeleton Loading */}
      {isLoading && (
        <>
          {viewMode === "table" ? (
            <div className="bg-white rounded-lg border border-[#eaeaea] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#eaeaea] bg-[#f8fafc]">
                      {["Product", "Category", "Status", "Price", "Bookings", "Rating", "Last Updated", "Actions"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-[#eaeaea]">
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-[#eaeaea] rounded animate-pulse" style={{ width: j === 0 ? "70%" : j === 7 ? "40%" : "55%" }} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-[#eaeaea] overflow-hidden">
                  <div className="h-48 bg-[#f0f0f0] animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-[#eaeaea] rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-[#eaeaea] rounded animate-pulse w-1/2" />
                    <div className="h-5 bg-[#eaeaea] rounded animate-pulse w-1/3" />
                    <div className="pt-3 border-t border-[#eaeaea] flex items-center justify-between">
                      <div className="h-3 bg-[#eaeaea] rounded animate-pulse w-1/4" />
                      <div className="flex gap-1">
                        <div className="h-6 w-6 bg-[#eaeaea] rounded animate-pulse" />
                        <div className="h-6 w-6 bg-[#eaeaea] rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Error State */}
      {isError && !isLoading && (
        <div className="bg-[#fef2f2] border border-[#fca5a5] rounded-lg p-6 text-center">
          <AlertCircle size={40} className="text-[#dc2626] mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-[#991b1b] mb-2">Failed to Load Products</h2>
          <p className="text-sm text-[#b91c1c] mb-4">{error?.response?.data?.message || error?.message || "Failed to load products"}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-[#044b3b] text-white rounded-lg text-sm font-medium hover:bg-[#033629] transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Auth Mode Banner */}
      {!isLoading && !isError && !usingSupplierEndpoint && (
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
      {!isLoading && !isError && (
        <p className="text-sm text-[#64748b] mb-4">
          Showing {filteredProducts.length} of {products.length} product{products.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Grid View */}
      {!isLoading && !isError && viewMode === "grid" && (
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
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-[#eaeaea] flex items-center justify-center text-2xl text-[#9e9e9e]">
                      <span>🏞️</span>
                    </div>
                  </div>

                  {(() => {
                    const src = getPhotoSrc(product);
                    if (!src) return null;
                    const pid = product.id;
                    const showSkeleton = !imgLoaded[pid] && !imgErrors[pid];
                    return (
                      <>
                        {showSkeleton && (
                          <div className="absolute inset-0 bg-[#f0f0f0] animate-pulse" />
                        )}
                        <img
                          src={src}
                          alt={product.title}
                          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${imgLoaded[pid] ? "opacity-100" : "opacity-0"}`}
                          loading="lazy"
                          onLoad={() => setImgLoaded((prev) => ({ ...prev, [pid]: true }))}
                          onError={(e) => {
                            setImgErrors((prev) => ({ ...prev, [pid]: true }));
                            const proxy = `${config.api.baseURL}/tours/${product.id}/photo`;
                            if (e.target.src !== proxy) {
                              e.target.src = proxy;
                            } else {
                              e.target.style.display = "none";
                            }
                          }}
                        />
                      </>
                    );
                  })()}

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
                <p className="text-xs text-[#64748b] mt-1">{getSupplierLabel(product)}</p>

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
                          onClick={() => {
                            if (!window.confirm(`Are you sure you want to delete "${product.title || "this product"}"? This action cannot be undone.`)) return;
                            deleteMut.mutate(product.id);
                          }}
                          disabled={deleteMut.isPending && deleteMut.variables === product.id}
                          className="p-1.5 text-[#64748b] hover:text-[#dc3545] hover:bg-[#ffebeb] rounded-md transition-colors disabled:opacity-40"
                          title="Delete"
                        >
                          {deleteMut.isPending && deleteMut.variables === product.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
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
      {!isLoading && !isError && viewMode === "table" && (
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
                        <p className="text-xs text-[#64748b]">{getSupplierLabel(product)}</p>
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
                              onClick={() => {
                                if (!window.confirm(`Are you sure you want to delete "${product.title || "this product"}"? This action cannot be undone.`)) return;
                                deleteMut.mutate(product.id);
                              }}
                              disabled={deleteMut.isPending && deleteMut.variables === product.id}
                              className="p-1.5 text-[#64748b] hover:text-[#dc3545] hover:bg-[#ffebeb] rounded-md transition-colors disabled:opacity-40"
                              title="Delete"
                            >
                              {deleteMut.isPending && deleteMut.variables === product.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
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
      {!isLoading && !isError && filteredProducts.length === 0 && (
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
