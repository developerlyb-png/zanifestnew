import axios from "axios";

// ICICI Lombard — Health (Elevate Fresh) API shared helpers.
//
// Confirmed against real UAT credentials (2026-09-14):
//   - Token endpoint is /auth-api/v2/token, NOT /auth-api/access/token as
//     ICICI's own PDF kit documents (stale in the doc).
//   - The password IL gave us is already AES-encrypted on their end — it's
//     sent to the token endpoint exactly as configured, no encryption step
//     needed on our side.
//   - The token response carries no "encKey" (RSA public key) despite the
//     PDF describing one "for API Request Encryption" — live Premium calls
//     with a plain, unencrypted JSON body + Bearer token succeeded, so this
//     integration needs no request/response encryption at all (unlike SBI's
//     AES-GCM-encrypted-envelope pattern elsewhere in this codebase).
//   - Every endpoint under health-fresh/health-servicing/CKYC carries a
//     client-specific path segment (ICICI_HEALTH_CLIENT_SLUG, "zanifestins"
//     for our login) between the module path and the action — e.g.
//     /health-fresh/elevate/zanifestins/premium. The PDF's "{api point}"
//     placeholder and its literal "generic" segments both actually resolve
//     to this per-client slug in the real environment.

interface CachedToken {
  token: string;
  expiresAt: number; // epoch ms
}

let cachedToken: CachedToken | null = null;

export function iciciHealthBaseUrl(): string {
  const env = (process.env.ICICI_HEALTH_ENV || "uat").toLowerCase();
  const url = env === "prod" ? process.env.ICICI_HEALTH_PROD_URL : process.env.ICICI_HEALTH_UAT_URL;
  if (!url) throw new Error(`ICICI_HEALTH_${env.toUpperCase()}_URL is not configured`);
  return url;
}

/** The client-specific path segment IL assigned us — required in every
 * health-fresh / health-servicing / CKYC endpoint path. */
export function iciciClientSlug(): string {
  const slug = process.env.ICICI_HEALTH_CLIENT_SLUG;
  if (!slug) throw new Error("ICICI_HEALTH_CLIENT_SLUG is not configured");
  return slug;
}

// The token endpoint is rate-limited to 10 calls/minute and the token itself
// is valid ~15-20 minutes (per IL's docs, confirmed by a live ~20-minute
// expiry) — every route shares this one cached token instead of fetching a
// fresh one per request. Refreshed a little before actual expiry so a
// request never lands right as it lapses.
const REFRESH_SKEW_MS = 60_000;

export async function getIciciHealthToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt - REFRESH_SKEW_MS > Date.now()) {
    return cachedToken.token;
  }

  const login = process.env.ICICI_HEALTH_LOGIN;
  const password = process.env.ICICI_HEALTH_PASSWORD;
  if (!login || !password) {
    throw new Error("ICICI_HEALTH_LOGIN / ICICI_HEALTH_PASSWORD are not configured");
  }

  const res = await axios.post(
    `${iciciHealthBaseUrl()}/auth-api/v2/token`,
    { Login: login, Password: password },
    { headers: { "Content-Type": "application/json" } }
  );

  const data = res.data;
  if (!data?.success || !data?.token) {
    throw new Error(`ICICI token request failed: ${data?.errorMessage || "unknown error"}`);
  }

  cachedToken = {
    token: data.token,
    expiresAt: new Date(data.expiry).getTime(),
  };
  return cachedToken.token;
}

/**
 * Authenticated call against the ICICI health-fresh/health-servicing/CKYC
 * API. `path` is everything after the base URL, e.g.
 * `/health-fresh/elevate/${iciciClientSlug()}/premium`.
 */
export async function iciciHealthRequest<T = any>(
  path: string,
  body?: any,
  method: "POST" | "GET" = "POST"
): Promise<T> {
  const token = await getIciciHealthToken();
  const res = await axios.request<T>({
    url: `${iciciHealthBaseUrl()}${path}`,
    method,
    data: method === "POST" ? body : undefined,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
}
