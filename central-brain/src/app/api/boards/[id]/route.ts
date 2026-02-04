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

  let body: { title?: string; is_default?: boolean } = {};
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

  if (body.is_default !== undefined) {
    updates.is_default = Boolean(body.is_default);
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  if (updates.is_default) {
    await supabase.from("cb_boards").update({ is_default: false }).eq("user_id", session.user.id);
  }

  const { data, error } = await supabase
    .from("cb_boards")
    .update(updates)
    .eq("id", id)
    .eq("user_id", session.user.id)
    .select("id,title,is_default,created_at,updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logActivity(supabase, {
    userId: session.user.id,
    entityType: "board",
    entityId: data.id,
    action: "update",
    metadata: { title: data.title, is_default: data.is_default },
  });

  return NextResponse.json({ board: data });
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: existing } = await supabase
    .from("cb_boards")
    .select("id,title,is_default")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .maybeSingle();

  const { error } = await supabase.from("cb_boards").delete().eq("id", id).eq("user_id", session.user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (existing?.is_default) {
    const { data: nextBoards } = await supabase
      .from("cb_boards")
      .select("id")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: true })
      .limit(1);
    const next = nextBoards?.[0];
    if (next) {
      await supabase.from("cb_boards").update({ is_default: true }).eq("id", next.id);
    }
  }

  await logActivity(supabase, {
    userId: session.user.id,
    entityType: "board",
    entityId: id,
    action: "delete",
    metadata: { title: existing?.title ?? null },
  });

  return NextResponse.json({ ok: true });
}
