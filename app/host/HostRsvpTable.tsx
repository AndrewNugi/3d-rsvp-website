"use client";

import { useMemo, useState } from "react";
import type { Rsvp } from "@/lib/db";
import DeleteRsvpButton from "./DeleteRsvpButton";

export default function HostRsvpTable({ rsvps }: { rsvps: Rsvp[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rsvps;
    return rsvps.filter((r) => r.name.toLowerCase().includes(q));
  }, [rsvps, query]);

  return (
    <>
      <label className="host-search">
        <span className="host-search-icon" aria-hidden="true">⌕</span>
        <input
          type="search"
          placeholder="Search by name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search RSVPs by name"
        />
      </label>

      <table className="host-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Attending</th>
            <th>Submitted</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id}>
              <td data-label="Name">{r.name}</td>
              <td data-label="Attending">
                <span className={`host-status${r.attending ? " yes" : " no"}`}>
                  {r.attending ? "Yes" : "No"}
                </span>
              </td>
              <td data-label="Submitted">{new Date(r.created_at).toLocaleString("en-US")}</td>
              <td className="host-table-actions">
                <DeleteRsvpButton id={r.id} name={r.name} />
              </td>
            </tr>
          ))}
          {rsvps.length === 0 && (
            <tr>
              <td colSpan={4} className="host-empty">
                No RSVPs yet.
              </td>
            </tr>
          )}
          {rsvps.length > 0 && filtered.length === 0 && (
            <tr>
              <td colSpan={4} className="host-empty">
                No RSVPs match &ldquo;{query}&rdquo;.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
