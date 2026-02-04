#!/usr/bin/env node
/*
  Kling 2.6 smoke test:
  - image2video (kling-v2-6)
  - Identify-face
  - advanced-lip-sync with ElevenLabs audio (base64)

  Loads env from:
    1) ./projects/ugc/.env
    2) ./projects/ugc/finasteride_study_v1/.env
    3) ~/Desktop/ugc-pipeline/.env

  Outputs into: ./projects/ugc/finasteride_study_v1/assets/kling_test/
*/

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const PROJECT_DIR = path.join(ROOT, "projects/ugc/finasteride_study_v1");
const OUT_DIR = path.join(PROJECT_DIR, "assets/kling_test");

function parseDotEnv(contents) {
  const env = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    env[key] = val;
  }
  return env;
}

async function loadEnv() {
  const candidates = [
    path.join(ROOT, "projects/ugc/.env"),
    path.join(PROJECT_DIR, ".env"),
    path.join(process.env.HOME || "", "Desktop/ugc-pipeline/.env"),
  ].filter(Boolean);

  for (const p of candidates) {
    try {
      const s = await fs.readFile(p, "utf8");
      const env = parseDotEnv(s);
      for (const [k, v] of Object.entries(env)) if (process.env[k] == null) process.env[k] = v;
    } catch {}
  }
}

function requireEnv(k) {
  const v = process.env[k];
  if (!v) throw new Error(`Missing env var: ${k}`);
  return v;
}

function base64url(buf) {
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function signJwtHS256({ iss, secret, expSeconds = 1800, nbfSkewSeconds = 5 }) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss,
    exp: now + expSeconds,
    nbf: now - nbfSkewSeconds,
  };
  const encHeader = base64url(Buffer.from(JSON.stringify(header)));
  const encPayload = base64url(Buffer.from(JSON.stringify(payload)));
  const data = `${encHeader}.${encPayload}`;
  const sig = crypto.createHmac("sha256", secret).update(data).digest();
  return `${data}.${base64url(sig)}`;
}

async function httpJson(url, { method = "GET", headers = {}, body } = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      ...headers,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { _non_json: text }; }
  if (!res.ok) {
    const err = new Error(`${method} ${url} failed: ${res.status} ${res.statusText}`);
    err.response = json;
    throw err;
  }
  return json;
}

