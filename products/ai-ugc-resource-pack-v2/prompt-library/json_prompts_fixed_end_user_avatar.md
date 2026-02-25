# JSON Prompts — Fixed (Target Avatar = END USER)

This pack uses `<enter Your Target Avatar HERE>` strictly as the **end user/customer profile** of the buyer’s product/service.

## Prompt 01 — Brief Intake → Creative Spec
```json
{
  "prompt_name": "01_brief_intake_to_creative_spec",
  "model_instruction": "You are a direct-response Meta UGC creative strategist. Output ONLY valid JSON. No markdown. No commentary.",
  "user_prompt": {
    "task": "Normalize the user's input into a clean Creative Spec for generating Meta-native UGC ads.",
    "inputs": {
      "product": "<ENTER YOUR PRODUCT HERE>",
      "offer": "<ENTER YOUR OFFER HERE>",
      "target_customer": "<ENTER YOUR TARGET CUSTOMER HERE>",
      "target_avatar_end_user": "<enter Your Target Avatar HERE>",
      "funnel_stage": "cold|warm|hot",
      "platform": "Meta (FB/IG)",
      "goal": "Purchase|Lead|BookCall",
      "compliance_boundaries": "<ENTER COMPLIANCE BOUNDARIES HERE>",
      "proof_assets_available": ["before_after_photos","ugc_testimonials","reviews_screenshots","clinical_studies","founder_story","none"],
      "brand_voice": "<ENTER BRAND VOICE HERE>"
    }
  }
}
```

## Prompt 02 — Hook Generator (ranked)
```json
{
  "prompt_name": "02_meta_hook_generator_ranked",
  "model_instruction": "You are a performance creative director for Meta. Output ONLY valid JSON. No markdown. Generate hooks that speak to the END USER avatar.",
  "user_prompt": {
    "task": "Generate and rank hooks for a Meta UGC ad.",
    "inputs": {
      "creative_spec": "<PASTE creative_spec JSON HERE>",
      "hook_required_text": "I’m going to generate a full UGC ad, that's a script + scenes + videos with AI in minutes."
    }
  }
}
```

## Prompt 03 — Script Generator (45s)
```json
{
  "prompt_name": "03_meta_ugc_script_generator_45s",
  "model_instruction": "You write high-converting Meta-native UGC ads. Output ONLY valid JSON. No markdown. Speak to the END USER avatar.",
  "user_prompt": {
    "task": "Write a 45-second UGC ad script that feels native to Meta.",
    "inputs": {
      "creative_spec": "<PASTE creative_spec JSON HERE>",
      "chosen_hook": "<PASTE chosen hook object HERE>",
      "ad_length_seconds": 45
    }
  }
}
```

## Prompt 04 — Shotlist Builder
Use your provided `04_scene_shotlist_builder` JSON from the corrected file.

## Prompt 05 — NanoBanana Keyframes
Use your provided `05_nanobanana_keyframes_prompt_pack` JSON from the corrected file.

## Prompt 06 — Sora/Kling Motion
Use your provided `06_sora_kling_motion_prompt_pack` JSON from the corrected file.

## Prompt 07 — ElevenLabs VO
Use your provided `07_elevenlabs_voice_pack` JSON from the corrected file.

## Prompt 08 — Export Job Folder Manifest
Use your provided `08_export_job_folder_manifest` JSON from the corrected file.
---
Need help implementing this for your offer and ad account? Book a 30-min working session: https://calendly.com/zbosneaks/30min

