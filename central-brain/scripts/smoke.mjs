import { spawn } from "node:child_process";

const DEFAULT_PORT = 3000;
const baseUrlFromEnv = process.env.SMOKE_BASE_URL;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(baseUrl, path, options) {
  const res = await fetch(`${baseUrl}${path}`, options);
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { res, data };
}

async function waitForHealthy(baseUrl, timeoutMs = 30_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const health = await fetchJson(baseUrl, "/api/health");
      if (health.res.ok && health.data?.ok) return;
    } catch {
      // ignore until timeout
    }
    await sleep(500);
  }
  throw new Error(`Health check timed out after ${timeoutMs}ms (${baseUrl}/api/health)`);
}

async function withServer(fn) {
  // If caller explicitly provides SMOKE_BASE_URL, trust it.
  if (baseUrlFromEnv) {
    await waitForHealthy(baseUrlFromEnv);
    return fn(baseUrlFromEnv);
  }

  const baseUrl = `http://localhost:${DEFAULT_PORT}`;

  // Try existing server first.
  try {
    await waitForHealthy(baseUrl, 2000);
    return fn(baseUrl);
  } catch {
    // fall through to auto-start
  }

  // Auto-start a dev server for the smoke test.
  const child = spawn("npm", ["run", "dev", "--", "-p", String(DEFAULT_PORT)], {
    stdio: "inherit",
    env: process.env,
  });

  try {
    await waitForHealthy(baseUrl);
    return await fn(baseUrl);
  } finally {
    child.kill("SIGTERM");
    await sleep(500);
    child.kill("SIGKILL");
  }
}

async function run() {
  await withServer(async (baseUrl) => {
    const health = await fetchJson(baseUrl, "/api/health");
    if (!health.res.ok || !health.data?.ok) {
      throw new Error(`Health check failed: ${health.res.status}`);
    }

    const tasks = await fetchJson(baseUrl, "/api/tasks");
    if (tasks.res.status !== 401) {
      throw new Error(`Expected /api/tasks to be 401, got ${tasks.res.status}`);
    }

    console.log("smoke ok");
  });
}

run().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
