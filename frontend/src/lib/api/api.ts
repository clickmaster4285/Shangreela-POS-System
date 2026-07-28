const TOKEN_KEY = "shirazre_token";

const rawApiBase = String(import.meta.env.VITE_API_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "");

/** From `frontend/.env` — `VITE_API_BASE_URL`. */
export const API_BASE =
  rawApiBase || (import.meta.env.DEV ? "http://localhost:5000/api" : "");

/** Backend origin without `/api` — uploads, Socket.IO. */
export function getBackendOrigin(): string {
  return API_BASE.replace(/\/api\/?$/i, "");
}

/** Turn `/uploads/...` (or any relative path) into an absolute backend URL. */
export function resolveUploadUrl(path?: string): string {
  if (!path) return "";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:") ||
    path.startsWith("data:")
  ) {
    return path;
  }
  return `${getBackendOrigin()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (!token) localStorage.removeItem(TOKEN_KEY);
  else localStorage.setItem(TOKEN_KEY, token);
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  const isFormData = options.body instanceof FormData;
  if (!isFormData && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new Error("Cannot reach API. Check that the backend is running.");
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 502 || response.status === 503 || response.status === 504) {
      throw new Error("API gateway error. Restart the backend service and try again.");
    }
    throw new Error(body?.message || "Request failed");
  }
  return body as T;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
