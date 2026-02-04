export type ActivityLogEntry = {
  userId: string;
  entityType: string;
  entityId: string;
  action: string;
  metadata?: Record<string, unknown>;
};

export async function logActivity(supabase: unknown, entry: ActivityLogEntry) {
  if (!entry.userId) return;

  const payload = {
    user_id: entry.userId,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    action: entry.action,
    metadata: entry.metadata ?? {},
  };

  try {
    type MinimalSupabase = {
      from: (table: string) => {
        insert: (payload: Record<string, unknown>) => unknown;
      };
    };

    const client = supabase as MinimalSupabase;
    const { error } = (await (client.from("cb_activity_log").insert(payload) as unknown)) as {
      error?: { message: string } | null;
    };
    if (error) {
      console.error("Activity log insert failed", error.message);
    }
  } catch (err) {
    console.error("Activity log insert failed", err instanceof Error ? err.message : err);
  }
}
