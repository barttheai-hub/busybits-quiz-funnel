import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth";
import { ensureDefaultBoard } from "@/lib/boards";
import AppHeader from "@/app/_components/AppHeader";
import "../_styles/theme.css";
import TasksClient, { type Board, type Column, type Task } from "../tasks/TasksClient";

export default async function KanbanPage({
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
      <div className="cb-card" style={{ width: "min(1200px, 100%)" }}>
        <AppHeader title="Central Brain" subtitle="Kanban" email={email} isAdmin={isAdmin} />

        <div className="cb-card-inner">
          <h1 className="cb-title" style={{ marginBottom: 6 }}>
            Kanban board
          </h1>
          <p className="cb-subtitle">Boards + columns, drag cards, and manage tasks at a glance.</p>
          <div style={{ height: 18 }} />

          <TasksClient
            initialBoards={(boards ?? []) as Board[]}
            initialColumns={(columns ?? []) as Column[]}
            initialTasks={(tasks ?? []) as Task[]}
            initialBoardId={selectedBoardId}
          />
        </div>
      </div>
    </div>
  );
}
