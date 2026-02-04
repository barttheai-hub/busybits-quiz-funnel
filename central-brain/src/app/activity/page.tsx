import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth";
import AppHeader from "@/app/_components/AppHeader";
import "../_styles/theme.css";

type ActivityEntry = {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function formatMetadata(metadata: ActivityEntry["metadata"]) {
  if (!metadata || typeof metadata !== "object") return "";
  const parts = Object.entries(metadata)
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "")
    .map(([key, value]) => `${key}: ${String(value)}`);
  return parts.join(" • ");
}

export default async function ActivityPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");
  const email = session.user.email ?? "";
  const isAdmin = isAdminEmail(email);

  const { data } = await supabase
    .from("cb_activity_log")
    .select("id,entity_type,entity_id,action,metadata,created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const entries = (data ?? []) as ActivityEntry[];

  return (
    <div className="cb-shell" style={{ placeItems: "stretch" }}>
      <div className="cb-card">
        <AppHeader title="Central Brain" subtitle="Activity" email={email} isAdmin={isAdmin} />

        <div className="cb-card-inner">
          <h1 className="cb-title" style={{ marginBottom: 6 }}>
            Activity log
          </h1>
          <p className="cb-subtitle">Latest 50 changes across boards, tasks, and notes.</p>
          <div style={{ height: 18 }} />

          {entries.length === 0 ? (
            <div className="cb-subtle">No activity yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {entries.map((entry) => {
                const meta = formatMetadata(entry.metadata);
                const timestamp = new Date(entry.created_at).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                });

                return (
                  <div
                    key={entry.id}
                    style={{
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: 14,
                      padding: "12px 14px",
                      background: "rgba(255,255,255,0.03)",
                      display: "grid",
                      gap: 6,
                    }}
                  >
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                      <span style={{ fontWeight: 650, textTransform: "capitalize" }}>{entry.action}</span>
                      <span style={{ opacity: 0.7, fontSize: 12 }}>
                        {entry.entity_type} • {entry.entity_id}
                      </span>
                    </div>
                    {meta ? <div style={{ fontSize: 12, opacity: 0.8 }}>{meta}</div> : null}
                    <div style={{ fontSize: 11, opacity: 0.6 }}>{timestamp}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
