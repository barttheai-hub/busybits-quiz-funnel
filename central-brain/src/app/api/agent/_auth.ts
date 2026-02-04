import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export function requireAgentKey(req: Request) {
  if (!env.AGENT_API_KEY) {
    return NextResponse.json({ error: "AGENT_API_KEY not configured" }, { status: 501 });
  }

  const key = req.headers.get("x-agent-key") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!key || key !== env.AGENT_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
