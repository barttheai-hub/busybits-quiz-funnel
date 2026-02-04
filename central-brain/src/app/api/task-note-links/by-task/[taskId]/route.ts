import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: NextRequest, context: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await context.params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!UUID_RE.test(taskId)) return NextResponse.json({ error: "taskId must be a valid UUID" }, { status: 400 });

  const { data, error } = await supabase
    .from("cb_task_note_links")
    .select("note_id, cb_notes!inner(id,title)")
    .eq("user_id", session.user.id)
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  type Row = { note_id: string; cb_notes?: Array<{ id: string; title: string }> };
  const notes = ((data as unknown) as Row[] | null | undefined ?? []).map((row) => {
    const n = row.cb_notes?.[0];
    return {
      id: n?.id ?? row.note_id,
      title: n?.title ?? "",
    };
  });

  return NextResponse.json({ notes });
}
