import { getKeycloak } from "./login";

const API_BASE = `${window.location.origin}/api`;

export async function apiPost(path, body) {
  const kc = getKeycloak();
  if (kc && kc.authenticated) {
    try {
      await kc.updateToken(30);
    } catch (err) {
      console.warn("Token refresh failed:", err);
    }
  }

  const headers = { "Content-Type": "application/json" };
  if (kc && kc.token) {
    headers["Authorization"] = `Bearer ${kc.token}`;
    headers["X-Refresh-Token"] = kc.refreshToken;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const raw = await res.text();
    let detail = raw;
    try {
      const body = JSON.parse(raw);
      if (body && body.detail) detail = body.detail;
    } catch {
      // raw wasn't JSON; keep as-is
    }
    const err = new Error(detail || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  if (res.status === 202) return { accepted: true };
  try {
    return await res.json();
  } catch {
    return null;
  }
}
