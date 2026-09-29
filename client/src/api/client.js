import axios from "axios";

const baseURL = import.meta.env?.VITE_API_URL || "/api";

export const api = axios.create({
  baseURL,
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("agrilink_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear token + redirect to /login (unless already there)
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      const token = localStorage.getItem("agrilink_token");
      if (token) {
        localStorage.removeItem("agrilink_token");
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login?expired=1";
        }
      }
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(err, fallback = "Something went wrong") {
  const msg = err?.response?.data?.error || err?.response?.data?.message;
  if (typeof msg === "string" && msg.trim()) return msg;
  if (err?.response?.data?.fields) {
    return err.response.data.fields.map((f) => f.message).join(", ");
  }
  return fallback;
}
