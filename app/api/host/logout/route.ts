import { NextResponse } from "next/server";
import { HOST_SESSION_COOKIE } from "@/lib/hostAuth";

// Plain form-postable endpoint (no client JS required): clears the session
// cookie and redirects back to /host, which will then show the login form.
export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/host", request.url), { status: 303 });
  response.cookies.set(HOST_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
