#!/usr/bin/env node
/*
  Create Avatar A (thinning hair) + Avatar B (same person, ~30% improved hair)
  using NanoBanana Pro and NanoBanana Pro EDIT (img2img).

  Outputs:
    ~/Desktop/ugc-pipeline/projects/ugc/finasteride_study_v1/avatar/
      avatar_A_before_thinning_2k.png
      avatar_B_after_30pct_2k.png
*/

import fs from 'node:fs/promises';
import path from 'node:path';
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
async function download(url,outPath){
  const res=await fetch(url);
  if(!res.ok) throw new Error(`download failed ${res.status}`);
  const buf=Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outPath,buf);
}

async function uploadImgbb(filePath){
  const KEY='2d6ccab10231a4987dfa3c0685493e22';
  const buf=await fs.readFile(filePath);
  const fd = new FormData();
  fd.append('key', KEY);
  fd.append('image', buf.toString('base64'));
  const res = await fetch('https://api.imgbb.com/1/upload', { method:'POST', body: fd });
  const j = await res.json();
  return j?.data?.url;
}

async function upscale2k(inPath,outPath){
  await execFileAsync('ffmpeg', ['-hide_banner','-loglevel','error','-y','-i', inPath, '-vf', 'scale=2160:3840:flags=lanczos,unsharp=5:5:0.6:5:5:0.0', outPath]);
}

async function main(){
  await loadEnv();
  const projRoot=path.join(process.env.HOME||'', 'Desktop/ugc-pipeline/projects/ugc/finasteride_study_v1');
  const outDir=path.join(projRoot,'avatar');
  await fs.mkdir(outDir,{recursive:true});

  const global = [
    'Photorealistic raw iPhone selfie frame, vertical 9:16.',
    'Modern well-lit nice apartment interior, daylight, realistic.',
    'Male 30s with Mediterranean/Italian look, dark eyebrows, BLACK HAIR.',
    'Natural skin texture, slight under-eye circles, light stubble, plain dark hoodie.',
    'Average normal guy (not model), ungraded, authentic TikTok UGC.',
    'No watermark, no UI overlays, no phone frame, no text.'
  ].join(' ');

  // Avatar A: thinning hair
  const promptA = `${global} Hair: male pattern thinning at crown/top and slightly receding hairline. Not bald, but clearly thinning.`;
  const respA = await falRun('https://fal.run/fal-ai/nano-banana-pro', { prompt: promptA, num_images: 1, aspect_ratio: '9:16' });
  const imgA = (respA.images||respA.data?.images||[])[0];
  if(!imgA?.url) throw new Error('Avatar A missing url');
  const aRaw = path.join(outDir,'avatar_A_before_thinning.png');
  const a2k = path.join(outDir,'avatar_A_before_thinning_2k.png');
  await download(imgA.url, aRaw);
  await upscale2k(aRaw, a2k);

  // Upload A so we can use edit endpoint with image_urls
  const aUrl = await uploadImgbb(a2k);

  // Avatar B: edit A to +30% hair density, same face
  const editPrompt = [
    'Keep the EXACT same person, same face, same background, same lighting, same hoodie, same camera angle.',
    'Only change the hair: increase hair density about 30% on the top and crown, slightly better hairline, still realistic and still thinning.',
    'Do not beautify skin, do not change age/ethnicity. No text, no watermark.'
  ].join(' ');

  const respB = await falRun('https://fal.run/fal-ai/nano-banana-pro/edit', {
    prompt: editPrompt,
    image_urls: [aUrl],
  });
  const imgB = (respB.images||respB.data?.images||[])[0];
  if(!imgB?.url) throw new Error('Avatar B missing url');
  const bRaw = path.join(outDir,'avatar_B_after_30pct.png');
  const b2k = path.join(outDir,'avatar_B_after_30pct_2k.png');
  await download(imgB.url, bRaw);
  await upscale2k(bRaw, b2k);

  await fs.writeFile(path.join(outDir,'avatar_before_after_manifest.json'), JSON.stringify({promptA, editPrompt, a2k, aUrl, b2k, respA, respB}, null, 2));
  console.log(JSON.stringify({ ok:true, avatarA:a2k, avatarA_url:aUrl, avatarB:b2k }, null, 2));
}

main().catch((e)=>{console.error(String(e)); if(e.response) console.error(JSON.stringify(e.response,null,2)); process.exit(1);});
