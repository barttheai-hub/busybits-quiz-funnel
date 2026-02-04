import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth";
import AppHeader from "@/app/_components/AppHeader";
import "../_styles/theme.css";
import NotesClient, { type Note } from "./NotesClient";

export default async function NotesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");
  const email = session.user.email ?? "";
  const isAdmin = isAdminEmail(email);

  const { data: notes } = await supabase
    .from("cb_notes")
    .select("id,title,body,created_at,updated_at")
    .eq("user_id", session.user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="cb-shell" style={{ placeItems: "stretch" }}>
      <div className="cb-card">
        <AppHeader title="Central Brain" subtitle="Notes" email={email} isAdmin={isAdmin} />

        <div className="cb-card-inner">
          <h1 className="cb-title" style={{ marginBottom: 6 }}>
            Notes
          </h1>
          <p className="cb-subtitle">Keyboard: N to create, / to search, ⌘/Ctrl+Enter to save.</p>
          <div style={{ height: 18 }} />

          <NotesClient initialNotes={(notes ?? []) as Note[]} />
        </div>
      </div>
    </div>
  );
}
