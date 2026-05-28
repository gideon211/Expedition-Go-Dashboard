import { toast } from "sonner";
import api from "@/lib/axios";
import { canAccessSupplierDashboard, getAuthToken } from "@/stores/authStore";

const AUTH_REQUEST_OPTIONS = {
  withCredentials: true,
  skipGlobalErrorHandler: true,
};

async function fetchSupplierProfile(authToken) {
  if (!authToken) {
    return null;
  }

  try {
    const response = await api.get("/suppliers/application/status", {
      skipGlobalErrorHandler: true,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    return response.data?.data?.supplierProfile || null;
  } catch {
    return null;
  }
}

export async function loadSupplierProfile(authToken = getAuthToken()) {
  return fetchSupplierProfile(authToken);
}

function parseAuthResponse(response) {
  const responseData = response.data?.data || response.data;
  return {
    user: responseData?.user || null,
    supplierProfile: responseData?.supplierProfile || null,
    token: responseData?.token || null,
  };
}

/**
 * Toast copy for supplier login outcomes.
 */
export function getSupplierLoginToast(supplierProfile, user) {
  const name = user?.name || user?.email || "there";
  const status = supplierProfile?.status;

  if (canAccessSupplierDashboard(supplierProfile)) {
    if (status === "ACTIVE") {
      return {
        type: "success",
        message: `Welcome back, ${name}! Your supplier account is active.`,
      };
    }

    return {
      type: "success",
      message: `Welcome back, ${name}! Your supplier account has been approved.`,
    };
  }

  if (!supplierProfile) {
    return {
      type: "success",
      message: `Welcome back, ${name}! Signed in successfully.`,
    };
  }

  if (status === "PENDING" || status === "UNDER_REVIEW") {
    return {
      type: "success",
      message: `Welcome back, ${name}! Your supplier application is being reviewed.`,
    };
  }

  if (status === "REJECTED") {
    return {
      type: "warning",
      message: "Signed in, but your supplier application was not approved.",
    };
  }

  if (status === "SUSPENDED") {
    return {
      type: "error",
      message: "Your supplier account is suspended. Please contact support.",
    };
  }

  return {
    type: "success",
    message: `Welcome back, ${name}! Signed in successfully.`,
  };
}

export function showSupplierLoginToast(supplierProfile, user) {
  const { type, message } = getSupplierLoginToast(supplierProfile, user);

  if (type === "success") {
    toast.success(message);
  } else if (type === "warning") {
    toast.warning(message);
  } else if (type === "error") {
    toast.error(message);
  } else {
    toast.info(message);
  }
}

/**
 * Exchange a Firebase ID token for a backend session via POST /users/signup.
 */
export async function exchangeFirebaseToken(idToken) {
  const normalizedToken = typeof idToken === "string" ? idToken.trim() : "";

  if (!normalizedToken) {
    throw new Error("Missing authentication token. Please sign in again.");
  }

  const response = await api.post(
    "/users/signup",
    {},
    {
      ...AUTH_REQUEST_OPTIONS,
      headers: {
        Authorization: `Bearer ${normalizedToken}`,
      },
    }
  );

  const { user, supplierProfile: initialProfile, token } = parseAuthResponse(response);
  const sessionToken = token || normalizedToken;

  // Persist immediately so follow-up requests during login are authenticated.
  localStorage.setItem("auth_token", sessionToken);

  let supplierProfile = initialProfile;
  if (user) {
    const profile = await fetchSupplierProfile(sessionToken);
    if (profile) {
      supplierProfile = profile;
    }
  }

  return { user, supplierProfile, token: sessionToken };
}

/**
 * Map auth/API errors to user-friendly login messages.
 */
export function getLoginErrorMessage(error) {
  if (error?.code === "auth/unauthorized-domain") {
    return "This domain is not authorized for sign-in. Contact support.";
  }

  if (error?.code === "auth/invalid-credential" || error?.code === "auth/wrong-password") {
    return "Invalid email or password.";
  }

  if (error?.code === "auth/user-not-found") {
    return "No account found with this email.";
  }

  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    "Sign in failed. Please try again."
  );
}
