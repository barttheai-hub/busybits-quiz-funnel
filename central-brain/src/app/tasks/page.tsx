import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function TasksPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Tasks</h1>
      <p>Logged in as {session.user.email}</p>
      <p>MVP: schema + CRUD next.</p>
    </main>
  );
}
