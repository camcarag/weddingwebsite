import crypto from "node:crypto";

export const SITE_AUTH_COOKIE = "site_auth";
export const SITE_AUTH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const AUTH_PAYLOAD = "authenticated";

// Missing env vars fail closed (treated as "not authenticated", so visitors
// land on /login) rather than throwing — proxy.ts runs on every request, so
// an uncaught error here would 500 the entire site instead of just gating it.
function getSecret(): string | null {
  const secret = process.env.SITE_AUTH_SECRET;
  if (!secret) {
    console.error("SITE_AUTH_SECRET is not set — the site password gate cannot work without it.");
    return null;
  }
  return secret;
}

function sign(value: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

// A signed token rather than a plain "true" value, so the cookie can't be
// forged by just setting site_auth=true in devtools.
export function createSiteAuthToken(): string {
  const secret = getSecret();
  if (!secret) return "";
  return `${AUTH_PAYLOAD}.${sign(AUTH_PAYLOAD, secret)}`;
}

export function isValidSiteAuthToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const secret = getSecret();
  if (!secret) return false;
  const [payload, signature] = token.split(".");
  if (payload !== AUTH_PAYLOAD || !signature) return false;
  const expected = sign(payload, secret);
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function isCorrectSitePassword(candidate: string): boolean {
  const expected = process.env.SITE_PASSWORD;
  if (!expected) {
    console.error("SITE_PASSWORD is not set — no password will be accepted.");
    return false;
  }
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
