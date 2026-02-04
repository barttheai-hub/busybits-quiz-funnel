import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-log";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";

const DEFAULT_COLUMNS = ["Backlog", "Doing", "Done"];

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("cb_boards")
    .select("id,title,is_default,created_at,updated_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ boards: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getRequestIp(req);
  const limiter = rateLimit({
    key: `boards-post:${session.user.id || ip}`,
    limit: 20,
    windowMs: 60 * 1000,
  });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: limiter.retryAfter },
      { status: 429, headers: { "retry-after": String(limiter.retryAfter) } }
    );
  }

  let body: { title?: string; is_default?: boolean; seed_default_columns?: boolean } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    // ignore
  }

  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const isDefault = Boolean(body.is_default);
  if (isDefault) {
    await supabase.from("cb_boards").update({ is_default: false }).eq("user_id", session.user.id);
  }

  const { data, error } = await supabase
    .from("cb_boards")
    .insert({
      user_id: session.user.id,
      title,
      is_default: isDefault,
    })
    .select("id,title,is_default,created_at,updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const shouldSeed = body.seed_default_columns !== false;
  if (shouldSeed) {
    const payload = DEFAULT_COLUMNS.map((col, idx) => ({
      user_id: session.user.id,
      board_id: data.id,
      title: col,
      position: idx + 1,
    }));
    await supabase.from("cb_board_columns").insert(payload);
  }

  await logActivity(supabase, {
    userId: session.user.id,
    entityType: "board",
    entityId: data.id,
    action: "create",
    metadata: { title: data.title, is_default: data.is_default },
  });

  return NextResponse.json({ board: data });
}
