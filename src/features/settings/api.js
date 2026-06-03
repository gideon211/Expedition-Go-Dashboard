import api from "@/lib/axios";

export async function fetchCurrentUser() {
  const response = await api.get("/users/me", { skipGlobalErrorHandler: true });
  return response.data?.data?.user || null;
}

export function updateCurrentUser(data) {
  return api.patch("/users/updateMe", data, { skipGlobalErrorHandler: true });
}

export async function uploadSupplierLogo(formData) {
  const response = await api.post("/suppliers/logo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    skipGlobalErrorHandler: true,
  });
  return response.data?.data || null;
}
