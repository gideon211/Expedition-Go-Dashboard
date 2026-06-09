import axios from "axios";
import config from "@/config";
import { retryWithBackoff, isRetryableError, handleApiError } from "./errorHandler";
import { useAuthStore, getAuthToken } from "@/stores/authStore";
import { auth } from "./firebase";

const FALLBACK_BASE_URL = "https://expedition-go-backend-v2.onrender.com/api";

const AUTH_REQUIRED_PREFIXES = [
  "/suppliers",
  "/tours/supplier",
  "/bookings",
  "/notifications",
  "/admin",
  "/reviews",
  "/payout",
];

const api = axios.create({
  baseURL: config.api.baseURL || FALLBACK_BASE_URL,
  timeout: config.api.timeout,
  withCredentials: true, // Required: send & accept cookies on every request
});

function getRequestAuthorization(headers) {
  if (!headers) return null;
  if (typeof headers.get === "function") {
    return headers.get("Authorization") || headers.get("authorization");
  }
  return headers.Authorization || headers.authorization || null;
}

function setRequestAuthorization(headers, value) {
  if (typeof headers.set === "function") {
    headers.set("Authorization", value);
    return headers;
  }
  headers.Authorization = value;
  return headers;
}

function requiresAuth(requestConfig) {
  if (requestConfig.skipAuthGuard) {
    return false;
  }

  const url = (requestConfig.url || "").split("?")[0];
  if (url === "/users/signup" || url.endsWith("/users/signup")) {
    return false;
  }

  if (AUTH_REQUIRED_PREFIXES.some((prefix) => url.startsWith(prefix))) {
    return true;
  }

  const method = (requestConfig.method || "get").toLowerCase();
  if (/^\/tours(\/|$)/.test(url) && method !== "get") {
    return true;
  }

  return false;
}

function createAuthRequiredError() {
  const error = new axios.CanceledError("Authentication required");
  error.code = "AUTH_REQUIRED";
  return error;
}

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (requestConfig) => {
    const token = getAuthToken();
    const headers = requestConfig.headers ?? {};

    if (token && !getRequestAuthorization(headers)) {
      requestConfig.headers = setRequestAuthorization(headers, `Bearer ${token}`);
    }

    const authorization = getRequestAuthorization(requestConfig.headers ?? headers);
    if (requiresAuth(requestConfig) && !authorization) {
      return Promise.reject(createAuthRequiredError());
    }

    return requestConfig;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Blocked locally — never hit the network
    if (axios.isCancel(error) || error.code === "AUTH_REQUIRED") {
      return Promise.reject(error);
    }

    // Log errors in development
    if (config.isDevelopment()) {
      console.error("❌ API Error:", {
        status: error.response?.status,
        url: originalRequest?.url,
        message: error.message,
        response: error.response?.data,
      });
    }

    // Handle 401 Unauthorized — attempt token refresh before giving up
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;

      try {
        // Try to get a fresh Firebase ID token
        if (auth?.currentUser) {
          const freshToken = await auth.currentUser.getIdToken(true);
          if (freshToken) {
            // Update stored token so subsequent requests use it
            useAuthStore.getState().setToken(freshToken);
            // Retry the original request with the new token
            originalRequest.headers.Authorization = `Bearer ${freshToken}`;
            return api(originalRequest);
          }
        }
      } catch {
        // Token refresh failed — fall through to logout
      }

      // Token refresh didn't work — user must re-authenticate
      if (!originalRequest?.skipGlobalErrorHandler) {
        if (typeof window !== "undefined") {
          localStorage.setItem("auth_return_url", window.location.pathname + window.location.search);
        }
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        useAuthStore.getState().setUnauthenticated();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    }

    // Retry logic for retryable errors
    if (isRetryableError(error) && !originalRequest._retry) {
      originalRequest._retry = true;
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

      // Only retry up to configured max attempts
      if (originalRequest._retryCount <= config.api.retryAttempts) {
        try {
          // Retry with exponential backoff
          return await retryWithBackoff(
            () => api.request(originalRequest),
            config.api.retryAttempts - originalRequest._retryCount,
            1000
          );
        } catch (retryError) {
          if (!originalRequest?.skipGlobalErrorHandler) {
            handleApiError(retryError);
          }
          return Promise.reject(retryError);
        }
      }
    }

    // Handle other errors (auth flows show their own toasts)
    if (!originalRequest?.skipGlobalErrorHandler) {
      handleApiError(error);
    }

    // Fallback: redirect to login on any 401 that wasn't caught above
    if (error.response?.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      useAuthStore.getState().setUnauthenticated();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

/**
 * Helper function to make API requests with automatic retry
 */
export async function apiRequest(requestFn) {
  try {
    return await retryWithBackoff(requestFn, config.api.retryAttempts);
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export default api;
