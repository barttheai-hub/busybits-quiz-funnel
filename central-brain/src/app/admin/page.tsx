import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/auth";
import { env } from "@/lib/env";
import AppHeader from "@/app/_components/AppHeader";
import AdminClient from "./AdminClient";
import "../_styles/theme.css";

type Invite = {
  id: string;
  email: string;
  role: string;
  created_at: string;
  accepted_at: string | null;
};

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");
  const email = session.user.email ?? "";
  const isAdmin = isAdminEmail(email);
  if (!isAdmin) redirect("/tasks");

  let invites: Invite[] = [];
  let adminError = "";
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    adminError = "Missing SUPABASE_SERVICE_ROLE_KEY. Admin invites are disabled.";
  } else {
    try {
      const admin = createSupabaseAdminClient();
      const { data } = await admin
        .from("cb_invites")
        .select("id,email,role,created_at,accepted_at")
        .order("created_at", { ascending: false })
        .limit(50);
      invites = (data ?? []) as Invite[];
    } catch {
      adminError = "Unable to load invites.";
    }
  }

  return (
    <div className="cb-shell" style={{ placeItems: "stretch" }}>
      <div className="cb-card">
        <AppHeader title="Central Brain" subtitle="Admin" email={email} isAdmin={isAdmin} />
        <AdminClient invites={invites} adminError={adminError} />
      </div>
    </div>
  );
}
