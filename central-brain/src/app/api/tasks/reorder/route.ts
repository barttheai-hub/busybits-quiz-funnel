import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-log";

type TaskOrderUpdate = {
  id: string;
  column_id: string | null;
  position: number;
  board_id?: string | null;
};

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { updates?: TaskOrderUpdate[] } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    // ignore
  }

  const updates = body.updates ?? [];
  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  if (updates.length > 200) {
    return NextResponse.json({ error: "Too many updates" }, { status: 400 });
  }

  for (const update of updates) {
    if (!update.id || !Number.isInteger(update.position) || update.position < 1) {
      return NextResponse.json({ error: "Invalid update payload" }, { status: 400 });
    }
  }

  const ids = updates.map((u) => u.id);
  const { data: existing } = await supabase
    .from("cb_tasks")
    .select("id,title,board_id,column_id,position")
    .eq("user_id", session.user.id)
    .in("id", ids);

  const existingById = new Map((existing ?? []).map((task) => [task.id, task]));

  await Promise.all(
    updates.map((update) =>
      supabase
        .from("cb_tasks")
        .update({
          column_id: update.column_id,
          position: update.position,
          board_id: update.board_id ?? undefined,
        })
        .eq("id", update.id)
        .eq("user_id", session.user.id)
    )
  );

  const moveLogs = updates
    .map((update) => {
      const prev = existingById.get(update.id);
      if (!prev) return null;
      if (prev.column_id !== update.column_id) {
        return {
          id: update.id,
          title: prev.title,
          from: prev.column_id,
          to: update.column_id,
        };
      }
      return null;
    })
    .filter(Boolean) as Array<{ id: string; title: string; from: string | null; to: string | null }>;

  await Promise.all(
    moveLogs.map((entry) =>
      logActivity(supabase, {
        userId: session.user.id,
        entityType: "task",
        entityId: entry.id,
        action: "move",
        metadata: { title: entry.title, from: entry.from, to: entry.to },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
