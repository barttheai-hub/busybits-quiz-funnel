#!/usr/bin/env node
/*
  Kling Video-to-Audio (per official docs)
  - Create: POST /v1/audio/video-to-audio
  - Query:  GET  /v1/audio/video-to-audio/{id}

  Uses the most recent image2video task id (passed via env KLING_I2V_TASK_ID)
  or hardcoded from last run.

  Outputs:
    ~/Desktop/ugc-pipeline/projects/ugc/finasteride_study_v1/assets/scenes/
      scene_test_i2v_only__kling_audio.mp3
      scene_test_i2v_only__kling_audio.wav
      scene_test_i2v_only__kling_audio_video.mp4
*/

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

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
  return buf.length;
}

async function main(){
  await loadEnv();
  const AK=requireEnv('KLING_ACCESS_KEY');
  const SK=requireEnv('KLING_SECRET_KEY');
  const token=signJwtHS256({iss:AK,secret:SK});
  const AUTHZ=`Bearer ${token}`;
  const BASE=process.env.KLING_API_BASE||'https://api-singapore.klingai.com';

  const i2vTaskId = process.env.KLING_I2V_TASK_ID || '847722956884148264';

  // Query image2video task to get video_id
  const i2v = await httpJson(`${BASE}/v1/videos/image2video/${encodeURIComponent(i2vTaskId)}`, { method:'GET', headers:{Authorization:AUTHZ} });
  if(i2v?.data?.task_status !== 'succeed') throw Object.assign(new Error('image2video task not succeed yet'), { response: i2v });
  const vid = i2v?.data?.task_result?.videos?.[0];
  if(!vid?.id) throw new Error('Missing video id from image2video result');

  const sound_effect_prompt = (process.env.KLING_SFX_PROMPT ||
    'Subtle room tone and natural phone mic ambience: quiet HVAC hum, very faint outdoor wind, soft cloth rustle when he shifts, natural breathing, tiny camera handling noises. No loud SFX.').slice(0,200);

  const bgm_prompt = (process.env.KLING_BGM_PROMPT ||
    'Ambient background music, minimal and unobtrusive, warm soft pad, very low volume (~10%), gentle texture, no melody lead, no drums, no vocals, mixed under dialogue, plus light background noise for realism.').slice(0,200);

  const create = await httpJson(`${BASE}/v1/audio/video-to-audio`, {
    method:'POST',
    headers:{Authorization:AUTHZ},
    body:{
      video_id: vid.id,
      sound_effect_prompt,
      bgm_prompt,
      asmr_mode: false,
    }
  });

  const taskId = create?.data?.task_id;
  if(!taskId) throw new Error('No task_id returned from video-to-audio');

  let task;
  for(let i=0;i<120;i++){
    await sleep(3000);
    task = await httpJson(`${BASE}/v1/audio/video-to-audio/${encodeURIComponent(taskId)}`, { method:'GET', headers:{Authorization:AUTHZ} });
    const st = task?.data?.task_status;
    if(st==='succeed'||st==='failed') break;
  }

  if(task?.data?.task_status !== 'succeed') throw Object.assign(new Error('video-to-audio failed'), { response: task });

  const projRoot=path.join(process.env.HOME||'', 'Desktop/ugc-pipeline/projects/ugc/finasteride_study_v1');
  const outDir=path.join(projRoot,'assets/scenes');
  await fs.mkdir(outDir,{recursive:true});

  const outVideo = task?.data?.task_result?.videos?.[0]?.url;
  const outMp3 = task?.data?.task_result?.audios?.[0]?.url_mp3;
  const outWav = task?.data?.task_result?.audios?.[0]?.url_wav;

  const saved = {};
  if(outMp3) { saved.mp3 = path.join(outDir,'scene_test_i2v_only__kling_audio.mp3'); await download(outMp3, saved.mp3); }
  if(outWav) { saved.wav = path.join(outDir,'scene_test_i2v_only__kling_audio.wav'); await download(outWav, saved.wav); }
  if(outVideo) { saved.video = path.join(outDir,'scene_test_i2v_only__kling_audio_video.mp4'); await download(outVideo, saved.video); }

  console.log(JSON.stringify({ ok:true, i2v_task_id:i2vTaskId, video_id: vid.id, video_to_audio_task_id: taskId, saved }, null, 2));
}

main().catch((e)=>{ console.error(String(e)); if(e.response) console.error(JSON.stringify(e.response,null,2)); process.exit(1); });
