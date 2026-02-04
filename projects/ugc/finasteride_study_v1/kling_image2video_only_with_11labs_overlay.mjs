#!/usr/bin/env node
/*
  Do ONLY Kling image2video (no identify-face, no lip-sync).
  Then overlay ElevenLabs mp3 under the video (ffmpeg mux) to match “11labs sound”.

  Output:
    ~/Desktop/ugc-pipeline/projects/ugc/finasteride_study_v1/assets/scenes/
      scene_test_i2v_only.mp4
      scene_test_i2v_only_with_11labs.mp4
*/

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function parseDotEnv(contents){
  const env={};
  for(const raw of contents.split(/\r?\n/)){
    const line=raw.trim();
    if(!line||line.startsWith('#')||!line.includes('=')) continue;
    const i=line.indexOf('=');
    const k=line.slice(0,i).trim();
    let v=line.slice(i+1).trim();
    if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'"))) v=v.slice(1,-1);
    env[k]=v;
  }
  return env;
}

async function loadEnv(){
  const candidates=[
    path.join(process.cwd(),'projects/ugc/.env'),
    path.join(process.cwd(),'projects/ugc/finasteride_study_v1/.env'),
    path.join(process.env.HOME||'', 'Desktop/ugc-pipeline/.env'),
  ].filter(Boolean);
  for(const p of candidates){
    try{
      const s=await fs.readFile(p,'utf8');
      const e=parseDotEnv(s);
      for(const [k,v] of Object.entries(e)) if(process.env[k]==null) process.env[k]=v;
    }catch{}
  }
}

function requireEnv(k){ const v=process.env[k]; if(!v) throw new Error('Missing env '+k); return v; }

function base64url(buf){
  return buf.toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
}
function signJwtHS256({iss,secret,expSeconds=1800,nbfSkewSeconds=5}){
  const header={alg:'HS256',typ:'JWT'};
  const now=Math.floor(Date.now()/1000);
  const payload={iss,exp:now+expSeconds,nbf:now-nbfSkewSeconds};
  const encHeader=base64url(Buffer.from(JSON.stringify(header)));
  const encPayload=base64url(Buffer.from(JSON.stringify(payload)));
  const data=`${encHeader}.${encPayload}`;
  const sig=crypto.createHmac('sha256',secret).update(data).digest();
  return `${data}.${base64url(sig)}`;
}

async function httpJson(url,{method='GET',headers={},body}={}){
  const res=await fetch(url,{method,headers:{...headers,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  const text=await res.text();
  let json; try{json=JSON.parse(text);}catch{json={_non_json:text};}
  if(!res.ok){ const err=new Error(`${method} ${url} failed ${res.status} ${res.statusText}`); err.response=json; throw err; }
  return json;
}

const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));

async function download(url,outPath){
  const res=await fetch(url);
  if(!res.ok) throw new Error(`download failed ${res.status}`);
  const buf=Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outPath,buf);
}

async function main(){
  await loadEnv();
  const AK=requireEnv('KLING_ACCESS_KEY');
  const SK=requireEnv('KLING_SECRET_KEY');
  const token=signJwtHS256({iss:AK,secret:SK});
  const AUTHZ=`Bearer ${token}`;
  const BASE=process.env.KLING_API_BASE||'https://api-singapore.klingai.com';

  const projRoot=path.join(process.env.HOME||'', 'Desktop/ugc-pipeline/projects/ugc/finasteride_study_v1');
  const outDir=path.join(projRoot,'assets/scenes');
  const audioPath=path.join(projRoot,'assets/audio/scene_test_vo.mp3');
  await fs.mkdir(outDir,{recursive:true});

  const imgPath=path.join(projRoot,'avatar/avatar_locked_9x16_v2_2k.png');
  const imgBuf=await fs.readFile(imgPath);
  const imgB64=imgBuf.toString('base64');

  const prompt = [
    'Handheld iPhone selfie video (raw UGC), vertical 9:16, realistic home office in daylight.',
    'Same man as the input image (identity preserved).',
    'Performance: he looks into the lens, calm but slightly frustrated, subtle sadness in the eyes.',
    'Micro-expressions: small brow tension, occasional gentle blink, tiny mouth movements like he is about to speak, relaxed jaw.',
    'Natural head motion: minimal nods, very small side-to-side sway, natural breathing visible in shoulders.',
    'Lighting: soft window daylight, slight exposure breathing like a real phone camera.',
    'Camera: subtle handheld micro-shake, no cinematic moves, no zoom jumps.',
    'Texture: real skin pores, natural shadows, no beauty filter.',
    'Style: ungraded iPhone look, not AI, not animated, no waxy/plastic skin, no distortion.'
  ].join(' ');

  const negative = [
    'watermark, logo, text overlay, subtitles, UI, iphone status bar, camera interface, borders, frame, artifacts,',
    'beautify, smoothing, plastic skin, uncanny valley, deformed face, extra teeth, warped lips,',
    'cartoon, 3d render, over-sharpen, over-saturated'
  ].join(' ');

  const reqBody = {
    model_name: 'kling-v2-6',
    mode: 'pro',
    duration: '5',
    aspect_ratio: '9:16',
    sound: 'off',
    image: imgB64,
    prompt,
    negative_prompt: negative,
    // camera_control is optional; leaving it off tends to reduce “AI camera move” artifacts.
  };

  const create = await httpJson(`${BASE}/v1/videos/image2video`, { method:'POST', headers:{Authorization:AUTHZ}, body: reqBody });
  const taskId = create?.data?.task_id;
  if(!taskId) throw new Error('No task_id from image2video');

  let task;
  for(let i=0;i<90;i++){
    await sleep(3000);
    task = await httpJson(`${BASE}/v1/videos/image2video/${encodeURIComponent(taskId)}`, { method:'GET', headers:{Authorization:AUTHZ} });
    const st = task?.data?.task_status;
    if(st==='succeed'||st==='failed') break;
  }
  if(task?.data?.task_status!=='succeed') throw Object.assign(new Error('image2video failed'), { response: task });

  const vid = task?.data?.task_result?.videos?.[0];
  if(!vid?.url) throw new Error('No output url');

  const outVideo = path.join(outDir, 'scene_test_i2v_only.mp4');
  await download(vid.url, outVideo);

  // Overlay ElevenLabs audio (no lip sync, just mux it under)
  let outWithAudio = path.join(outDir, 'scene_test_i2v_only_with_11labs.mp4');
  try {
    await fs.access(audioPath);
    await execFileAsync('ffmpeg', [
      '-hide_banner','-loglevel','error','-y',
      '-i', outVideo,
      '-i', audioPath,
      '-c:v','copy',
      '-c:a','aac',
      '-shortest',
      outWithAudio
    ]);
  } catch {
    outWithAudio = null;
  }

  console.log(JSON.stringify({ ok:true, task_id: taskId, video: outVideo, video_with_11labs: outWithAudio }, null, 2));
}

main().catch((e)=>{ console.error(String(e)); if(e.response) console.error(JSON.stringify(e.response,null,2)); process.exit(1); });
