#!/usr/bin/env node
/**
 * UGC pipeline runner (first pass) for: finasteride_study_v1
 *
 * Steps:
 *  1) Read .env (projects/ugc/.env then projects/ugc/finasteride_study_v1/.env) and merge into process.env
 *  2) Create avatar reference pack via fal: fal-ai/nano-banana-pro
 *  3) Generate hook video via fal: fal-ai/sora-2/text-to-video
 *  4) Generate VO via ElevenLabs (mp3)
 *  5) Trigger Kling 2.6 lipsync/animation (stub by default; optional useapi.net integration)
 *
 * Outputs:
 *  projects/ugc/finasteride_study_v1/assets/... and projects/ugc/finasteride_study_v1/logs/...
 */

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const PROJECT = "finasteride_study_v1";
const PROJECT_DIR = path.join(ROOT, "projects/ugc", PROJECT);
const ASSETS_DIR = path.join(PROJECT_DIR, "assets");
const LOGS_DIR = path.join(PROJECT_DIR, "logs");

const nowStamp = () => new Date().toISOString().replace(/[:.]/g, "-");
const RUN_ID = `${PROJECT}_${nowStamp()}`;

function parseDotEnv(contents) {
  const env = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    // strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

async function loadEnvFiles() {
  const candidates = [
    // Preferred: per-repo secrets
    path.join(ROOT, "projects/ugc/.env"),
    path.join(PROJECT_DIR, ".env"),

    // Desktop pipeline root (Ziga’s canonical location)
    path.join(process.env.HOME || "", "Desktop/ugc-pipeline/.env"),

    // fallback: central-brain for existing local secrets
    path.join(ROOT, "central-brain/.env.local"),
  ].filter(Boolean);

  const loaded = [];
  for (const p of candidates) {
    try {
      const s = await fsp.readFile(p, "utf8");
      const env = parseDotEnv(s);
      for (const [k, v] of Object.entries(env)) {
        if (process.env[k] == null) process.env[k] = v;
      }
      loaded.push({ path: p, keys: Object.keys(env).length });
    } catch {
      // ignore
    }
  }
  return loaded;
}

async function ensureDirs() {
  await fsp.mkdir(ASSETS_DIR, { recursive: true });
  await fsp.mkdir(LOGS_DIR, { recursive: true });
  for (const sub of [
    "avatar_reference_pack",
    "hook_video",
    "voiceover",
    "kling",
  ]) {
    await fsp.mkdir(path.join(ASSETS_DIR, sub), { recursive: true });
  }
}

async function writeJson(filePath, data) {
  await fsp.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

async function downloadToFile(url, outPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed ${res.status} ${res.statusText} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fsp.writeFile(outPath, buf);
  return { bytes: buf.length };
}

async function logEvent(kind, payload) {
  const p = path.join(LOGS_DIR, `${RUN_ID}.${kind}.json`);
  await writeJson(p, payload);
  return p;
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

async function falRun(endpointUrl, input, { timeoutMs = 10 * 60_000 } = {}) {
  // Fal HTTP API: POST https://fal.run/<model_id_or_path>
  // Auth: Authorization: Key <FAL_KEY>
  const FAL_KEY = requireEnv("FAL_KEY");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${FAL_KEY}`,
      },
      body: JSON.stringify(input),
      signal: ctrl.signal,
    });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { _non_json: text };
    }
    if (!res.ok) {
      const err = new Error(`fal.run error ${res.status} ${res.statusText}`);
      err.response = json;
      throw err;
    }
    return json;
  } finally {
    clearTimeout(t);
  }
}

async function stepAvatarReferencePack() {
  const outDir = path.join(ASSETS_DIR, "avatar_reference_pack");
  const prompt = process.env.AVATAR_PROMPT ||
    "Photorealistic UGC creator headshot reference pack of a friendly man in his early 30s with short brown hair and subtle temples thinning. Neutral background, soft window light, crisp skin detail. Consistent identity across images. 35mm lens look.";

  const input = {
    prompt,
    num_images: Number(process.env.AVATAR_NUM_IMAGES || 4),
    aspect_ratio: process.env.AVATAR_ASPECT_RATIO || "1:1",
  };

  const reqLog = await logEvent("avatar_reference_pack.request", {
    step: "avatar_reference_pack",
    endpoint: "https://fal.run/fal-ai/nano-banana-pro",
    input,
  });

  if (!process.env.FAL_KEY) {
    // Stub
    const stub = {
      stub: true,
      reason: "FAL_KEY not set",
      expected_output: "fal returns { images: [{ url, content_type, width, height }, ...] }",
    };
    const respLog = await logEvent("avatar_reference_pack.response", stub);
    await writeJson(path.join(outDir, "manifest.json"), {
      run_id: RUN_ID,
      prompt,
      input,
      request_log: reqLog,
      response_log: respLog,
      images: [],
    });
    return { ok: false, stub: true, outDir };
  }

  const resp = await falRun("https://fal.run/fal-ai/nano-banana-pro", input);
  const respLog = await logEvent("avatar_reference_pack.response", resp);

  const images = resp.images || resp.data?.images || [];
  const downloaded = [];
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const ext = (img.content_type === "image/png") ? "png" : "jpg";
    const outPath = path.join(outDir, `ref_${String(i + 1).padStart(2, "0")}.${ext}`);
    const meta = await downloadToFile(img.url, outPath);
    downloaded.push({ ...img, file: path.relative(PROJECT_DIR, outPath), ...meta });
  }

  await writeJson(path.join(outDir, "manifest.json"), {
    run_id: RUN_ID,
    prompt,
    input,
    request_log: reqLog,
    response_log: respLog,
    downloaded,
  });

  return { ok: true, outDir, count: downloaded.length };
}

async function stepHookVideo() {
  const outDir = path.join(ASSETS_DIR, "hook_video");

  const prompt = process.env.HOOK_PROMPT ||
    "Vertical UGC selfie video. A friendly man in his early 30s looks into the camera in a bathroom. He says: 'I joined a finasteride study for 90 days—here's what actually happened.' Natural lighting, slight handheld movement, realistic mouth movement, clean audio.";

  const input = {
    prompt,
    aspect_ratio: process.env.HOOK_ASPECT_RATIO || "9:16",
    duration: Number(process.env.HOOK_DURATION || 4),
    resolution: process.env.HOOK_RESOLUTION || "720p",
    delete_video: false,
  };

  const reqLog = await logEvent("hook_video.request", {
    step: "hook_video",
    endpoint: "https://fal.run/fal-ai/sora-2/text-to-video",
    input,
  });

  if (!process.env.FAL_KEY) {
    const stub = {
      stub: true,
      reason: "FAL_KEY not set",
      expected_output: "fal returns { video: { url, content_type }, video_id }",
    };
    const respLog = await logEvent("hook_video.response", stub);
    await writeJson(path.join(outDir, "manifest.json"), {
      run_id: RUN_ID,
      prompt,
      input,
      request_log: reqLog,
      response_log: respLog,
      video: null,
    });
    return { ok: false, stub: true, outDir };
  }

  const resp = await falRun("https://fal.run/fal-ai/sora-2/text-to-video", input, { timeoutMs: 20 * 60_000 });
  const respLog = await logEvent("hook_video.response", resp);

  const video = resp.video || resp.data?.video;
  let saved = null;
  if (video?.url) {
    const outPath = path.join(outDir, `hook_${RUN_ID}.mp4`);
    const meta = await downloadToFile(video.url, outPath);
    saved = { ...video, file: path.relative(PROJECT_DIR, outPath), ...meta };
  }

  await writeJson(path.join(outDir, "manifest.json"), {
    run_id: RUN_ID,
    prompt,
    input,
    request_log: reqLog,
    response_log: respLog,
    saved,
    raw: resp,
  });

  return { ok: !!saved, outDir, saved };
}

async function elevenLabsTTS({ text, voiceId, modelId }) {
  const XI_API_KEY = requireEnv("ELEVENLABS_API_KEY");
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`;

  const body = {
    text,
    model_id: modelId,
    // optional tuning; keep mild
    voice_settings: {
      stability: 0.4,
      similarity_boost: 0.8,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": XI_API_KEY,
      Accept: "audio/mpeg",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    const err = new Error(`ElevenLabs error ${res.status} ${res.statusText}: ${errText}`);
    throw err;
  }

  const buf = Buffer.from(await res.arrayBuffer());
  return { buf, request: { url, body } };
}

async function stepVoiceover() {
  const outDir = path.join(ASSETS_DIR, "voiceover");

  const scriptText = process.env.VO_SCRIPT ||
    "Quick update: I joined a 90-day finasteride study. I tracked shedding, photos, and side effects weekly. Here's what changed—and what didn't.";

  const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Rachel (common default)
  const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_monolingual_v1";

  const reqLog = await logEvent("voiceover.request", {
    step: "voiceover",
    provider: "elevenlabs",
    voiceId,
    modelId,
    scriptText,
  });

  if (!process.env.ELEVENLABS_API_KEY) {
    const stub = { stub: true, reason: "ELEVENLABS_API_KEY not set" };
    const respLog = await logEvent("voiceover.response", stub);
    await writeJson(path.join(outDir, "manifest.json"), {
      run_id: RUN_ID,
      request_log: reqLog,
      response_log: respLog,
      audio: null,
    });
    return { ok: false, stub: true, outDir };
  }

  const { buf, request } = await elevenLabsTTS({ text: scriptText, voiceId, modelId });
  const outPath = path.join(outDir, `vo_${RUN_ID}.mp3`);
  await fsp.writeFile(outPath, buf);

  const respLog = await logEvent("voiceover.response", {
    ok: true,
    bytes: buf.length,
    saved_file: path.relative(PROJECT_DIR, outPath),
    request,
  });

  await writeJson(path.join(outDir, "manifest.json"), {
    run_id: RUN_ID,
    scriptText,
    voiceId,
    modelId,
    request_log: reqLog,
    response_log: respLog,
    audio_file: path.relative(PROJECT_DIR, outPath),
  });

  return { ok: true, outDir, audioFile: outPath };
}

async function stepKlingLipSync() {
  const outDir = path.join(ASSETS_DIR, "kling");

  // This step is intentionally a stub by default because Kling has multiple API providers.
  // Optional integration via useapi.net Kling endpoint:
  //   POST https://api.useapi.net/v1/kling/videos/lipsync
  //   Authorization: Bearer <USEAPI_TOKEN>
  // Body: { video: <url>, audio: <url>, ... }

  const input = {
    provider: process.env.KLING_PROVIDER || "stub",
    notes: "Provide HOOK_VIDEO_URL and VO_AUDIO_URL (publicly accessible) or use an uploader to a CDN/bucket.",
    hook_video_url: process.env.HOOK_VIDEO_URL || null,
    vo_audio_url: process.env.VO_AUDIO_URL || null,
    mode: process.env.KLING_MODE || "audio_to_video",
    version: process.env.KLING_VERSION || "2.6",
  };

  const reqLog = await logEvent("kling.request", {
    step: "kling_lipsync",
    input,
  });

  // If the user has configured useapi.net
  const useApiToken = process.env.USEAPI_TOKEN;
  const useApiEndpoint = process.env.USEAPI_KLING_LIPSYNC_ENDPOINT || "https://api.useapi.net/v1/kling/videos/lipsync";

  if (useApiToken && input.hook_video_url && input.vo_audio_url) {
    const body = {
      video: input.hook_video_url,
      audio: input.vo_audio_url,
    };
    const res = await fetch(useApiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${useApiToken}`,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { _non_json: text }; }

    const respLog = await logEvent("kling.response", {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      endpoint: useApiEndpoint,
      request_body: body,
      response: json,
    });

    await writeJson(path.join(outDir, "manifest.json"), {
      run_id: RUN_ID,
      request_log: reqLog,
      response_log: respLog,
      provider: "useapi.net",
      request_body: body,
      response: json,
    });

    return { ok: res.ok, outDir, provider: "useapi.net" };
  }

  // Default stub
  const stub = {
    stub: true,
    reason: useApiToken ? "Missing HOOK_VIDEO_URL or VO_AUDIO_URL" : "No KLING integration configured (USEAPI_TOKEN not set)",
    next_steps: [
      "Upload generated mp4/mp3 to a public URL (S3/R2/Supabase Storage) and set HOOK_VIDEO_URL + VO_AUDIO_URL",
      "Set USEAPI_TOKEN (or implement a direct Kling provider)",
    ],
  };

  const respLog = await logEvent("kling.response", stub);
  await writeJson(path.join(outDir, "manifest.json"), {
    run_id: RUN_ID,
    request_log: reqLog,
    response_log: respLog,
    stub,
  });

  return { ok: false, stub: true, outDir };
}

async function main() {
  await ensureDirs();
  const envLoaded = await loadEnvFiles();

  const summary = {
    run_id: RUN_ID,
    project: PROJECT,
    env_loaded: envLoaded,
    steps: {},
  };

  const ONLY_STEPS = (process.env.ONLY_STEPS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const shouldRun = (name) => ONLY_STEPS.length === 0 || ONLY_STEPS.includes(name);
  const runStep = async (name, fn) => {
    if (!shouldRun(name)) return { ok: false, skipped: true };
    try {
      return await fn();
    } catch (e) {
      return { ok: false, error: String(e), response: e?.response };
    }
  };

  summary.steps.avatar_reference_pack = await runStep("avatar_reference_pack", stepAvatarReferencePack);
  summary.steps.hook_video = await runStep("hook_video", stepHookVideo);
  summary.steps.voiceover = await runStep("voiceover", stepVoiceover);
  summary.steps.kling_lipsync = await runStep("kling_lipsync", stepKlingLipSync);

  await writeJson(path.join(PROJECT_DIR, `run_${RUN_ID}.summary.json`), summary);

  // minimal console output for humans
  console.log(JSON.stringify({
    run_id: RUN_ID,
    project_dir: PROJECT_DIR,
    assets_dir: ASSETS_DIR,
    logs_dir: LOGS_DIR,
    env_loaded: envLoaded,
    step_ok: Object.fromEntries(Object.entries(summary.steps).map(([k, v]) => [k, !!v.ok])),
  }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
