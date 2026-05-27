import api from "@/lib/axios";

async function fetchSupplierProfile() {
  try {
    const response = await api.get("/suppliers/application/status");
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
 * Exchange a Firebase ID token for a backend session.
 *
 * Production currently exposes POST /users/signup (Bearer token).
 * POST /auth/verify-token is used when available (newer backend builds).
 */
export async function exchangeFirebaseToken(idToken) {
  let response;

  try {
    response = await api.post(
      "/auth/verify-token",
      { token: idToken },
      { withCredentials: true }
    );
  } catch (error) {
    const isMissingRoute =
      error.response?.status === 404 &&
      error.response?.data?.message?.includes("verify-token");

    if (!isMissingRoute) {
      throw error;
    }

    response = await api.post(
      "/users/signup",
      {},
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      }
    );
  }

  const { user, supplierProfile, token } = parseAuthResponse(response);

  if (user && !supplierProfile) {
    const profile = await fetchSupplierProfile();
    return { user, supplierProfile: profile, token: token || idToken };
  }

  return { user, supplierProfile, token: token || idToken };
}
