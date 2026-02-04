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

  let payload: { title?: string; body?: string | null } = {};

  try {
    payload = (await req.json()) as typeof payload;
  } catch {
    // ignore
  }

  const updates: Record<string, unknown> = {};

  if (payload.title !== undefined) {
    const title = String(payload.title ?? "").trim();
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    updates.title = title;
  }

  if (payload.body !== undefined) {
    updates.body = payload.body === null ? "" : String(payload.body ?? "");
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("cb_notes")
    .update(updates)
    .eq("id", id)
    .eq("user_id", session.user.id)
    .select("id,title,body,created_at,updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await logActivity(supabase, {
    userId: session.user.id,
    entityType: "note",
    entityId: data.id,
    action: "update",
    metadata: { title: data.title },
  });
  return NextResponse.json({ note: data });
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: existing } = await supabase
    .from("cb_notes")
    .select("id,title")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .maybeSingle();

  const { error } = await supabase.from("cb_notes").delete().eq("id", id).eq("user_id", session.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await logActivity(supabase, {
    userId: session.user.id,
    entityType: "note",
    entityId: id,
    action: "delete",
    metadata: { title: existing?.title ?? null },
  });
  return NextResponse.json({ ok: true });
}
