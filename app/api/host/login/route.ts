import { NextResponse } from "next/server";
import {
  createSessionToken,
  HOST_SESSION_COOKIE,
  HOST_SESSION_MAX_AGE,
  verifyPassword,
} from "@/lib/hostAuth";

// Every failure path — malformed body, wrong password, HOST_PASSWORD not
// configured — returns the exact same generic response, so nothing here
// confirms or denies specifics about why access was refused.
const ACCESS_DENIED = () => NextResponse.json({ error: "Access denied." }, { status: 401 });

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const password = (body as { password?: unknown } | null)?.password;

    if (typeof password !== "string" || !verifyPassword(password)) {
      return ACCESS_DENIED();
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(HOST_SESSION_COOKIE, createSessionToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: HOST_SESSION_MAX_AGE,
    });
    return response;
  } catch {
    return ACCESS_DENIED();
  }
}
