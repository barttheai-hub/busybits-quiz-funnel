#!/usr/bin/env node
/*
  Produce finasteride_study_v1 ad:
  - Generate b-roll stills via NanoBanana Pro (fal)
  - Animate b-roll via Kling image2video with sound=on (no voice_list)
  - Generate talking-head via Kling image2video with voice_list + <<<voice_1>>>
  - Apply cadence fix: speed 1.3x if needed (we apply to all talking clips for now)
  - Assemble into one timeline (concat).

  NOTE: This is a first-pass automated producer. It prioritizes:
    - correct file placement
    - consistent look
    - fast iteration
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

function requireEnv(k){ const v=process.env[k]; if(!v) throw new Error(`Missing env ${k}`); return v; }

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

async function falRun(endpointUrl,input){
  const key=requireEnv('FAL_KEY');
  const res=await fetch(endpointUrl,{
    method:'POST',
    headers:{'Content-Type':'application/json', Authorization:`Key ${key}`},
    body: JSON.stringify(input)
  });
  const txt=await res.text();
  let json; try{json=JSON.parse(txt);}catch{json={_non_json:txt};}
  if(!res.ok){ const err=new Error(`fal error ${res.status}`); err.response=json; throw err; }
  return json;
}

async function nbImage({prompt, outPath}){
  const input={ prompt, num_images:1, aspect_ratio:'9:16' };
  const resp=await falRun('https://fal.run/fal-ai/nano-banana-pro', input);
  const img=(resp.images||resp.data?.images||[])[0];
  if(!img?.url) throw new Error('NanoBanana missing image url');
  await download(img.url, outPath);
  return { resp, outPath };
}

async function klingImage2Video({AUTHZ, BASE, imagePath, outVideoPath, model_name='kling-v2-6', mode='pro', duration='5', aspect_ratio='9:16', sound='on', prompt, negative_prompt, voice_list}){
  const imgBuf=await fs.readFile(imagePath);
  const body={ model_name, mode, duration, aspect_ratio, sound, image: imgBuf.toString('base64'), prompt, negative_prompt };
  if(voice_list) body.voice_list = voice_list;

  const create = await httpJson(`${BASE}/v1/videos/image2video`, { method:'POST', headers:{Authorization:AUTHZ}, body });
  const taskId=create?.data?.task_id;
  if(!taskId) throw new Error('No task_id from image2video');

  let task;
  for(let i=0;i<160;i++){
    await sleep(3000);
    task = await httpJson(`${BASE}/v1/videos/image2video/${encodeURIComponent(taskId)}`, { method:'GET', headers:{Authorization:AUTHZ} });
    const st=task?.data?.task_status;
    if(st==='succeed'||st==='failed') break;
  }
  if(task?.data?.task_status!=='succeed') throw Object.assign(new Error('image2video failed'), { response: task });
  const vid=task?.data?.task_result?.videos?.[0];
  if(!vid?.url) throw new Error('Missing output url');
  await download(vid.url, outVideoPath);
  return { taskId, outVideoPath };
}

async function speedVideo({inPath, outPath, speed=1.3}){
  // speed up both video+audio
  await execFileAsync('ffmpeg', ['-hide_banner','-loglevel','error','-y','-i', inPath,
    '-filter_complex', `[0:v]setpts=PTS/${speed}[v];[0:a]atempo=${speed}[a]`,
    '-map','[v]','-map','[a]',
    '-movflags','+faststart', outPath
  ]);
}

async function trimVideo({inPath, outPath, start=0, dur=1.0}){
  await execFileAsync('ffmpeg', ['-hide_banner','-loglevel','error','-y','-ss', String(start), '-i', inPath, '-t', String(dur),
    '-c:v','libx264','-preset','veryfast','-crf','20',
    '-c:a','aac','-b:a','128k',
    '-movflags','+faststart', outPath
  ]);
}

async function concatVideos({inputs, outPath}){
  const listPath = outPath.replace(/\.mp4$/,'') + '.txt';
  const lines = inputs.map(p=>`file '${p.replace(/'/g,"'\\''")}'`).join('\n') + '\n';
  await fs.writeFile(listPath, lines);
  await execFileAsync('ffmpeg', ['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i', listPath,
    '-c','copy', outPath
  ]);
}

async function main(){
  await loadEnv();
  const AK=requireEnv('KLING_ACCESS_KEY');
  const SK=requireEnv('KLING_SECRET_KEY');
  const token=signJwtHS256({iss:AK,secret:SK});
  const AUTHZ=`Bearer ${token}`;
  const BASE=process.env.KLING_API_BASE||'https://api-singapore.klingai.com';

  const projRoot=path.join(process.env.HOME||'', 'Desktop/ugc-pipeline/projects/ugc/finasteride_study_v1');
  const scenesDir=path.join(projRoot,'assets/scenes');
  const rendersDir=path.join(projRoot,'renders');
  const tmpDir=path.join(projRoot,'assets/tmp');
  await fs.mkdir(scenesDir,{recursive:true});
  await fs.mkdir(rendersDir,{recursive:true});
  await fs.mkdir(tmpDir,{recursive:true});

  const avatarImg = path.join(projRoot,'avatar/avatar_locked_9x16_v2_2k.png');
  const voiceId = process.env.KLING_CUSTOM_VOICE_ID || '847736169546399831'; // good voice id

  const NEG = 'watermark, logo, text overlay, subtitles, UI, iphone status bar, camera interface, borders, frame, artifacts, beautify, smoothing, plastic skin, uncanny valley, deformed face, extra teeth, warped lips, cartoon, 3d render';

  // --- TALKING CLIPS (first pass: 3 main beats)
  const talking = [
    { id:'talk_setup_01', duration:'10', spoken:'I took finasteride for a year and a half. Every single day. My hair did not grow back. Not even a little.' },
    { id:'talk_edu_03', duration:'10', spoken:'Finasteride blocks D H T. But it does not fix blood flow. That is why it fails for most guys. You are treating the symptom, not the cause.' },
    { id:'talk_cta', duration:'10', spoken:'If you want the full breakdown of this study, why finasteride fails, and what actually works to regrow hair, I put a link below. Free training.' },
  ];

  const talkingOut = [];
  for(const t of talking){
    const out = path.join(tmpDir, `${t.id}.mp4`);
    const prompt = `The man <<<voice_1>>> said, ${t.spoken} He speaks casual English, direct and natural, max 0.5 seconds pause between sentences. Raw iPhone selfie video, realistic skin texture, subtle head movement and blinks, slight handheld micro-shake.`;
    const r = await klingImage2Video({AUTHZ, BASE, imagePath: avatarImg, outVideoPath: out, duration: t.duration, sound:'on', mode:'pro', aspect_ratio:'9:16', prompt, negative_prompt: NEG, voice_list:[{voice_id: voiceId}]});
    const sped = path.join(scenesDir, `${t.id}__1p3x.mp4`);
    await speedVideo({inPath: r.outVideoPath, outPath: sped, speed:1.3});
    talkingOut.push(sped);
  }

  // --- BROLL STILL -> KLING (no voice_list)
  const broll = [
    { id:'broll_hairline_ecu', promptImg:'Extreme close-up of a thinning male hairline and sparse crown hair, shot on iPhone, raw handheld, natural daylight, realistic skin texture, not AI, not cinematic.' , promptVid:'Handheld iPhone close-up of thinning hairline. Subtle camera micro-shake. Ambient room tone only: faint HVAC, tiny cloth rustle. No speech.' },
    { id:'broll_mirror_hand', promptImg:'Bathroom mirror selfie style frame: man runs hand through visibly thinning hair, raw iPhone look, realistic, natural bathroom lighting, not polished.' , promptVid:'Bathroom mirror moment. Hand runs through thin hair. Natural bathroom reverb, faint water pipe hum, soft movement sounds. No speech.' },
    { id:'broll_imessage', promptImg:'Close-up of iPhone Messages app showing a text from "Josh" with a link preview, realistic iOS style but no brand logos emphasized, natural screen glare, shot handheld.' , promptVid:'Handheld phone shot of iMessage from Josh with a link. Subtle tap sound, tiny finger swipe, quiet room tone. No speech.' },
    { id:'broll_doc_67', promptImg:'Fake-but-believable study screenshot with highlighted text "67%" and a short line about finasteride not working, photographed on a phone, slightly skewed, realistic paper texture.' , promptVid:'Quick study highlight shot. Paper rustle, marker squeak faint, quiet room tone. No speech.' },
    { id:'broll_diagram_tension', promptImg:'Simple diagram illustration: scalp tension compressing blood vessels, clean minimal, looks like a note in a document, photographed on phone.' , promptVid:'Simple diagram shot. Quiet room tone, subtle paper movement. No speech.' },
    { id:'broll_beforeafter', promptImg:'Before/after split image of a man’s hair: left thinning crown, right fuller hair, realistic iPhone photo montage style.' , promptVid:'Before-after montage with slight zoom-in. Subtle whoosh, quiet ambience. No speech.' },
  ];

  const broll1s = [];
  for(const b of broll){
    const imgOut = path.join(tmpDir, `${b.id}.png`);
    await nbImage({prompt: b.promptImg, outPath: imgOut});
    const vidOut = path.join(tmpDir, `${b.id}.mp4`);
    await klingImage2Video({AUTHZ, BASE, imagePath: imgOut, outVideoPath: vidOut, duration:'5', sound:'on', mode:'pro', aspect_ratio:'9:16', prompt: b.promptVid, negative_prompt: NEG});
    const oneSec = path.join(scenesDir, `${b.id}__1s.mp4`);
    await trimVideo({inPath: vidOut, outPath: oneSec, start:0, dur:1.0});
    broll1s.push(oneSec);
  }

  // --- Hook: for now reuse existing hook from script later; placeholder: first broll as hook
  // We'll build a rough cut: hook (broll_beforeafter 1s repeated) + talk + broll bursts + talk + broll + cta
  const sequence = [
    broll1s[0], broll1s[1], broll1s[2], // quick open (placeholder)
    talkingOut[0],
    broll1s[0], broll1s[1], broll1s[3],
    talkingOut[1],
    broll1s[4], broll1s[3], broll1s[5],
    talkingOut[2],
    broll1s[2], broll1s[5]
  ];

  const outFinal = path.join(rendersDir, 'finasteride_study_v1_roughcut_v1.mp4');
  await concatVideos({inputs: sequence, outPath: outFinal});

  console.log(JSON.stringify({ok:true, outFinal, talkingOut, broll1s}, null, 2));
}

main().catch((e)=>{ console.error(String(e)); if(e.response) console.error(JSON.stringify(e.response,null,2)); process.exit(1); });
