import { createHash, createHmac, timingSafeEqual } from "crypto";

export const HOST_SESSION_COOKIE = "host_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

function getPassword(): string {
  const password = process.env.HOST_PASSWORD;
  if (!password) {
    throw new Error("HOST_PASSWORD is not set.");
  }
  return password;
}

function sha256(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

function sign(payload: string): string {
  return createHmac("sha256", getPassword()).update(payload).digest("hex");
}

// Fixed-length digests on both sides, compared with timingSafeEqual, so the
// check doesn't leak how much of the submitted password matched.
export function verifyPassword(candidate: string): boolean {
  const expected = sha256(getPassword());
  const actual = sha256(candidate);
  return timingSafeEqual(expected, actual);
}

export function createSessionToken(): string {
  const expires = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = String(expires);
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot === -1) return false;

  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  let sigBuf: Buffer;
  let expectedBuf: Buffer;
  try {
    sigBuf = Buffer.from(sig, "hex");
    expectedBuf = Buffer.from(sign(payload), "hex");
  } catch {
    return false;
  }
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return false;
  }

  const expires = Number(payload);
  return Number.isFinite(expires) && Date.now() <= expires;
}

export const HOST_SESSION_MAX_AGE = SESSION_TTL_SECONDS;
