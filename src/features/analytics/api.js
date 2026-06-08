import api from "@/lib/axios";

export async function fetchSupplierAnalytics() {
  const response = await api.get("/suppliers/dashboard", { skipGlobalErrorHandler: true });
  return response.data?.data || null;
}
