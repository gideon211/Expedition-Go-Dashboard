import { toast } from "sonner";
import api from "@/lib/axios";
import { canAccessSupplierDashboard } from "@/stores/authStore";

const AUTH_REQUEST_OPTIONS = {
  withCredentials: true,
  skipGlobalErrorHandler: true,
};

async function fetchSupplierProfile() {
  try {
    const response = await api.get("/suppliers/application/status", {
      skipGlobalErrorHandler: true,
    });
    return response.data?.data?.supplierProfile || null;
  } catch {
    return null;
  }
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
      type: "info",
      message: "Signed in successfully. Apply to become a supplier to access the dashboard.",
    };
  }

  if (status === "PENDING" || status === "UNDER_REVIEW") {
    return {
      type: "info",
      message: "Signed in. Your supplier application is still being reviewed by our team.",
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
    type: "info",
    message: `Signed in as ${name}. Supplier dashboard access is not available yet.`,
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
  const response = await api.post(
    "/users/signup",
    {},
    {
      ...AUTH_REQUEST_OPTIONS,
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    }
  );

  const { user, supplierProfile, token } = parseAuthResponse(response);

  if (user && !supplierProfile) {
    const profile = await fetchSupplierProfile();
    return { user, supplierProfile: profile, token: token || idToken };
  }

  return { user, supplierProfile, token: token || idToken };
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
