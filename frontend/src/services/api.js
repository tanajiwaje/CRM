import { getToken, clearSession } from "./auth";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

async function api(path, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const baseHeaders = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  if (!isFormData && !baseHeaders["Content-Type"]) {
    baseHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: baseHeaders,
    ...options,
  });

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    const message = data?.error || `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    if (response.status === 401) {
      clearSession();
    }
    throw error;
  }

  return data;
}

export { api, API_BASE_URL };
