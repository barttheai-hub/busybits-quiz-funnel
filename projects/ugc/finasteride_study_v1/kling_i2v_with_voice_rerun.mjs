#!/usr/bin/env node
/*
  Re-run Kling image2video with built-in voice generation (NO custom voice creation).
  Uses an existing custom voice_id (from /v1/general/custom-voices).

  Required env:
    KLING_ACCESS_KEY
    KLING_SECRET_KEY
    KLING_CUSTOM_VOICE_ID

  Uses avatar:
    ~/Desktop/ugc-pipeline/projects/ugc/finasteride_study_v1/avatar/avatar_locked_9x16_v2_2k.png

  Output:
    ~/Desktop/ugc-pipeline/projects/ugc/finasteride_study_v1/assets/scenes/scene_test_i2v_with_kling_voice_v2.mp4
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
}

async function main(){
  await loadEnv();

  const AK=requireEnv('KLING_ACCESS_KEY');
  const SK=requireEnv('KLING_SECRET_KEY');
  const customVoiceId=requireEnv('KLING_CUSTOM_VOICE_ID');

  const token=signJwtHS256({iss:AK,secret:SK});
  const AUTHZ=`Bearer ${token}`;
  const BASE=process.env.KLING_API_BASE||'https://api-singapore.klingai.com';

  const projRoot=path.join(process.env.HOME||'', 'Desktop/ugc-pipeline/projects/ugc/finasteride_study_v1');
  const outDir=path.join(projRoot,'assets/scenes');
  const logDir=path.join(projRoot,'logs');
  await fs.mkdir(outDir,{recursive:true});
  await fs.mkdir(logDir,{recursive:true});

  const imgPath=path.join(projRoot,'avatar/avatar_locked_9x16_v2_2k.png');
  const imgBuf=await fs.readFile(imgPath);

  // Keep speech comfortably <10s and avoid punctuation that introduces long pauses.
  const spoken = 'I took finasteride for eighteen months and my hair did not grow back, not even a little.';

  // Keep grammar simple where the voice tag appears.
  const prompt = [
    `The man <<<voice_1>>> said, ${spoken}`,
    'He speaks in natural casual English, normal phone mic, slightly tired but serious, no dramatic pauses.',
    'Subtle mouth movement synced to speech, natural blinks, tiny head movement, natural breathing.',
    'Handheld iPhone selfie video, raw UGC, slight exposure breathing, no beauty filter, realistic skin texture.',
    'No cinematic camera moves, no zoom jumps, just slight handheld micro-shake.'
  ].join(' ');

  const negative = 'watermark, logo, text overlay, subtitles, UI, iphone status bar, camera interface, borders, frame, artifacts, beautify, smoothing, plastic skin, uncanny valley, deformed face, extra teeth, warped lips, cartoon, 3d render';

  const body={
    model_name:'kling-v2-6',
    mode:'pro',
    duration:'10',
    aspect_ratio:'9:16',
    sound:'on',
    voice_list:[{voice_id: customVoiceId}],
    image: imgBuf.toString('base64'),
    prompt,
    negative_prompt: negative,
  };

  const create = await httpJson(`${BASE}/v1/videos/image2video`, { method:'POST', headers:{Authorization:AUTHZ}, body });
  await fs.writeFile(path.join(logDir,'i2v_with_voice_v2.create.json'), JSON.stringify({body, create}, null, 2));

  const taskId=create?.data?.task_id;
  if(!taskId) throw new Error('No task_id from image2video');

  let task;
  for(let i=0;i<140;i++){
    await sleep(3000);
    task = await httpJson(`${BASE}/v1/videos/image2video/${encodeURIComponent(taskId)}`, { method:'GET', headers:{Authorization:AUTHZ} });
    const st=task?.data?.task_status;
    if(st==='succeed'||st==='failed') break;
  }
  await fs.writeFile(path.join(logDir,'i2v_with_voice_v2.poll.json'), JSON.stringify(task, null, 2));
  if(task?.data?.task_status!=='succeed') throw Object.assign(new Error('image2video failed'), { response: task });

  const outVid=task?.data?.task_result?.videos?.[0];
  if(!outVid?.url) throw new Error('Missing output url');

  const outPath=path.join(outDir,'scene_test_i2v_with_kling_voice_v2.mp4');
  await download(outVid.url, outPath);

  console.log(JSON.stringify({ok:true, task_id: taskId, out_video: outPath, prompt}, null, 2));
}

main().catch((e)=>{ console.error(String(e)); if(e.response) console.error(JSON.stringify(e.response,null,2)); process.exit(1); });
