#!/usr/bin/env node
/*
  Regenerate locked avatar still (9:16, 2K+) via NanoBanana Pro.
  Output:
    ~/Desktop/ugc-pipeline/projects/ugc/finasteride_study_v1/avatar/avatar_locked_9x16_italian_blackhair_2k.png
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

async function main(){
  await loadEnv();
  const projRoot=path.join(process.env.HOME||'', 'Desktop/ugc-pipeline/projects/ugc/finasteride_study_v1');
  const outPath=path.join(projRoot,'avatar/avatar_locked_9x16_italian_blackhair.png');
  const out2k=path.join(projRoot,'avatar/avatar_locked_9x16_italian_blackhair_2k.png');
  await fs.mkdir(path.dirname(outPath),{recursive:true});

  const prompt=[
    'Photorealistic raw iPhone selfie frame, vertical 9:16.',
    'Modern well-lit nice house interior (clean modern home office/living room), daylight, realistic.',
    'Male 30s, Italian look (Mediterranean features), dark eyebrows, BLACK HAIR, short haircut, light stubble.',
    'Natural skin texture, slight under-eye circles, plain dark hoodie, average normal guy (not model).',
    'Framing: chest-up, centered, looking into lens. Authentic TikTok UGC look, ungraded.',
    'No watermark, no UI overlays, no phone frame, no text, no subtitles.',
    'Avoid uncanny valley, avoid plastic skin, avoid over-sharp.'
  ].join(' ');

  const resp=await falRun('https://fal.run/fal-ai/nano-banana-pro', {prompt, num_images:1, aspect_ratio:'9:16'});
  const img=(resp.images||resp.data?.images||[])[0];
  if(!img?.url) throw new Error('missing image url');
  await download(img.url, outPath);

  // Upscale to 2160x3840 for 2K+ vertical master
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execFileAsync = promisify(execFile);
  await execFileAsync('ffmpeg', [
    '-hide_banner','-loglevel','error','-y',
    '-i', outPath,
    '-vf', 'scale=2160:3840:flags=lanczos,unsharp=5:5:0.6:5:5:0.0',
    out2k
  ]);

  await fs.writeFile(path.join(projRoot,'avatar/avatar_locked_9x16_italian_blackhair.json'), JSON.stringify({prompt, resp}, null, 2));
  console.log(out2k);
}

main().catch((e)=>{console.error(String(e)); if(e.response) console.error(JSON.stringify(e.response,null,2)); process.exit(1);});
