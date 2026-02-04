# finasteride_study_v1 — UGC pipeline (first pass)

## What this runner does
1. **Avatar reference pack** via fal.ai **Nano Banana Pro** (`fal-ai/nano-banana-pro`)
2. **Hook video** via fal.ai **Sora 2** (`fal-ai/sora-2/text-to-video`)
3. **Voiceover** via **ElevenLabs** TTS (mp3)
4. **Kling 2.6 lipsync**: **stub by default**; optional integration via `useapi.net`

Outputs are written to:
- `projects/ugc/finasteride_study_v1/assets/...`
- logs to `projects/ugc/finasteride_study_v1/logs/...`

## Setup
1. Copy env template:

```bash
cp projects/ugc/.env.example projects/ugc/.env
# then edit projects/ugc/.env
```

2. Run:

```bash
node projects/ugc/finasteride_study_v1/run.mjs
```

## Notes / limitations
- If `FAL_KEY` or `ELEVENLABS_API_KEY` are missing, the step will **stub** and still write manifests + logs.
- Kling step requires **public URLs** to your mp4/mp3 (upload to S3/R2/Supabase Storage etc.).
