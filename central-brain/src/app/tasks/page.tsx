import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth";
import { ensureDefaultBoard } from "@/lib/boards";
import AppHeader from "@/app/_components/AppHeader";
import "../_styles/theme.css";
import TasksClient, { type Board, type Column, type Task } from "./TasksClient";

export default async function TasksPage({
  searchParams,
}: {
  searchParams?: Promise<{ board?: string | string[] }> | { board?: string | string[] };
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");
  const email = session.user.email ?? "";
  const isAdmin = isAdminEmail(email);

  // Cast to any here to avoid TS "excessively deep" instantiation from Supabase's complex generics.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { boards, defaultBoard } = await ensureDefaultBoard(supabase as any, session.user.id);
  const sp = (await searchParams) as { board?: string | string[] } | undefined;
  const boardParam = Array.isArray(sp?.board) ? sp?.board[0] : sp?.board;
  const selectedBoardId = typeof boardParam === "string" && boardParam ? boardParam : defaultBoard?.id ?? boards[0]?.id ?? null;

  const { data: columns } = selectedBoardId
    ? await supabase
        .from("cb_board_columns")
        .select("id,title,position,board_id,created_at,updated_at")
        .eq("user_id", session.user.id)
        .eq("board_id", selectedBoardId)
        .order("position", { ascending: true })
    : { data: [] as unknown[] };

  const { data: tasks } = await supabase
    .from("cb_tasks")
    .select(
      "id,title,notes,status,priority,due_at,board_id,column_id,position,assignee,recurrence_rule,recurrence_interval,created_at,updated_at"
    )
    .eq("user_id", session.user.id)
    .eq("board_id", selectedBoardId)
    .order("position", { ascending: true });

  return (
    <div className="cb-shell" style={{ placeItems: "stretch" }}>
      <div className="cb-card">
        <AppHeader title="Central Brain" subtitle="Tasks" email={email} isAdmin={isAdmin} />

        <div className="cb-card-inner">
          <div className="cb-grid-2">
            <section style={{ minHeight: 360 }}>
              <h1 className="cb-title" style={{ marginBottom: 6 }}>
                Your tasks
              </h1>
              <p className="cb-subtitle">Keyboard: N to add, / to search.</p>

              <div style={{ height: 18 }} />

              <TasksClient
                initialBoards={(boards ?? []) as Board[]}
                initialColumns={(columns ?? []) as Column[]}
                initialTasks={(tasks ?? []) as Task[]}
                initialBoardId={selectedBoardId}
              />
            </section>

            <aside>
              <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 16, padding: 16 }}>
                <div style={{ fontWeight: 650 }}>Status</div>
                <div style={{ height: 10 }} />
                <div style={{ opacity: 0.78, fontSize: 13, lineHeight: 1.55 }}>
                  Boards + tasks are backed by Supabase RLS tables <code>cb_boards</code>, <code>cb_board_columns</code>,
                  and <code>cb_tasks</code>.
                </div>
              </div>

              <div style={{ height: 14 }} />

              <div style={{ opacity: 0.72, fontSize: 12, lineHeight: 1.5 }}>
                Stripe-ish dark UI, responsive dashboard shell.
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
