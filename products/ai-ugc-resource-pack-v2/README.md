# AI UGC Resource Pack v2 ($7)

This pack contains:

- `workflows/` → 8 n8n importable workflow templates
- `prompt-library/` → copy/paste prompt templates
- `templates/` → assets manifest + pipeline export templates
- `docs/HOW_TO_RUN.md` → 5-minute setup + 10 ads/day execution SOP + VA handoff

## Quick Start
1. Import workflows in order (`01` → `08`).
2. Set your credentials/env vars in n8n.
3. Start with `01_generate_angle_and_hook` (manual trigger).
4. Pass outputs to `02`..`06`.
5. Run `08_qc_and_compliance` before publish.
6. Run `07_export_job_folder` to generate delivery-ready folder artifacts.

## Suggested stack
- LLM: GPT-5/Codex or Claude Sonnet
- Frames: NanoBanana Pro
- Motion: Sora/Kling
- Voice: ElevenLabs

---
If you want help implementing this for your offer and ad account, you can also schedule a quick chat:
https://calendly.com/zbosneaks/30min
