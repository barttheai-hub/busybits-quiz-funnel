import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = req.nextUrl.searchParams.get("q") ?? "";
  const q = raw.trim();

  if (!q) return NextResponse.json({ notes: [], tasks: [], boards: [] });

  const pattern = `%${q}%`;

  const [notesRes, tasksRes, boardsRes] = await Promise.all([
    supabase
      .from("cb_notes")
      .select("id,title,body,updated_at")
      .eq("user_id", session.user.id)
      .or(`title.ilike.${pattern},body.ilike.${pattern}`)
      .order("updated_at", { ascending: false })
      .limit(50),
    supabase
      .from("cb_tasks")
      .select(
        "id,title,notes,status,priority,due_at,assignee,recurrence_rule,recurrence_interval,updated_at,board_id,column_id,board:cb_boards(title),column:cb_board_columns(title)"
      )
      .eq("user_id", session.user.id)
      .or(`title.ilike.${pattern},notes.ilike.${pattern}`)
      .order("updated_at", { ascending: false })
      .limit(50),
    supabase
      .from("cb_boards")
      .select("id,title,is_default,updated_at")
      .eq("user_id", session.user.id)
      .ilike("title", pattern)
      .order("updated_at", { ascending: false })
      .limit(25),
  ]);

  if (notesRes.error || tasksRes.error || boardsRes.error) {
    return NextResponse.json(
      { error: notesRes.error?.message ?? tasksRes.error?.message ?? boardsRes.error?.message },
      { status: 400 }
    );
  }

  return NextResponse.json({
    notes: notesRes.data ?? [],
    tasks: tasksRes.data ?? [],
    boards: boardsRes.data ?? [],
  });
}
