#!/usr/bin/env node
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
function requireEnv(k){ const v=process.env[k]; if(!v) throw new Error('Missing env '+k); return v; }

async function falRun(endpointUrl,input){
  const key=requireEnv('FAL_KEY');
  const res=await fetch(endpointUrl,{
    method:'POST',
    headers:{'Content-Type':'application/json', Authorization:`Key ${key}`},
    body: JSON.stringify(input)
  });
  const txt=await res.text();
  let json; try{ json=JSON.parse(txt);}catch{ json={_non_json:txt}; }
  if(!res.ok){ const err=new Error(`fal error ${res.status}`); err.response=json; throw err; }
  return json;
}

async function download(url,outPath){
  const res=await fetch(url);
  if(!res.ok) throw new Error('download failed '+res.status);
  const buf=Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outPath,buf);
  return buf.length;
}

async function main(){
  await loadEnv();
  const outDir = path.join(process.env.HOME||'', 'Desktop/ugc-pipeline/projects/ugc/finasteride_study_v1/avatar');
  await fs.mkdir(outDir,{recursive:true});

  const prompt = process.env.AVATAR_9X16_PROMPT ||
    'Photorealistic raw iPhone selfie video frame (still image), male 32-38, noticeably sparse thinning hair across the top and crown (not fully bald), receding hairline, normal average-looking guy, natural skin texture, slight under-eye circles, plain dark hoodie, in a regular home office/living room, soft daylight from window, handheld iPhone feel, ungraded, realistic. No UI overlays, no borders, no phone screen frame, no watermarks, no text.';

  const input={ prompt, num_images:1, aspect_ratio:'9:16' };
  const resp=await falRun('https://fal.run/fal-ai/nano-banana-pro', input);
  const img=(resp.images||resp.data?.images||[])[0];
  if(!img?.url) throw new Error('No image url in response');
  const outPath=path.join(outDir,'avatar_locked_9x16.png');
  await download(img.url,outPath);
  await fs.writeFile(path.join(outDir,'avatar_locked_9x16.json'), JSON.stringify({prompt,input,resp},null,2));
  console.log(outPath);
}

main().catch((e)=>{ console.error(e); if(e.response) console.error(JSON.stringify(e.response,null,2)); process.exit(1);});
