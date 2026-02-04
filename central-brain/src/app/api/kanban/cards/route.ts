import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = new Set(["note", "task"]);

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { column_id?: string; item_type?: string; item_id?: string } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    // ignore
  }

  const columnId = String(body.column_id ?? "").trim();
  const itemType = String(body.item_type ?? "").trim();
  const itemId = String(body.item_id ?? "").trim();

  if (!columnId || !itemType || !itemId) {
    return NextResponse.json({ error: "Column, item type, and item id are required" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(itemType)) {
    return NextResponse.json({ error: "Invalid item type" }, { status: 400 });
  }

  const { data: column, error: columnError } = await supabase
    .from("cb_kanban_columns")
    .select("id")
    .eq("id", columnId)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (columnError) return NextResponse.json({ error: columnError.message }, { status: 400 });
  if (!column) {
    return NextResponse.json({ error: "Column not found" }, { status: 404 });
  }

  if (itemType === "note") {
    const { data: note, error: noteError } = await supabase
      .from("cb_notes")
      .select("id")
      .eq("id", itemId)
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (noteError) return NextResponse.json({ error: noteError.message }, { status: 400 });
    if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  if (itemType === "task") {
    const { data: task, error: taskError } = await supabase
      .from("cb_tasks")
      .select("id")
      .eq("id", itemId)
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (taskError) return NextResponse.json({ error: taskError.message }, { status: 400 });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const { data: last } = await supabase
    .from("cb_kanban_cards")
    .select("position")
    .eq("user_id", session.user.id)
    .eq("column_id", columnId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = (last?.position ?? 0) + 1;

  const { data, error } = await supabase
    .from("cb_kanban_cards")
    .insert({
      user_id: session.user.id,
      column_id: columnId,
      item_type: itemType,
      item_id: itemId,
      position,
    })
    .select("id,column_id,item_type,item_id,position,created_at,updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ card: data });
}
