"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { markHostSessionActive } from "./HostSessionGuard";

export default function HostLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/host/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError("Access denied.");
        setSubmitting(false);
        return;
      }

      // Marks this tab as having logged in, so HostSessionGuard doesn't
      // immediately log it back out on the very render this produces.
      markHostSessionActive();

      // Re-renders the server component with the now-valid session cookie.
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <form className="host-login-form" onSubmit={handleSubmit}>
      <label className="host-login-field">
        <span className="host-login-label">Password</span>
        <input
          type="password"
          className="host-login-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          required
        />
      </label>

      {error && <p className="host-login-error">{error}</p>}

      <button type="submit" className="host-login-submit" disabled={submitting || !password}>
        {submitting ? "Checking…" : "Unlock"}
      </button>
    </form>
  );
}
