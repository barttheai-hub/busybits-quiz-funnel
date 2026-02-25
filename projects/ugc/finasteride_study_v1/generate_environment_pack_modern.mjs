#!/usr/bin/env node
/*
  Generate a 3-environment anchor pack (modern, well-lit) via NanoBanana Pro.
  Outputs:
    ~/Desktop/ugc-pipeline/projects/ugc/finasteride_study_v1/assets/tmp/env_pack_modern/
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
  const outDir=path.join(projRoot,'assets/tmp/env_pack_modern');
  await fs.mkdir(outDir,{recursive:true});

  const global = [
    'Photorealistic raw iPhone frame, handheld, slight natural blur and sensor noise, ungraded, authentic TikTok UGC.',
    'Modern nice house, well-lit, clean contemporary interior, daylight.',
    'Same man identity across all images: male 30s, Italian look (Mediterranean features), BLACK HAIR, short haircut, light stubble, plain dark hoodie, not model-like.',
    'No watermark, no UI overlays, no phone screen frame, no text.'
  ].join(' ');

  const env1 = `${global} Environment 1: modern home office corner with clean desk, minimalist bookshelf, large window daylight. Chest-up selfie framing.`;
  const env2 = `${global} Environment 2: modern bathroom with clean sink, mirror, subtle clutter (toothbrush, soap), warm-white lighting. The man near mirror.`;
  const env3 = `${global} Environment 3: modern kitchen/bath counter with small trash can nearby, finasteride bottle on counter, realistic casual clutter, well-lit.`;

  const m=[];
  m.push(await nb(env1, path.join(outDir,'env_01_modern_office.png')));
  m.push(await nb(env2, path.join(outDir,'env_02_modern_bathroom.png')));
  m.push(await nb(env3, path.join(outDir,'env_03_modern_counter_trash.png')));
  await fs.writeFile(path.join(outDir,'manifest.json'), JSON.stringify(m,null,2));
  console.log(JSON.stringify(m,null,2));
}

main().catch((e)=>{console.error(String(e)); if(e.response) console.error(JSON.stringify(e.response,null,2)); process.exit(1);});
