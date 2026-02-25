#!/usr/bin/env node
/*
  Generate a 3-environment anchor pack (NanoBanana Pro) for consistent b-roll.
  Outputs:
    ~/Desktop/ugc-pipeline/projects/ugc/finasteride_study_v1/assets/tmp/env_pack/
      env_01_office.png
      env_02_bathroom.png
      env_03_counter_trash.png
*/

import fs from 'node:fs/promises';
import path from 'node:path';

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
async function nb(prompt,outPath){
  const resp=await falRun('https://fal.run/fal-ai/nano-banana-pro', {prompt, num_images:1, aspect_ratio:'9:16'});
  const img=(resp.images||resp.data?.images||[])[0];
  if(!img?.url) throw new Error('missing image url');
  await download(img.url,outPath);
  return {outPath, url: img.url, prompt};
}

async function main(){
  await loadEnv();
  const projRoot=path.join(process.env.HOME||'', 'Desktop/ugc-pipeline/projects/ugc/finasteride_study_v1');
  const outDir=path.join(projRoot,'assets/tmp/env_pack');
  await fs.mkdir(outDir,{recursive:true});

  const global = [
    'Photorealistic raw iPhone frame, handheld, slight natural blur and noise, ungraded, authentic TikTok UGC.',
    'Same man identity across all images: male 32-38, natural skin texture, slight under-eye circles, plain dark hoodie, not model-like.',
    'No watermark, no UI overlays, no phone screen frame, no text.'
  ].join(' ');

  const env1 = `${global} Home office environment: bookshelf with mixed books, desk with a bit of clutter, window with daylight, neutral walls. Chest-up framing like a selfie video frame.`;
  const env2 = `${global} Bathroom environment: mirror, sink counter with realistic clutter (toothbrush, soap), warm bathroom lighting. The man is near the mirror, realistic.`;
  const env3 = `${global} Counter + trash environment: small trash can next to a counter (bathroom or kitchen), finasteride bottle nearby, realistic clutter, raw iPhone look.`;

  const m=[];
  m.push(await nb(env1, path.join(outDir,'env_01_office.png')));
  m.push(await nb(env2, path.join(outDir,'env_02_bathroom.png')));
  m.push(await nb(env3, path.join(outDir,'env_03_counter_trash.png')));
  await fs.writeFile(path.join(outDir,'manifest.json'), JSON.stringify(m,null,2));
  console.log(JSON.stringify(m,null,2));
}

main().catch((e)=>{console.error(String(e)); if(e.response) console.error(JSON.stringify(e.response,null,2)); process.exit(1);});
