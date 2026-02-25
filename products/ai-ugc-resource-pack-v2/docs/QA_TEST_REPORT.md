# QA Test Report — AI UGC Resource Pack v2

Date: 2026-02-16
Scope: Overnight QA + hardening pass across workflows, prompts, and buyer docs.

## Executive Summary
Status: **GO (with noted limitations)**

The pack is now import-safe for n8n distribution, has stronger output-contract handling, safer export behavior, and clearer buyer-facing QA guidance. All markdown files in this pack now include the Calendly CTA line.

---
## 1) Workflow QA (8/8 reviewed)

### Import-safety checks completed
- JSON valid for all 8 workflows.
- No embedded API keys/secrets found.
- No `pinData` / `staticData` artifacts detected.
- Workflows remain `active: false` for safe import.
- Node IDs/names stable; filenames unchanged.

### Hardening fixes applied
1. **Structured output normalization** (`01,02,03,04,05,06,08`)
   - Updated `Format Output` code nodes to:
     - defensively read text/content payload variants,
     - parse JSON when returned as string,
     - return stable contract keys with safe defaults,
     - preserve `raw_result` for debugging.

2. **Export shell safety + path hygiene** (`07_export_job_folder`)
   - Added filename/job/path sanitization in `Prepare Export Payload`.
   - Restricted arbitrary base path to `/tmp` default policy.
   - Replaced heredoc shell write pattern with base64 payload + Python file writer (reduces command injection risk from content).
   - `Export Done` now parses writer result and reports files written.

---
## 2) Prompt Docs QA (avatar framing + compliance wording)

### Validated
- End-user avatar framing is explicit in `json_prompts_fixed_end_user_avatar.md`.
- Core script prompt includes compliance-safe constraints:
  - avoid cure/guaranteed/permanent claims,
  - use softeners (`may help`, `can support`, `results vary`),
  - include disclaimer near CTA.

### Notes
- Some hook libraries include “before/after” style language as a pattern reference. This is acceptable if operator still follows compliance filters and jurisdiction/platform policy.

---
## 3) Buyer-Ready QA Matrix

### Test Matrix

1) **01 Angle + Hook**
- Sample input:
```json
{"product":"Topical scalp serum","mechanism":"peptide + scalp massage","audience":"Men 28-45","claim_boundaries":"No cure or guaranteed regrowth; include results vary"}
```
- Expected output keys:
  - `output_type=angle_hook_pack`
  - `angles[]`, `top_pick`, `rationale`

2) **02 Script**
- Sample input: selected angle + product context
- Expected output keys:
  - `output_type=script_pack`
  - `script_30`, `script_45`, `script_60`, `cta_variants[]`, `compliance_safe_rewrites[]`

3) **03 Shotlist**
- Sample input: selected script
- Expected output keys:
  - `output_type=shotlist_pack`
  - `scenes[]`

4) **04 NanoBanana Prompts**
- Sample input: shotlist/scenes
- Expected output keys:
  - `output_type=nanobanana_prompt_pack`
  - `keyframes[]`, optional style/negative globals

5) **05 Sora/Kling Motion**
- Sample input: scenes
- Expected output keys:
  - `output_type=sora_kling_prompt_pack`
  - `scenes[]`, `sora_prompts[]`, `kling_prompts[]`, `cheap_mode_alts[]`

6) **06 Voiceover**
- Sample input: script
- Expected output keys:
  - `output_type=voiceover_pack`
  - `elevenlabs_script`, `pacing_notes[]`, `emphasis_map[]`, `takes[]`

7) **07 Export Job Folder**
- Sample input: brief/script/shotlist/prompts/manifests
- Expected output keys:
  - `output_type=export_result`
  - `status`, `folder`, `files_written[]`

8) **08 QC + Compliance**
- Sample input: script text
- Expected output keys:
  - `output_type=qc_compliance_checker`
  - `checklist[]`, `flagged_phrases[]`, `suggested_safe_rewrites[]`, `required_disclaimers_to_include[]`

---
## 4) Known Limitations
- LLM nodes may still occasionally return non-JSON prose under adverse prompting/model drift.
  - Mitigation: normalization layer now fails soft and preserves `raw_result`.
- Compliance logic is heuristic, not legal advice.
  - Human review still required pre-launch.
- Export workflow currently enforces `/tmp`-prefixed base path policy for safety.

---
## 5) Implementation Notes for Buyers
- Run workflows sequentially (`01 → 08`, with `07` at handoff stage).
- Keep a reusable compliance boundary string in your input templates.
- If an output parse issue appears, inspect `raw_result` and re-run with clearer constraints.
- Always run workflow `08` before publishing creative.

---
Need help implementing this for your offer and ad account? Book a 30-min working session: https://calendly.com/zbosneaks/30min
