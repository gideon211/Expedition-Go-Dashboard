import axios from "axios";
import config from "@/config";
import { retryWithBackoff, isRetryableError, handleApiError } from "./errorHandler";

const api = axios.create({
  baseURL: config.api.baseURL,
  timeout: config.api.timeout,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (requestConfig) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log requests in development
    if (config.isDevelopment() && config.monitoring.debugMode) {
      console.log('🌐 API Request:', {
        method: requestConfig.method?.toUpperCase(),
        url: requestConfig.url,
        data: requestConfig.data,
      });
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
    // Log responses in development
    if (config.isDevelopment() && config.monitoring.debugMode) {
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log errors in development
    if (config.isDevelopment()) {
      console.error('❌ API Error:', {
        status: error.response?.status,
        url: originalRequest?.url,
        message: error.message,
        response: error.response?.data,
      });
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Clear auth state but DO NOT redirect automatically.
      // Let the calling component handle the error display so the
      // user can see the failed request in the Network tab.
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      console.error("🔒 401 Unauthorized - Auth token cleared. Please log in again.");
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
          // If all retries failed, handle the error
          handleApiError(retryError);
          return Promise.reject(retryError);
        }
      }
    }

    // Handle other errors
    handleApiError(error);
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
