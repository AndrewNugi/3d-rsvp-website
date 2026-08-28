import { cookies } from "next/headers";
import { getAllRsvps } from "@/lib/db";
import { HOST_SESSION_COOKIE, verifySessionToken } from "@/lib/hostAuth";
import HostLoginForm from "./HostLoginForm";

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

  // Only queried once the session cookie has been verified server-side —
  // the list is never sent to the client before the password check passes.
  const rsvps = await getAllRsvps();
  const attendingCount = rsvps.filter((r) => r.attending).length;
  const notAttendingCount = rsvps.length - attendingCount;

  return (
    <main className="host-page">
      <div className="host-card host-card-wide">
        <div className="host-header">
          <div>
            <h1 className="host-heading">RSVPs</h1>
            <p className="host-subheading">
              {attendingCount} attending · {notAttendingCount} not attending · {rsvps.length} total
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

        <table className="host-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Attending</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {rsvps.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>
                  <span className={`host-status${r.attending ? " yes" : " no"}`}>
                    {r.attending ? "Yes" : "No"}
                  </span>
                </td>
                <td>{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {rsvps.length === 0 && (
              <tr>
                <td colSpan={3} className="host-empty">
                  No RSVPs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
