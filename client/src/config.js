// client/src/config.js
export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export const API_AUTH_URL = `${API_BASE}/auth/google`;
