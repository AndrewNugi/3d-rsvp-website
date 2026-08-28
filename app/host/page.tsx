import { cookies } from "next/headers";
import { getAllRsvps } from "@/lib/db";
import { HOST_SESSION_COOKIE, verifySessionToken } from "@/lib/hostAuth";
import HostLoginForm from "./HostLoginForm";
import HostRsvpTable from "./HostRsvpTable";
import HostSessionGuard from "./HostSessionGuard";

// Never statically cache this page — it gates on a cookie and shows live data.
export const dynamic = "force-dynamic";

export default async function HostPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(HOST_SESSION_COOKIE)?.value;
  const authenticated = verifySessionToken(token);

  if (!authenticated) {
    return (
      <main className="host-page">
        <div className="host-card">
          <h1 className="host-heading">Host Access</h1>
          <p className="host-subheading">Enter the password to view RSVPs.</p>
          <HostLoginForm />
        </div>
      </main>
    );
  }

  // Only queried once the session cookie has been verified server-side.
  // Note: the cookie alone isn't the full story here — HostSessionGuard
  // below additionally requires a per-tab sessionStorage flag, so a cookie
  // that survived from a closed tab still causes a brief flash of this
  // list before the guard clears it and re-renders the login gate.
  const rsvps = await getAllRsvps();
  const attendingCount = rsvps.filter((r) => r.attending).length;
  const notAttendingCount = rsvps.length - attendingCount;

  return (
    <main className="host-page">
      <HostSessionGuard />
      <div className="host-card host-card-wide">
        <div className="host-header">
          <div>
            <h1 className="host-heading">RSVPs</h1>
            <p className="host-subheading">
              {attendingCount} Attending · {notAttendingCount} Not Attending · {rsvps.length} Total
            </p>
          </div>
          <div className="host-actions">
            <a className="host-pdf-link" href="/api/host/pdf">
              Download as PDF
            </a>
            <form action="/api/host/logout" method="post">
              <button type="submit" className="host-logout">
                Log out
              </button>
            </form>
          </div>
        </div>

        <HostRsvpTable rsvps={rsvps} />
      </div>
    </main>
  );
}
