import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth";
import AppHeader from "@/app/_components/AppHeader";
import "../_styles/theme.css";
import SearchClient from "./SearchClient";

export default async function SearchPage({ searchParams }: { searchParams?: { q?: string } }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");
  const email = session.user.email ?? "";
  const isAdmin = isAdminEmail(email);

  const initialQuery = typeof searchParams?.q === "string" ? searchParams.q : "";

  return (
    <div className="cb-shell" style={{ placeItems: "stretch" }}>
      <div className="cb-card">
        <AppHeader title="Central Brain" subtitle="Search" email={email} isAdmin={isAdmin} />

        <div className="cb-card-inner">
          <h1 className="cb-title" style={{ marginBottom: 6 }}>
            Global search
          </h1>
          <p className="cb-subtitle">Search across boards, notes, and tasks.</p>
          <div style={{ height: 18 }} />

          <SearchClient initialQuery={initialQuery} />
        </div>
      </div>
    </div>
  );
}
