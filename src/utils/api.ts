// API base URL. Set VITE_API_BASE / VITE_WS_BASE at build time (Vercel env vars)
// to point to the deployed backend (e.g. https://<railway-app>.up.railway.app).
// Falls back to the local FastAPI dev server when not set.
const DEV_API_BASE = `http://${window.location.hostname}:8000/api/v1`;
const DEV_WS_BASE = `ws://${window.location.hostname}:8000`;

export const API_BASE: string = (import.meta.env.VITE_API_BASE as string | undefined) ?? DEV_API_BASE;
const WS_BASE: string = (import.meta.env.VITE_WS_BASE as string | undefined) ?? DEV_WS_BASE;

export function getAuthToken(): string | null {
  return localStorage.getItem("filz_token");
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem("filz_token", token);
  } else {
    localStorage.removeItem("filz_token");
  }
}

export function getRefreshToken(): string | null {
  return localStorage.getItem("filz_refresh_token");
}

export function setRefreshToken(token: string | null) {
  if (token) {
    localStorage.setItem("filz_refresh_token", token);
  } else {
    localStorage.removeItem("filz_refresh_token");
  }
}

export function clearSession() {
  setAuthToken(null);
  setRefreshToken(null);
  setUserRole(null);
  setOrgId(null);
}

export function getPartnerToken(): string | null {
  return localStorage.getItem("filz_partner_token");
}

export function setPartnerToken(token: string | null) {
  if (token) {
    localStorage.setItem("filz_partner_token", token);
  } else {
    localStorage.removeItem("filz_partner_token");
  }
}

export function getPartnerRefreshToken(): string | null {
  return localStorage.getItem("filz_partner_refresh_token");
}

export function setPartnerRefreshToken(token: string | null) {
  if (token) {
    localStorage.setItem("filz_partner_refresh_token", token);
  } else {
    localStorage.removeItem("filz_partner_refresh_token");
  }
}

export function setPartnerInfo(info: Record<string, unknown> | null) {
  if (info) {
    localStorage.setItem("filz_partner_info", JSON.stringify(info));
  } else {
    localStorage.removeItem("filz_partner_info");
  }
}

export function getPartnerInfo(): Record<string, unknown> | null {
  const raw = localStorage.getItem("filz_partner_info");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getUserRole(): string | null {
  return localStorage.getItem("filz_role");
}

export function setUserRole(role: string | null) {
  if (role) {
    localStorage.setItem("filz_role", role);
  } else {
    localStorage.removeItem("filz_role");
  }
}

export function getOrgId(): string | null {
  return localStorage.getItem("filz_org_id");
}

export function setOrgId(orgId: string | null) {
  if (orgId) {
    localStorage.setItem("filz_org_id", orgId);
  } else {
    localStorage.removeItem("filz_org_id");
  }
}

export function getOrgSlug(): string | null {
  return localStorage.getItem("filz_org_slug");
}

export function setOrgSlug(slug: string | null) {
  if (slug) {
    localStorage.setItem("filz_org_slug", slug);
  } else {
    localStorage.removeItem("filz_org_slug");
  }
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setAuthToken(data.access_token);
    if (data.refresh_token) setRefreshToken(data.refresh_token);
    const payload = decodeJwt(data.access_token);
    if (payload) {
      if (payload.role) setUserRole(payload.role);
      if (payload.organization_id) setOrgId(payload.organization_id);
    }
    return true;
  } catch {
    return false;
  }
}

async function refreshPartnerAccessToken(): Promise<boolean> {
  const refreshToken = getPartnerRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE}/partners/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setPartnerToken(data.access_token);
    if (data.refresh_token) setPartnerRefreshToken(data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

let refreshPromise: Promise<boolean> | null = null;
let partnerRefreshPromise: Promise<boolean> | null = null;

// Refreshes the access token when it is about to expire (< 60s left).
async function ensureFreshAccessToken(): Promise<void> {
  const token = getAuthToken();
  if (!token) return;
  const exp = jwtExpiry(token);
  if (exp !== null && exp > Date.now() + 60_000) return;
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  await refreshPromise;
}

async function ensureFreshPartnerToken(): Promise<void> {
  const token = getPartnerToken();
  if (!token) return;
  const exp = jwtExpiry(token);
  if (exp !== null && exp > Date.now() + 60_000) return;
  if (!partnerRefreshPromise) {
    partnerRefreshPromise = refreshPartnerAccessToken().finally(() => {
      partnerRefreshPromise = null;
    });
  }
  await partnerRefreshPromise;
}

function decodeJwt(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function jwtExpiry(token: string): number | null {
  const payload = decodeJwt(token);
  return payload?.exp ? payload.exp * 1000 : null;
}

async function request(method: string, path: string, body?: any, _retried = false) {
  const isPartnerRoute = path.startsWith("/partners") && !path.startsWith("/partners/apply") && !path.startsWith("/partners/login") && !path.startsWith("/partners/refresh");
  if (isPartnerRoute) {
    await ensureFreshPartnerToken();
  } else {
    await ensureFreshAccessToken();
  }
  const token = isPartnerRoute ? getPartnerToken() : getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    const url = `${API_BASE}${path}`;
    console.log(`API Request: ${method} ${url}`);
    response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err: any) {
    console.error('API Error:', err);
    const name = err?.name || ((err?.message || "").includes("Network") ? "NetworkError" : "FetchError");
    const msg =
      name === "NetworkError"
        ? `NetworkError: impossible d’atteindre l’API sur ${API_BASE}. Vérifiez que le serveur FastAPI est bien lancé (port 8000) et qu’il n’y a pas de blocage HTTPS/HTTP.`
        : (err?.message || "Erreur réseau lors de la requête.");
    throw new Error(msg);
  }

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      if (isPartnerRoute) {
        if (!_retried) {
          const ok = await refreshPartnerAccessToken();
          if (ok) {
            return request(method, path, body, true);
          }
        }
        setPartnerToken(null);
        setPartnerRefreshToken(null);
        setPartnerInfo(null);
      } else if (!_retried && getRefreshToken()) {
        const ok = await refreshAccessToken();
        if (ok) {
          return request(method, path, body, true);
        }
        clearSession();
      } else {
        clearSession();
      }
    }
    let detail: string | undefined;
    try {
      const errData = await response.json();
      detail = errData?.detail;
    } catch {
      // ignore
    }
    const errorMessage = detail || `Erreur ${response.status}`;
    if (response.status === 403) {
      throw new Error(errorMessage);
    }
    if (response.status === 404) {
      throw new Error(errorMessage);
    }
    if (response.status >= 500) {
      throw new Error(errorMessage);
    }
    throw new Error(errorMessage);
  }

  return response.json();
}


export const api = {
  get: (path: string) => request("GET", path),
  post: (path: string, body?: any) => request("POST", path, body),
  patch: (path: string, body?: any) => request("PATCH", path, body),
  delete: (path: string) => request("DELETE", path),
  getWsUrl: (queueId: string, params?: Record<string, string>) => {
    const url = `${WS_BASE}/ws/queue/${queueId}`;
    if (!params) return url;
    const qs = new URLSearchParams(params).toString();
    return qs ? `${url}?${qs}` : url;
  },
};
