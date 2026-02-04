import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-log";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { title?: string; position?: number } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    // ignore
  }

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) {
    const title = String(body.title ?? "").trim();
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    updates.title = title;
  }
  if (body.position !== undefined) {
    const position = Number(body.position);
    if (!Number.isInteger(position) || position < 1) {
      return NextResponse.json({ error: "Invalid position" }, { status: 400 });
    }
    updates.position = position;
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("cb_board_columns")
    .update(updates)
    .eq("id", id)
    .eq("user_id", session.user.id)
    .select("id,title,position,board_id,created_at,updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logActivity(supabase, {
    userId: session.user.id,
    entityType: "board_column",
    entityId: data.id,
    action: "update",
    metadata: { title: data.title, board_id: data.board_id },
  });

  return NextResponse.json({ column: data });
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: existing } = await supabase
    .from("cb_board_columns")
    .select("id,title,board_id")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .maybeSingle();

  const { error } = await supabase.from("cb_board_columns").delete().eq("id", id).eq("user_id", session.user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logActivity(supabase, {
    userId: session.user.id,
    entityType: "board_column",
    entityId: id,
    action: "delete",
    metadata: { title: existing?.title ?? null, board_id: existing?.board_id ?? null },
  });

  return NextResponse.json({ ok: true });
}
