#!/usr/bin/env node
/*
  Generate ONE base avatar clip from a single 9:16 locked avatar image,
  then lip-sync it with ElevenLabs audio.

  Kling flow:
    1) POST /v1/videos/image2video (model_name kling-v2-6)
    2) POST /v1/videos/identify-face
    3) POST /v1/videos/advanced-lip-sync
    4) GET  /v1/videos/advanced-lip-sync/{task_id}

  Outputs into Desktop pipeline:
    ~/Desktop/ugc-pipeline/projects/ugc/finasteride_study_v1/assets/scenes/
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

async function elevenLabsTTSMp3({text,voiceId}){
  const XI=requireEnv('ELEVENLABS_API_KEY');
  const url=`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`;
  const res=await fetch(url,{
    method:'POST',
    headers:{'Content-Type':'application/json','xi-api-key':XI,Accept:'audio/mpeg'},
    body: JSON.stringify({text,model_id:process.env.ELEVENLABS_MODEL_ID||'eleven_monolingual_v1',voice_settings:{stability:0.4,similarity_boost:0.8}})
  });
  if(!res.ok){ throw new Error(`ElevenLabs error ${res.status}: ${await res.text().catch(()=>"")}`); }
  return Buffer.from(await res.arrayBuffer());
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

  const projRoot=path.join(process.env.HOME||'', 'Desktop/ugc-pipeline/projects/ugc/finasteride_study_v1');
  const outDir=path.join(projRoot,'assets/scenes');
  const audioDir=path.join(projRoot,'assets/audio');
  await fs.mkdir(outDir,{recursive:true});
  await fs.mkdir(audioDir,{recursive:true});

  const imgPath=path.join(projRoot,'avatar/avatar_locked_9x16.png');
  const imgBuf=await fs.readFile(imgPath);
  const imgB64=imgBuf.toString('base64');

  // Base talking-head (no voice generation)
  const image2videoReq={
    model_name:'kling-v2-6',
    mode:'pro',
    duration:'5',
    sound:'off',
    image: imgB64,
    prompt:'Handheld iPhone selfie video in a normal home office. The same man (identity locked) looks into the camera with small natural head movements and blinks. Slight handheld micro-shake. Realistic, ungraded. No UI overlays, no borders, no watermark.',
    negative_prompt:'watermark, logo, text overlay, subtitles, UI, iphone status bar, camera interface, tabs, borders, frame, artifacts, beautify, plastic skin'
  };

  const create=await httpJson(`${BASE}/v1/videos/image2video`,{method:'POST',headers:{Authorization:AUTHZ},body:image2videoReq});
  const baseTaskId=create?.data?.task_id;
  if(!baseTaskId) throw new Error('No task_id from image2video');

  let baseTask;
  for(let i=0;i<80;i++){
    await sleep(3000);
    baseTask=await httpJson(`${BASE}/v1/videos/image2video/${encodeURIComponent(baseTaskId)}`,{method:'GET',headers:{Authorization:AUTHZ}});
    const st=baseTask?.data?.task_status;
    if(st==='succeed'||st==='failed') break;
  }
  if(baseTask?.data?.task_status!=='succeed') throw Object.assign(new Error('image2video failed'),{response:baseTask});

  const baseVideo=baseTask?.data?.task_result?.videos?.[0];
  if(!baseVideo?.id||!baseVideo?.url) throw new Error('Missing base video id/url');

  const baseOut=path.join(outDir,'avatar_base_9x16.mp4');
  await download(baseVideo.url, baseOut);

  // Identify face
  const identify=await httpJson(`${BASE}/v1/videos/identify-face`,{method:'POST',headers:{Authorization:AUTHZ},body:{video_id: baseVideo.id}});
  const sessionId=identify?.data?.session_id;
  const face=identify?.data?.face_data?.[0];
  if(!sessionId||!face?.face_id) throw new Error('Identify-face missing session/face');

  // ElevenLabs audio (use VO_SCRIPT if present)
  const voiceId=requireEnv('ELEVENLABS_VOICE_ID');
  const text = process.env.VO_SCRIPT || 'I took finasteride for a year and a half. Every single day. My hair did not grow back. Not even a little.';
  const mp3=await elevenLabsTTSMp3({text,voiceId});
  const mp3Path=path.join(audioDir,'scene_test_vo.mp3');
  await fs.writeFile(mp3Path, mp3);
  if(mp3.length>5*1024*1024) throw new Error('Audio too large (>5MB)');

  const vidMs=Math.floor(Number(baseVideo.duration||5)*1000);
  const safeEndMs=Math.max(2000, Math.min(vidMs-50, 4900));

  const lipCreate=await httpJson(`${BASE}/v1/videos/advanced-lip-sync`,{
    method:'POST',
    headers:{Authorization:AUTHZ},
    body:{
      session_id: sessionId,
      face_choose:[{
        face_id: face.face_id,
        sound_file: mp3.toString('base64'),
        sound_start_time: 0,
        sound_end_time: safeEndMs,
        sound_insert_time: 0,
        sound_volume: 1,
        original_audio_volume: 0
      }]
    }
  });

  const lipTaskId=lipCreate?.data?.task_id;
  if(!lipTaskId) throw new Error('No task_id from lip-sync');

  let lipTask;
  for(let i=0;i<100;i++){
    await sleep(3000);
    lipTask=await httpJson(`${BASE}/v1/videos/advanced-lip-sync/${encodeURIComponent(lipTaskId)}`,{method:'GET',headers:{Authorization:AUTHZ}});
    const st=lipTask?.data?.task_status;
    if(st==='succeed'||st==='failed') break;
  }
  if(lipTask?.data?.task_status!=='succeed') throw Object.assign(new Error('lip-sync failed'),{response:lipTask});

  const outVid=lipTask?.data?.task_result?.videos?.[0];
  if(!outVid?.url) throw new Error('No lip-sync url');

  const lipOut=path.join(outDir,'scene_test_lipsync.mp4');
  await download(outVid.url, lipOut);

  console.log(JSON.stringify({ok:true, base_video: baseOut, lipsync_video: lipOut},null,2));
}

main().catch((e)=>{console.error(String(e)); if(e.response) console.error(JSON.stringify(e.response,null,2)); process.exit(1);});
