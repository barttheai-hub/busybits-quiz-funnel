#!/usr/bin/env node
/*
  Create a NEW Kling custom voice from a sped-up (>10s) ElevenLabs sample,
  then run image2video using the SAME prompt as the previous "fast" run.

  Steps:
    1) Generate ElevenLabs MP3 (longer script)
    2) ffmpeg: atempo=1.5 (speed up), ensure duration >= 10s
    3) Upload to catbox
    4) POST /v1/general/custom-voices
    5) Poll GET /v1/general/custom-voices/{task_id} -> voice_id
    6) POST /v1/videos/image2video with sound:on + voice_list + <<<voice_1>>>

  Outputs:
    ~/Desktop/ugc-pipeline/projects/ugc/finasteride_study_v1/assets/audio/
      voice_sample_11labs_long.mp3
      voice_sample_11labs_long__1p5x.mp3
    ~/Desktop/ugc-pipeline/projects/ugc/finasteride_study_v1/assets/scenes/
      scene_test_i2v_with_kling_voice_fast__newvoice.mp4
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

async function elevenLabsTTSMp3({text,voiceId}){
  const XI=requireEnv('ELEVENLABS_API_KEY');
  const url=`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`;
  const res=await fetch(url,{
    method:'POST',
    headers:{'Content-Type':'application/json','xi-api-key':XI,Accept:'audio/mpeg'},
    body: JSON.stringify({text,model_id:process.env.ELEVENLABS_MODEL_ID||'eleven_monolingual_v1',voice_settings:{stability:0.45,similarity_boost:0.85}})
  });
  if(!res.ok) throw new Error(`ElevenLabs error ${res.status}: ${await res.text().catch(()=>"")}`);
  return Buffer.from(await res.arrayBuffer());
}

async function catboxUpload(filePath){
  const buf = await fs.readFile(filePath);
  const name = path.basename(filePath);
  const fd = new FormData();
  fd.append('reqtype','fileupload');
  fd.append('fileToUpload', new Blob([buf], { type: 'audio/mpeg' }), name);
  const res = await fetch('https://catbox.moe/user/api.php', { method:'POST', body: fd });
  const text = (await res.text()).trim();
  if(!res.ok) throw new Error(`catbox upload failed ${res.status}: ${text}`);
  if(!/^https?:\/\//.test(text)) throw new Error(`catbox upload unexpected response: ${text}`);
  return text;
}

async function ffprobeDurationSeconds(filePath){
  const { stdout } = await execFileAsync('ffprobe', ['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1', filePath]);
  return Number(String(stdout).trim());
}

async function main(){
  await loadEnv();

  const AK=requireEnv('KLING_ACCESS_KEY');
  const SK=requireEnv('KLING_SECRET_KEY');
  const token=signJwtHS256({iss:AK,secret:SK});
  const AUTHZ=`Bearer ${token}`;
  const BASE=process.env.KLING_API_BASE||'https://api-singapore.klingai.com';

  const projRoot=path.join(process.env.HOME||'', 'Desktop/ugc-pipeline/projects/ugc/finasteride_study_v1');
  const audioDir=path.join(projRoot,'assets/audio');
  const outDir=path.join(projRoot,'assets/scenes');
  const logDir=path.join(projRoot,'logs');
  await fs.mkdir(audioDir,{recursive:true});
  await fs.mkdir(outDir,{recursive:true});
  await fs.mkdir(logDir,{recursive:true});

  // 1) Longer script so that after 1.5x speed it remains >10s
  const voiceId=requireEnv('ELEVENLABS_VOICE_ID');
  const longText = process.env.LONG_VOICE_SAMPLE_TEXT ||
    'I took finasteride every day for eighteen months and my hair did not grow back, not even a little. If you are thinking about taking it, listen to this part carefully, because I wish someone had told me earlier.';

  const mp3 = await elevenLabsTTSMp3({text: longText, voiceId});
  const mp3Path = path.join(audioDir,'voice_sample_11labs_long.mp3');
  await fs.writeFile(mp3Path, mp3);

  // 2) Speed up 1.5x
  const spedPath = path.join(audioDir,'voice_sample_11labs_long__1p5x.mp3');
  await execFileAsync('ffmpeg', ['-hide_banner','-loglevel','error','-y','-i', mp3Path, '-filter:a','atempo=1.5', '-q:a','2', spedPath]);

  const dur = await ffprobeDurationSeconds(spedPath);
  if(!(dur >= 10 && dur <= 30)) {
    // If still too short, pad with silence to 10.5s (keeps speed characteristics).
    const padded = path.join(audioDir,'voice_sample_11labs_long__1p5x__padded.mp3');
    await execFileAsync('ffmpeg', ['-hide_banner','-loglevel','error','-y','-i', spedPath, '-filter:a','apad=pad_dur=11', '-t','11', '-q:a','2', padded]);
    await fs.rename(padded, spedPath);
  }

  const dur2 = await ffprobeDurationSeconds(spedPath);

  // 3) Upload
  const voiceUrl = await catboxUpload(spedPath);

  // 4) Create custom voice
  const voiceName = (`fin_fast_${Date.now()}`).slice(0,20);
  const create = await httpJson(`${BASE}/v1/general/custom-voices`, {
    method:'POST',
    headers:{Authorization:AUTHZ},
    body:{ voice_name: voiceName, voice_url: voiceUrl }
  });
  await fs.writeFile(path.join(logDir,'custom_voice_fast.create.json'), JSON.stringify({voiceUrl, dur: dur2, create}, null, 2));

  const voiceTaskId = create?.data?.task_id;
  if(!voiceTaskId) throw new Error('No task_id from custom-voices');

  let voiceTask;
  for(let i=0;i<140;i++){
    await sleep(3000);
    voiceTask = await httpJson(`${BASE}/v1/general/custom-voices/${encodeURIComponent(voiceTaskId)}`, { method:'GET', headers:{Authorization:AUTHZ} });
    if(voiceTask?.data?.task_status === 'succeed' || voiceTask?.data?.task_status === 'failed') break;
  }
  await fs.writeFile(path.join(logDir,'custom_voice_fast.poll.json'), JSON.stringify(voiceTask, null, 2));
  if(voiceTask?.data?.task_status !== 'succeed') throw Object.assign(new Error('Custom voice failed'), { response: voiceTask });

  const customVoiceId = voiceTask?.data?.task_result?.voices?.[0]?.voice_id;
  if(!customVoiceId) throw new Error('Missing voice_id');

  // 5) image2video with SAME prompt as previous fast run
  const imgPath=path.join(projRoot,'avatar/avatar_locked_9x16_v2_2k.png');
  const imgBuf=await fs.readFile(imgPath);

  const spoken = 'I took finasteride for eighteen months and my hair did not grow back, not even a little.';
  const prompt = [
    `The man <<<voice_1>>> said, ${spoken}`,
    'He speaks fast and punchy, like a TikTok hook, about 1.5x normal speed.',
    'Max pause between clauses or sentences is 0.5 seconds. No slow dramatic pauses.',
    'Tone: urgent and direct, slightly frustrated, confident. Natural casual English. Phone mic realism.',
    'Mouth movement follows speech closely. Natural blinks. Tiny head movement. Subtle handheld micro-shake.',
    'Raw iPhone selfie look, ungraded, realistic skin texture, no beauty filter, no uncanny artifacts.'
  ].join(' ');

  const negative = 'watermark, logo, text overlay, subtitles, UI, iphone status bar, camera interface, borders, frame, artifacts, beautify, smoothing, plastic skin, uncanny valley, deformed face, extra teeth, warped lips, cartoon, 3d render';

  const i2vCreate = await httpJson(`${BASE}/v1/videos/image2video`, {
    method:'POST',
    headers:{Authorization:AUTHZ},
    body:{
      model_name:'kling-v2-6',
      mode:'pro',
      duration:'10',
      aspect_ratio:'9:16',
      sound:'on',
      voice_list:[{voice_id: customVoiceId}],
      image: imgBuf.toString('base64'),
      prompt,
      negative_prompt: negative,
    }
  });

  await fs.writeFile(path.join(logDir,'i2v_with_newvoice.create.json'), JSON.stringify({customVoiceId, prompt, i2vCreate}, null, 2));
  const i2vTaskId = i2vCreate?.data?.task_id;
  if(!i2vTaskId) throw new Error('No task_id from image2video');

  let i2vTask;
  for(let i=0;i<160;i++){
    await sleep(3000);
    i2vTask = await httpJson(`${BASE}/v1/videos/image2video/${encodeURIComponent(i2vTaskId)}`, { method:'GET', headers:{Authorization:AUTHZ} });
    const st=i2vTask?.data?.task_status;
    if(st==='succeed'||st==='failed') break;
  }
  await fs.writeFile(path.join(logDir,'i2v_with_newvoice.poll.json'), JSON.stringify(i2vTask, null, 2));
  if(i2vTask?.data?.task_status !== 'succeed') throw Object.assign(new Error('image2video failed'), { response: i2vTask });

  const outVid=i2vTask?.data?.task_result?.videos?.[0];
  if(!outVid?.url) throw new Error('Missing output url');

  const outPath = path.join(outDir,'scene_test_i2v_with_kling_voice_fast__newvoice.mp4');
  await download(outVid.url, outPath);

  console.log(JSON.stringify({
    ok:true,
    sped_sample_duration_s: dur2,
    voice_sample_sped: spedPath,
    voice_sample_url: voiceUrl,
    custom_voice_task_id: voiceTaskId,
    custom_voice_id: customVoiceId,
    image2video_task_id: i2vTaskId,
    out_video: outPath
  }, null, 2));
}

main().catch((e)=>{ console.error(String(e)); if(e.response) console.error(JSON.stringify(e.response,null,2)); process.exit(1); });
