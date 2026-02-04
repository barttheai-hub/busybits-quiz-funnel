import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-log";

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("cb_board_columns")
    .select("id,title,position,board_id,created_at,updated_at")
    .eq("board_id", id)
    .eq("user_id", session.user.id)
    .order("position", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ columns: data ?? [] });
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
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

  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  // Prevent duplicate columns (same title) within a board.
  // We enforce this at the API layer (case-insensitive) to keep schema.sql idempotent and avoid
  // unique-index failures on existing installs that may already have duplicates.
  const { data: existingSameTitle } = await supabase
    .from("cb_board_columns")
    .select("id")
    .eq("board_id", id)
    .eq("user_id", session.user.id)
    .ilike("title", title)
    .limit(1);

  if ((existingSameTitle?.length ?? 0) > 0) {
    return NextResponse.json({ error: "Column already exists" }, { status: 409 });
  }

  let position = Number(body.position);
  if (!Number.isInteger(position) || position < 1) {
    const { data: rows } = await supabase
      .from("cb_board_columns")
      .select("position")
      .eq("board_id", id)
      .eq("user_id", session.user.id)
      .order("position", { ascending: false })
      .limit(1);
    position = (rows?.[0]?.position ?? 0) + 1;
  }

  const { data, error } = await supabase
    .from("cb_board_columns")
    .insert({
      user_id: session.user.id,
      board_id: id,
      title,
      position,
    })
    .select("id,title,position,board_id,created_at,updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logActivity(supabase, {
    userId: session.user.id,
    entityType: "board_column",
    entityId: data.id,
    action: "create",
    metadata: { title: data.title, board_id: data.board_id },
  });

  return NextResponse.json({ column: data });
}
