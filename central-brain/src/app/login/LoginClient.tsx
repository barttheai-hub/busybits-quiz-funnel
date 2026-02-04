"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import "../_styles/theme.css";

type Step = "email" | "code";

function normalizeToken(raw: string) {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  // allow pasting the full magic-link URL too
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  // digits only
  return s.replace(/\D/g, "");
}

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>(() => (searchParams.get("step") === "code" ? "code" : "email"));
  const [email, setEmail] = useState<string>(() => searchParams.get("email") ?? "");
  const [code, setCode] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");

  const maskedEmail = useMemo(() => {
    const e = email.trim();
    if (!e.includes("@")) return e;
    const [u, d] = e.split("@");
    return `${u.slice(0, 2)}***@${d}`;
  }, [email]);

  async function requestCode() {
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || data.error) throw new Error(data.error ?? "Failed to send code");
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      await requestCode();
      setCode("");
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setBusy(false);
    }
  }

  async function resendCode() {
    setBusy(true);
    setError("");

    try {
      await requestCode();
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, token: code }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Invalid code");

      router.push("/tasks");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cb-shell">
      <div className="cb-card">
        <div className="cb-card-inner">
          <div className="cb-split">
            <section>
              <h1 className="cb-title">Central Brain</h1>
              <p className="cb-subtitle">Secure login via email code (or magic link).</p>

              <div style={{ height: 16 }} />

              {error ? <div className="cb-error">{error}</div> : null}

              {step === "email" ? (
                <form onSubmit={sendCode} className="cb-row">
                  <div className="cb-row">
                    <div className="cb-label">Email</div>
                    <input
                      className="cb-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      required
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </div>

                  <button className="cb-btn cb-btn-primary" disabled={busy} type="submit">
                    {busy ? "Sending…" : "Send code"}
                  </button>

                  <div style={{ fontSize: 12, opacity: 0.72, lineHeight: 1.4 }}>
                    Only whitelisted emails can sign in.
                  </div>
                </form>
              ) : (
                <form onSubmit={verifyCode} className="cb-row">
                  <div className="cb-pill">Code sent to {maskedEmail || "your email"}</div>

                  <div className="cb-row">
                    <div className="cb-label">Login code (8 digits) or paste the magic-link URL</div>
                    <input
                      className="cb-input"
                      value={code}
                      onChange={(e) => setCode(normalizeToken(e.target.value))}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="25853480"
                      required
                    />
                    <div style={{ fontSize: 12, opacity: 0.72, lineHeight: 1.4 }}>
                      Tip: if codes keep failing, paste the full “Log In” link from the email.
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <button
                      className="cb-btn cb-btn-secondary"
                      type="button"
                      onClick={() => {
                        setCode("");
                        setStep("email");
                      }}
                      disabled={busy}
                    >
                      Change email
                    </button>
                    <button className="cb-btn cb-btn-primary" disabled={busy} type="submit">
                      {busy ? "Verifying…" : "Verify"}
                    </button>
                  </div>

                  <button
                    className="cb-btn cb-btn-secondary"
                    type="button"
                    onClick={resendCode}
                    disabled={busy || !email.trim()}
                    title="Resend code"
                  >
                    Resend code
                  </button>
                </form>
              )}
            </section>

            <aside>
              <div className="cb-pill">Bold / Stripe-ish / Dark</div>
              <div style={{ height: 14 }} />
              <div style={{ opacity: 0.8, fontSize: 13, lineHeight: 1.55 }}>
                <div style={{ fontWeight: 650, opacity: 0.95 }}>What you get</div>
                <ul style={{ margin: "10px 0 0", paddingLeft: 18 }}>
                  <li>OTP email login (codes or magic-link fallback)</li>
                  <li>Cookie session for server-rendered routes</li>
                  <li>Simple, clean dashboard shell</li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
