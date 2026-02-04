import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { column_id?: string } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    // ignore
  }

  const { data: existing, error: existingError } = await supabase
    .from("cb_kanban_cards")
    .select("id,column_id,position,item_type,item_id")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 400 });
  if (!existing) return NextResponse.json({ error: "Card not found" }, { status: 404 });

  const updates: Record<string, unknown> = {};

  if (body.column_id && body.column_id !== existing.column_id) {
    const { data: target, error: targetError } = await supabase
      .from("cb_kanban_columns")
      .select("id")
      .eq("id", body.column_id)
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (targetError) return NextResponse.json({ error: targetError.message }, { status: 400 });
    if (!target) return NextResponse.json({ error: "Target column not found" }, { status: 404 });

    const { data: last } = await supabase
      .from("cb_kanban_cards")
      .select("position")
      .eq("user_id", session.user.id)
      .eq("column_id", body.column_id)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    updates.column_id = body.column_id;
    updates.position = (last?.position ?? 0) + 1;
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("cb_kanban_cards")
    .update(updates)
    .eq("id", id)
    .eq("user_id", session.user.id)
    .select("id,column_id,item_type,item_id,position,created_at,updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ card: data });
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("cb_kanban_cards")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