async function elevenLabsTTSMp3({ text, voiceId }) {
  const XI = requireEnv("ELEVENLABS_API_KEY");
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": XI,
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: process.env.ELEVENLABS_MODEL_ID || "eleven_monolingual_v1",
      voice_settings: { stability: 0.4, similarity_boost: 0.8 },
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`ElevenLabs error ${res.status}: ${errText}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  await loadEnv();
  await fs.mkdir(OUT_DIR, { recursive: true });

  const AK = requireEnv("KLING_ACCESS_KEY");
  const SK = requireEnv("KLING_SECRET_KEY");
  const authToken = signJwtHS256({ iss: AK, secret: SK });
  const AUTHZ = `Bearer ${authToken}`;
  const BASE = process.env.KLING_API_BASE || "https://api-singapore.klingai.com";

  // Use the locked avatar ref_04 (user-approved) from desktop pipeline folder.
  const avatarPath = path.join(process.env.HOME || "", "Desktop/ugc-pipeline/projects/ugc/finasteride_study_v1/avatar/ref_04.png");
  const avatarBuf = await fs.readFile(avatarPath);
  const avatarB64 = avatarBuf.toString("base64");

  // 1) image2video (kling-v2-6) — reuse last successful run if present to avoid extra spend
  let parentVideo = null;
  try {
    const prev = JSON.parse(await fs.readFile(path.join(OUT_DIR, "01_image2video.poll.json"), "utf8"));
    if (prev?.data?.task_status === "succeed") {
      parentVideo = prev?.data?.task_result?.videos?.[0] || null;
    }
  } catch {}

  const image2videoReq = {
    model_name: "kling-v2-6",
    mode: "pro",
    duration: "5",
    sound: "off",
    image: avatarB64,
    prompt: "Handheld iPhone selfie video in a normal home. The man looks into the camera and makes small natural head movements and blinks. Realistic, not polished, no UI overlays.",
    negative_prompt: "watermark, logo, text overlay, subtitles, UI, iphone status bar, camera interface, tabs, borders, frame, artifacts"
  };

  let taskId = null;
  if (!parentVideo?.id) {
    const image2videoCreate = await httpJson(`${BASE}/v1/videos/image2video`, {
      method: "POST",
      headers: { Authorization: AUTHZ },
      body: image2videoReq,
    });
    await fs.writeFile(path.join(OUT_DIR, "01_image2video.create.json"), JSON.stringify(image2videoCreate, null, 2));

    taskId = image2videoCreate?.data?.task_id;
    if (!taskId) throw new Error(`No task_id returned from image2video: ${JSON.stringify(image2videoCreate)}`);

    // Poll
    let task;
    for (let i = 0; i < 60; i++) {
      await sleep(3000);
      task = await httpJson(`${BASE}/v1/videos/image2video/${encodeURIComponent(taskId)}`, {
        method: "GET",
        headers: { Authorization: AUTHZ },
      });
      await fs.writeFile(path.join(OUT_DIR, "01_image2video.poll.json"), JSON.stringify(task, null, 2));
      const st = task?.data?.task_status;
      if (st === "succeed" || st === "failed") break;
    }

    if (task?.data?.task_status !== "succeed") {
      throw Object.assign(new Error(`image2video did not succeed: ${task?.data?.task_status}`), { response: task });
    }

    parentVideo = task?.data?.task_result?.videos?.[0] || null;
  }

  if (!parentVideo?.id) throw new Error(`No output video id in image2video result`);

  // 2) Identify-face using video_id
  const identifyReq = { video_id: parentVideo.id };
  // Docs show /v1/videos/Identify-face but the API appears case-sensitive; use lowercase endpoint.
  const identify = await httpJson(`${BASE}/v1/videos/identify-face`, {
    method: "POST",
    headers: { Authorization: AUTHZ },
    body: identifyReq,
  });
  await fs.writeFile(path.join(OUT_DIR, "02_identify_face.json"), JSON.stringify(identify, null, 2));

  const sessionId = identify?.data?.session_id;
  const faceId = identify?.data?.face_data?.[0]?.face_id;
  const faceStart = identify?.data?.face_data?.[0]?.start_time ?? 0;
  const faceEnd = identify?.data?.face_data?.[0]?.end_time ?? 5200;
  // Parent video duration (seconds) → ms. Keep audio end <= video duration.
  const vidSec = Number(parentVideo?.duration || 5);
  const vidMs = Math.max(2000, Math.floor(vidSec * 1000));
  const safeEndMs = Math.max(2000, Math.min(vidMs - 50, 4900));
  if (!sessionId || !faceId) throw new Error(`Identify-face missing session_id/face_id`);

  // 3) ElevenLabs audio (5s-ish) -> base64
  const voiceId = requireEnv("ELEVENLABS_VOICE_ID");
  const ttsText = "I took finasteride for eighteen months. My hair did not grow back. Not even a little.";
  const mp3 = await elevenLabsTTSMp3({ text: ttsText, voiceId });
  await fs.writeFile(path.join(OUT_DIR, "03_voice.mp3"), mp3);
  const mp3b64 = mp3.toString("base64");
  if (mp3.length > 5 * 1024 * 1024) throw new Error(`ElevenLabs mp3 is too large for Kling sound_file (>${5}MB)`);

  // 4) advanced-lip-sync
  const lipReq = {
    session_id: sessionId,
    face_choose: [
      {
        face_id: faceId,
        sound_file: mp3b64,
        sound_start_time: 0,
        sound_end_time: safeEndMs,
        // Insert audio at (or after) faceStart; keep within face window
        sound_insert_time: Math.max(0, Math.min(faceStart, faceEnd - safeEndMs)),
        sound_volume: 1,
        original_audio_volume: 0
      }
    ]
  };

  const lipCreate = await httpJson(`${BASE}/v1/videos/advanced-lip-sync`, {
    method: "POST",
    headers: { Authorization: AUTHZ },
    body: lipReq,
  });
  await fs.writeFile(path.join(OUT_DIR, "04_lipsync.create.json"), JSON.stringify(lipCreate, null, 2));

  const lipTaskId = lipCreate?.data?.task_id;
  if (!lipTaskId) throw new Error(`No task_id returned from advanced-lip-sync`);

  // Poll lipsync
  let lipTask;
  for (let i = 0; i < 80; i++) {
    await sleep(3000);
    lipTask = await httpJson(`${BASE}/v1/videos/advanced-lip-sync/${encodeURIComponent(lipTaskId)}`, {
      method: "GET",
      headers: { Authorization: AUTHZ },
    });
    await fs.writeFile(path.join(OUT_DIR, "04_lipsync.poll.json"), JSON.stringify(lipTask, null, 2));
    const st = lipTask?.data?.task_status;
    if (st === "succeed" || st === "failed") break;
  }

  if (lipTask?.data?.task_status !== "succeed") {
    throw Object.assign(new Error(`lip-sync did not succeed: ${lipTask?.data?.task_status}`), { response: lipTask });
  }

  const outVideo = lipTask?.data?.task_result?.videos?.[0];
  if (!outVideo?.url) throw new Error(`No output url in lip-sync result`);

  // Download result for watermark check
  const outMp4 = await fetch(outVideo.url);
  const outBuf = Buffer.from(await outMp4.arrayBuffer());
  const outPath = path.join(OUT_DIR, "05_lipsync_output.mp4");
  await fs.writeFile(outPath, outBuf);

  console.log(JSON.stringify({
    ok: true,
    image2video_task_id: taskId,
    image2video_video_id: parentVideo.id,
    lipsync_task_id: lipTaskId,
    lipsync_url: outVideo.url,
    saved: outPath,
  }, null, 2));
}

main().catch((e) => {
  console.error(String(e));
  if (e?.response) {
    console.error(JSON.stringify(e.response, null, 2));
  }
  process.exitCode = 1;
});
