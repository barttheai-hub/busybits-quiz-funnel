"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "../_styles/theme.css";

type Invite = {
  id: string;
  email: string;
  role: string;
  created_at: string;
  accepted_at: string | null;
};

type AdminClientProps = {
  invites: Invite[];
  adminError?: string;
};

export default function AdminClient({ invites, adminError }: AdminClientProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submitInvite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to create invite");
      setEmail("");
      setRole("user");
      setSuccess("Invite created.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invite");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cb-card-inner">
      <div className="cb-grid-2">
        <section style={{ minHeight: 300 }}>
          <h1 className="cb-title" style={{ marginBottom: 6 }}>
            Admin
          </h1>
          <p className="cb-subtitle">Create invites for new users.</p>
          <div style={{ height: 16 }} />

          {adminError ? <div className="cb-error">{adminError}</div> : null}
          {error ? <div className="cb-error">{error}</div> : null}
          {success ? <div className="cb-pill">{success}</div> : null}

          <form onSubmit={submitInvite} className="cb-row">
            <div className="cb-row">
              <div className="cb-label">Invite email</div>
              <input
                className="cb-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="teammate@example.com"
                required
              />
            </div>

            <div className="cb-row">
              <div className="cb-label">Role</div>
              <select className="cb-input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button className="cb-btn cb-btn-primary" type="submit" disabled={busy}>
              {busy ? "Creating…" : "Create invite"}
            </button>
          </form>
        </section>

        <aside>
          <div style={{ fontWeight: 650, marginBottom: 10 }}>Recent invites</div>
          <div style={{ display: "grid", gap: 10 }}>
            {invites.length === 0 ? (
              <div className="cb-subtle">No invites yet.</div>
            ) : (
              invites.map((invite) => {
                const created = new Date(invite.created_at).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                });
                const accepted = invite.accepted_at
                  ? new Date(invite.accepted_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
                  : "Pending";

                return (
                  <div
                    key={invite.id}
                    style={{
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: 14,
                      padding: 12,
                      background: "rgba(255,255,255,0.03)",
                      display: "grid",
                      gap: 6,
                    }}
                  >
                    <div style={{ fontWeight: 650 }}>{invite.email}</div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                      Role: {invite.role} • Created {created}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>Accepted: {accepted}</div>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
