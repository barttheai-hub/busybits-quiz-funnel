#!/usr/bin/env node
/*
  Generate revised NanoBanana starting frames (v2) based on Ziga feedback.
  - No phone UI
  - No AI study pages
  - Uses Avatar A/B as reference via nano-banana-pro/edit

  Output dir:
    ~/Desktop/ugc-pipeline/projects/ugc/finasteride_study_v1/assets/tmp/starting_frames_v2/
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

import { spawn } from 'node:child_process';

function run(cmd, args, { cwd, env } = {}){
  return new Promise((resolve, reject)=>{
    const p = spawn(cmd, args, {
      cwd,
      env: { ...process.env, ...(env||{}) },
      stdio: ['ignore','pipe','pipe']
    });
    let out='';
    let err='';
    p.stdout.on('data', (d)=> out += d.toString());
    p.stderr.on('data', (d)=> err += d.toString());
    p.on('error', reject);
    p.on('close', (code)=>{
      if(code===0) resolve({ out, err });
      else reject(new Error(`Command failed (${code}): ${cmd} ${args.join(' ')}\n${err||out}`));
    });
  });
}

function nanoBananaSkillDir(){
  // Installed with OpenClaw; stable path on this machine.
  return '/Users/Ziga/.npm-global/lib/node_modules/openclaw/skills/nano-banana-pro';
}

async function nbGenerate({ prompt, outPath, inputs = [], resolution = '2K' }){
  requireEnv('GEMINI_API_KEY');
  const skillDir = nanoBananaSkillDir();
  const script = path.join(skillDir, 'scripts/generate_image.py');
  const args = ['run', script, '--prompt', prompt, '--filename', outPath, '--resolution', resolution];
  for(const imgPath of inputs) args.push('-i', imgPath);
  await run('uv', args, { cwd: skillDir });
  return { outPath, prompt, inputs };
}

async function nbText2Img({ prompt, outPath }){
  return nbGenerate({ prompt, outPath, inputs: [], resolution: '2K' });
}

async function nbEdit({ inputPaths, prompt, outPath }){
  return nbGenerate({ prompt, outPath, inputs: inputPaths, resolution: '2K' });
}

async function main(){
  await loadEnv();

  const projRoot=path.join(process.env.HOME||'', 'Desktop/ugc-pipeline/projects/ugc/finasteride_study_v1');
  const outDir=path.join(projRoot,'assets/tmp/starting_frames_v2');
  await fs.mkdir(outDir,{recursive:true});

  const avatarAPath=path.join(projRoot,'avatar/avatar_A_before_thinning_2k.png');
  const avatarBPath=path.join(projRoot,'avatar/avatar_B_after_30pct_2k.png');
  const env1=path.join(projRoot,'assets/tmp/env_pack_no_avatar/env_01_modern_office_no_avatar.png');
  const env2=path.join(projRoot,'assets/tmp/env_pack_no_avatar/env_02_modern_bathroom_no_avatar.png');
  const env3=path.join(projRoot,'assets/tmp/env_pack_no_avatar/env_03_modern_counter_trash_no_avatar.png');

  const global = [
    'Photorealistic raw iPhone frame, handheld, slight natural blur and sensor noise, ungraded, authentic TikTok UGC.',
    'Modern well-lit apartment interior, clean contemporary vibe.',
    'No watermark, no UI overlays, no phone screen frame, no text.'
  ].join(' ');

  const manifest=[];

  // BEFORE shots (Avatar A) — bathroom env
  manifest.push(await nbEdit({
    inputPaths: [avatarAPath, env2],
    prompt: `${global} Keep EXACT same person identity and face. Place him in a modern bathroom like the reference image (same lighting/vibe). Close-up mirror-style shot focusing on thinning hairline. Hands not visible.`,
    outPath: path.join(outDir,'before_01_mirror_hairline.png')
  }));
  manifest.push(await nbEdit({
    inputPaths: [avatarAPath, env2],
    prompt: `${global} Keep EXACT same person identity and face. Close-up top/crown angle showing thinning crown with visible scalp. Bathroom lighting. Hands not visible.`,
    outPath: path.join(outDir,'before_02_crown_closeup.png')
  }));

  // TRY shots (Avatar A)
  manifest.push(await nbEdit({
    inputPaths: [avatarAPath, env3],
    prompt: `${global} Keep same person. In a modern kitchen/bath counter environment like the reference. Show a finasteride bottle on the counter in foreground (generic, no brand logos). The man looks tired/frustrated. Hands not visible.`,
    outPath: path.join(outDir,'try_01_finasteride.png')
  }));
  manifest.push(await nbEdit({
    inputPaths: [avatarAPath, env3],
    prompt: `${global} Keep same person. Show a minoxidil bottle on the counter (generic, no brand logos). Authentic iPhone photo look. Hands not visible.`,
    outPath: path.join(outDir,'try_02_minoxidil.png')
  }));
  manifest.push(await nbEdit({
    inputPaths: [avatarAPath, env3],
    prompt: `${global} Keep same person. Show a dermaroller (microneedling roller) on the bathroom counter. Authentic iPhone photo. Hands not visible.`,
    outPath: path.join(outDir,'try_03_microneedling.png')
  }));
  manifest.push(await nbEdit({
    inputPaths: [avatarAPath],
    prompt: `${global} Keep same person. In a realistic clinic waiting room or exam room. Add subtle medical context (no logos). Imply PRP/plasma injections with a small tray of syringes/vials in background (not graphic). Hands not visible.`,
    outPath: path.join(outDir,'try_04_prp_clinic.png')
  }));

  // Root-cause diagrams (no avatar)
  manifest.push(await nbText2Img({
    prompt: `${global} Macro medical illustration of a hair follicle cross-section, realistic textbook look, not vector-y, photographed on paper on a desk.`,
    outPath: path.join(outDir,'diagram_01_follicle.png')
  }));
  manifest.push(await nbText2Img({
    prompt: `${global} Simple realistic diagram: scalp tension compressing blood vessels feeding follicles. Looks like a photo of a printed diagram on paper, slight skew, real desk.`,
    outPath: path.join(outDir,'diagram_02_tension_vessels.png')
  }));
  manifest.push(await nbText2Img({
    prompt: `${global} Simple realistic diagram: reduced blood flow leads to low oxygen (hypoxia) and nutrient shortage at follicle. Printed paper photo style, not clean vector.`,
    outPath: path.join(outDir,'diagram_03_hypoxia.png')
  }));
  manifest.push(await nbText2Img({
    prompt: `${global} Simple 3-step diagram: follicle miniaturization over time. Printed paper photo style.`,
    outPath: path.join(outDir,'diagram_04_miniaturization.png')
  }));

  // AFTER shots (Avatar B)
  manifest.push(await nbEdit({
    inputPaths: [avatarBPath, env1],
    prompt: `${global} Keep exact same person. Modern office/living room background like reference. Talking-head selfie frame, calm but confident. Hands not visible.`,
    outPath: path.join(outDir,'after_01_talking.png')
  }));
  manifest.push(await nbEdit({
    inputPaths: [avatarBPath, env1],
    prompt: `${global} Keep same person. Side angle hairline shot showing improved density vs before but still realistic. Hands not visible.`,
    outPath: path.join(outDir,'after_02_hairline_angle.png')
  }));

  // BEFORE/AFTER split (plain, no phone frame)
  manifest.push(await nbText2Img({
    prompt: `${global} Plain split-screen before/after collage, no phone frame: left shows thinner hair (before), right shows slightly fuller hair (after). Looks like two real iPhone photos side-by-side.`,
    outPath: path.join(outDir,'before_after_split.png')
  }));

  // CTA support
  manifest.push(await nbText2Img({
    prompt: `${global} Clean modern living room/office background with empty space for text overlay, no people.`,
    outPath: path.join(outDir,'cta_01_endframe_bg.png')
  }));
  manifest.push(await nbEdit({
    inputPaths: [avatarBPath, env1],
    prompt: `${global} Keep same person. Modern office background. The man points down with one hand (gesture), no phone, hand visible pointing down, authentic selfie framing.`,
    outPath: path.join(outDir,'cta_02_point_down.png')
  }));

  await fs.writeFile(path.join(outDir,'manifest.json'), JSON.stringify({ items:manifest }, null, 2));
  console.log('DONE', outDir);
}

main().catch((e)=>{console.error(String(e)); if(e.response) console.error(JSON.stringify(e.response,null,2)); process.exit(1);});
