import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-log";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseUuid(value: unknown, field: string) {
  const id = String(value ?? "").trim();
  if (!id) return { error: `${field} is required` } as const;
  if (!UUID_RE.test(id)) return { error: `${field} must be a valid UUID` } as const;
  return { id } as const;
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getRequestIp(req);
  const limiter = rateLimit({
    key: `task-note-links-post:${session.user.id || ip}`,
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: limiter.retryAfter },
      { status: 429, headers: { "retry-after": String(limiter.retryAfter) } }
    );
  }

  let body: { task_id?: string; note_id?: string } = {};

  try {
    body = (await req.json()) as typeof body;
  } catch {
    // ignore
  }

  const taskId = parseUuid(body.task_id, "task_id");
  if ("error" in taskId) return NextResponse.json({ error: taskId.error }, { status: 400 });

  const noteId = parseUuid(body.note_id, "note_id");
  if ("error" in noteId) return NextResponse.json({ error: noteId.error }, { status: 400 });

  const { error } = await supabase
    .from("cb_task_note_links")
    .upsert(
      {
        task_id: taskId.id,
        note_id: noteId.id,
        user_id: session.user.id,
      },
      {
        onConflict: "task_id,note_id",
        ignoreDuplicates: true,
      }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await logActivity(supabase, {
    userId: session.user.id,
    entityType: "task_note_link",
    entityId: `${taskId.id}:${noteId.id}`,
    action: "attach",
    metadata: { task_id: taskId.id, note_id: noteId.id },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getRequestIp(req);
  const limiter = rateLimit({
    key: `task-note-links-delete:${session.user.id || ip}`,
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: limiter.retryAfter },
      { status: 429, headers: { "retry-after": String(limiter.retryAfter) } }
    );
  }

  let body: { task_id?: string; note_id?: string } = {};

  try {
    body = (await req.json()) as typeof body;
  } catch {
    // ignore
  }

  const taskId = parseUuid(body.task_id, "task_id");
  if ("error" in taskId) return NextResponse.json({ error: taskId.error }, { status: 400 });

  const noteId = parseUuid(body.note_id, "note_id");
  if ("error" in noteId) return NextResponse.json({ error: noteId.error }, { status: 400 });

  const { error } = await supabase
    .from("cb_task_note_links")
    .delete()
    .eq("task_id", taskId.id)
    .eq("note_id", noteId.id)
    .eq("user_id", session.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await logActivity(supabase, {
    userId: session.user.id,
    entityType: "task_note_link",
    entityId: `${taskId.id}:${noteId.id}`,
    action: "detach",
    metadata: { task_id: taskId.id, note_id: noteId.id },
  });
  return NextResponse.json({ ok: true });
}
