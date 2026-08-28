"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// sessionStorage is scoped to this browsing-context tab and is gone the
// moment the tab closes — a fresh or reopened tab never sees it, even
// though the httpOnly cookie (a browser-level session cookie) can still be
// valid at that point. This flag is how we tell those two cases apart.
const HOST_SESSION_FLAG = "host_authed";

export function markHostSessionActive() {
  sessionStorage.setItem(HOST_SESSION_FLAG, "1");
}

export default function HostSessionGuard() {
  const router = useRouter();

  useEffect(() => {
    if (sessionStorage.getItem(HOST_SESSION_FLAG) === "1") return;

    // This tab never logged in — the cookie surviving from a previous tab
    // shouldn't count here. Clear it server-side and re-render the gate.
    fetch("/api/host/logout", { method: "POST" }).finally(() => {
      router.refresh();
    });
  }, [router]);

  return null;
}
