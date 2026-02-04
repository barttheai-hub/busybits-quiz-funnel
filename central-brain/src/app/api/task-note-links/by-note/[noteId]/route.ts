import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: NextRequest, context: { params: Promise<{ noteId: string }> }) {
  const { noteId } = await context.params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!UUID_RE.test(noteId)) return NextResponse.json({ error: "noteId must be a valid UUID" }, { status: 400 });

  const { data, error } = await supabase
    .from("cb_task_note_links")
    .select("task_id, cb_tasks!inner(id,title,status)")
    .eq("user_id", session.user.id)
    .eq("note_id", noteId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  type Row = { task_id: string; cb_tasks?: Array<{ id: string; title: string; status: string }> };
  const tasks = ((data as unknown) as Row[] | null | undefined ?? []).map((row) => {
    const t = row.cb_tasks?.[0];
    return {
      id: t?.id ?? row.task_id,
      title: t?.title ?? "",
      status: t?.status ?? null,
    };
  });

  return NextResponse.json({ tasks });
}
