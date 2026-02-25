#!/usr/bin/env node
/*
  Generate ALL starting frames (NanoBanana Pro) for b-roll shots.
  Saves PNGs to:
    ~/Desktop/ugc-pipeline/projects/ugc/finasteride_study_v1/assets/tmp/starting_frames/

  No Kling calls (works even if Kling balance is 0).
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

async function nbImage({prompt, outPath}){
  const input={ prompt, num_images:1, aspect_ratio:'9:16' };
  const resp=await falRun('https://fal.run/fal-ai/nano-banana-pro', input);
  const img=(resp.images||resp.data?.images||[])[0];
  if(!img?.url) throw new Error('NanoBanana missing image url');
  await download(img.url, outPath);
  return { outPath, url: img.url, resp };
}

async function main(){
  await loadEnv();

  const projRoot=path.join(process.env.HOME||'', 'Desktop/ugc-pipeline/projects/ugc/finasteride_study_v1');
  const outDir=path.join(projRoot,'assets/tmp/starting_frames');
  await fs.mkdir(outDir,{recursive:true});

  const common = 'Raw handheld iPhone look, natural daylight or warm indoor light, realistic, ungraded, not cinematic, not AI-looking, no watermark, no UI overlays, no phone screen frame.';

  // B-roll starting frames. Use “before” (less hair) visuals where needed.
  const shots = [
    {
      id:'broll_hairline_ecu_before',
      prompt:`${common} Extreme close-up of a man\'s thinning hairline and sparse crown hair (clearly less hair), real skin texture, slight motion blur like a real phone camera still.`
    },
    {
      id:'broll_mirror_hand_before',
      prompt:`${common} Bathroom mirror moment: man runs hand through visibly thinning hair (before), slight messy realism, natural bathroom lighting, not posed.`
    },
    {
      id:'broll_imessage_josh',
      prompt:`${common} Close-up handheld shot of an iPhone showing Messages app: a text from \"Josh\" with a link preview. Natural screen glare and fingerprints. Authentic iOS look.`
    },
    {
      id:'broll_tap_link',
      prompt:`${common} Close-up of a thumb tapping a link on a phone screen. Slight blur, real screen reflections.`
    },
    {
      id:'broll_scroll_article',
      prompt:`${common} Handheld phone screen scrolling an article about finasteride and hair loss study, fast scroll, authentic glare.`
    },
    {
      id:'broll_doc_highlight_67',
      prompt:`${common} Fake-but-believable printed study page on a desk, highlighted text with \"67%\" clearly visible, photographed at a slight angle like a real phone pic.`
    },
    {
      id:'broll_diagram_tension',
      prompt:`${common} Simple diagram on paper: scalp tension compressing blood vessels. Looks like a quick medical sketch, photographed on desk.`
    },
    {
      id:'broll_diagram_oxygen',
      prompt:`${common} Simple diagram: follicle with low blood flow, label \"no oxygen\" / \"no nutrients\" in a handwritten style, photographed realistically.`
    },
    {
      id:'broll_scalp_massage',
      prompt:`${common} Close-up of hands massaging scalp/hairline in a bathroom mirror, authentic, slightly imperfect framing.`
    },
    {
      id:'broll_before_after_split',
      prompt:`${common} Before/after collage: left side clearly thinner hair (before), right side fuller hair (after). Looks like a real phone photo comparison.`
    },
    {
      id:'broll_phone_free_training',
      prompt:`${common} Handheld phone showing a simple landing page that says \"Free training\" with a play button / checklist. Realistic scrolling app/web view. No brand logos.`
    },
  ];

  const manifest=[];
  for(const s of shots){
    const outPath = path.join(outDir, `${s.id}.png`);
    const r = await nbImage({prompt:s.prompt, outPath});
    manifest.push({id:s.id, outPath:r.outPath, srcUrl:r.url, prompt:s.prompt});
    console.log(`OK ${s.id}`);
  }

  await fs.writeFile(path.join(outDir,'manifest.json'), JSON.stringify(manifest,null,2));
}

main().catch((e)=>{console.error(String(e)); if(e.response) console.error(JSON.stringify(e.response,null,2)); process.exit(1);});
