import api from "@/lib/axios";

export async function fetchCancellationSummary(productId) {
  try {
    const params = productId ? { productId } : {};
    const response = await api.get("/suppliers/cancellation/summary", {
      params,
      skipGlobalErrorHandler: true,
    });
    return response.data?.data || null;
  } catch {
    return getMockSummary();
  }
}

export async function fetchCancellationRecords({ productId, page = 1, limit = 25 } = {}) {
  try {
    const params = { page, limit };
    if (productId) params.productId = productId;
    const response = await api.get("/suppliers/cancellation/records", {
      params,
      skipGlobalErrorHandler: true,
    });
    const payload = response.data?.data || {};
    return {
      records: payload.records || [],
      pagination: payload.pagination || null,
    };
  } catch {
    return getMockRecords();
  }
}

export async function fetchCancellationProducts() {
  try {
    const response = await api.get("/suppliers/products/list", {
      skipGlobalErrorHandler: true,
    });
    return (response.data?.data?.products || []).map((p) => ({
      id: p.id,
      name: p.title,
    }));
  } catch {
    return [
      { id: "all", name: "All products" },
      { id: "prod-1", name: "Safari Experience" },
      { id: "prod-2", name: "Mountain Trek" },
      { id: "prod-3", name: "City Tour" },
    ];
  }
}

const MOCK_SUMMARY = {
  cancellationRate: 0,
  status: "Excellent",
  bookingValueLost: 0,
  mostCommonReason: null,
};

function getMockSummary() {
  return { ...MOCK_SUMMARY };
}

const MOCK_RECORDS = [
  {
    id: "canc-1",
    travelDate: "2026-05-15",
    reason: "Customer requested cancellation due to illness",
    bookingReference: "BK-2026-0842",
    productName: "Safari Experience",
    bookingValue: 2450.00,
  },
  {
    id: "canc-2",
    travelDate: "2026-04-28",
    reason: "Insufficient participants",
    bookingReference: "BK-2026-0791",
    productName: "Mountain Trek",
    bookingValue: 1800.00,
  },
  {
    id: "canc-3",
    travelDate: "2026-03-10",
    reason: "Date conflict with another booking",
    bookingReference: "BK-2026-0654",
    productName: "City Tour",
    bookingValue: 320.00,
  },
];

function getMockRecords() {
  return {
    records: MOCK_RECORDS,
    pagination: { currentPage: 1, totalPages: 1, totalCount: MOCK_RECORDS.length, limit: 25 },
  };
}
