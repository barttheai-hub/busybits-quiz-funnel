import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [
    { data: columns, error: columnsError },
    { data: cards, error: cardsError },
    { data: notes, error: notesError },
    { data: tasks, error: tasksError },
  ] = await Promise.all([
    supabase
      .from("cb_kanban_columns")
      .select("id,title,position,created_at,updated_at")
      .eq("user_id", session.user.id)
      .order("position", { ascending: true }),
    supabase
      .from("cb_kanban_cards")
      .select("id,column_id,item_type,item_id,position,created_at,updated_at")
      .eq("user_id", session.user.id)
      .order("position", { ascending: true }),
    supabase.from("cb_notes").select("id,title,updated_at").eq("user_id", session.user.id),
    supabase.from("cb_tasks").select("id,title,status,updated_at").eq("user_id", session.user.id),
  ]);

  if (columnsError || cardsError || notesError || tasksError) {
    const message =
      columnsError?.message ?? cardsError?.message ?? notesError?.message ?? tasksError?.message ?? "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({
    columns: columns ?? [],
    cards: cards ?? [],
    notes: notes ?? [],
    tasks: tasks ?? [],
  });
}
