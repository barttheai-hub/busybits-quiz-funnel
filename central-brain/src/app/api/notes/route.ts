import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-log";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("cb_notes")
    .select("id,title,body,created_at,updated_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ notes: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getRequestIp(req);
  const limiter = rateLimit({
    key: `notes-post:${session.user.id || ip}`,
    limit: 20,
    windowMs: 60 * 1000,
  });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: limiter.retryAfter },
      { status: 429, headers: { "retry-after": String(limiter.retryAfter) } }
    );
  }

  let payload: { title?: string; body?: string | null } = {};

  try {
    payload = (await req.json()) as typeof payload;
  } catch {
    // ignore
  }

  const title = String(payload.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const noteBody = typeof payload.body === "string" ? payload.body : "";

  const { data, error } = await supabase
    .from("cb_notes")
    .insert({
      user_id: session.user.id,
      title,
      body: noteBody,
    })
    .select("id,title,body,created_at,updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await logActivity(supabase, {
    userId: session.user.id,
    entityType: "note",
    entityId: data.id,
    action: "create",
    metadata: { title: data.title },
  });
  return NextResponse.json({ note: data });
}
