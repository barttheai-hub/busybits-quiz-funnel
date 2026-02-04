// Supabase client typing intentionally left loose to avoid TS deep-instantiation errors.

const DEFAULT_COLUMNS = ["Backlog", "Doing", "Done"];

export type BoardSummary = {
  id: string;
  title: string;
  is_default: boolean;
};

export type BoardColumn = {
  id: string;
  title: string;
  position: number;
  board_id: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function ensureDefaultBoard(supabase: any, userId: string) {
  const { data: boardsData } = (await supabase
    .from("cb_boards")
    .select("id,title,is_default,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })) as {
    data?: BoardSummary[];
    error?: { message: string };
  };

  let boards = boardsData ?? [];
  let defaultBoard: BoardSummary | null = boards.find((b) => b.is_default) ?? boards[0] ?? null;

  if (!defaultBoard) {
    const { data: createdBoard } = (await supabase
      .from("cb_boards")
      .insert({
        user_id: userId,
        title: "Default board",
        is_default: true,
      })
      .select("id,title,is_default")
      .single()) as { data?: BoardSummary };
    defaultBoard = createdBoard ?? null;
    boards = defaultBoard ? [defaultBoard] : [];
  }

  if (defaultBoard && !defaultBoard.is_default) {
    await supabase.from("cb_boards").update({ is_default: true }).eq("id", defaultBoard.id);
    defaultBoard = { ...defaultBoard, is_default: true };
  }

  const { data: columnsData } = (await supabase
    .from("cb_board_columns")
    .select("id,title,position,board_id")
    .eq("board_id", defaultBoard?.id ?? "")
    .eq("user_id", userId)
    .order("position", { ascending: true })) as { data?: BoardColumn[] };

  let columns = columnsData ?? [];
  if (defaultBoard && columns.length === 0) {
    const payload = DEFAULT_COLUMNS.map((title, idx) => ({
      user_id: userId,
      board_id: defaultBoard!.id,
      title,
      position: idx + 1,
    }));
    await supabase.from("cb_board_columns").insert(payload);
    const { data: seeded } = (await supabase
      .from("cb_board_columns")
      .select("id,title,position,board_id")
      .eq("board_id", defaultBoard.id)
      .eq("user_id", userId)
      .order("position", { ascending: true })) as { data?: BoardColumn[] };
    columns = seeded ?? [];
  }

  return { boards, defaultBoard, columns };
}
