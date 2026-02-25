# Runbook — AI UGC Pack Webhook Pipeline v1

## Purpose
Generate hooks + script + scene prompts from a single webhook payload.

## Import
1. n8n → Workflows → Import from file.
2. Select `01_ai_ugc_webhook_pipeline.json`.
3. Save and activate when ready.

## Test Payload (POST)
```json
{
  "request_id": "order-002",
  "product_name": "Follicle Fuel Serum",
  "product_description": "Topical serum for men with thinning crown",
  "audience": "men 30-45 with thinning crown",
  "awareness_level": "cold",
  "pain_points": ["sticky products", "inconsistent results"],
  "mechanism": "targeted peptide blend for scalp support",
  "guarantee": "90-day satisfaction guarantee"
}
```

## Expected Output
- `hooks` (3)
- `selected_hook`
- `script` (hook/agitation/mechanism/proof/cta)
- `scenes` (5 prompt lines)
- `run_id`, `dedup_key`

## Hardening Before Scale
- Add persistent idempotency check using `dedup_key`.
- Add failure logging + notification workflow.
- Add human QA queue before publishing ad copy.
- Replace deterministic code nodes with LLM nodes for richer outputs.

## Notes
- This starter is intentionally runnable with no external credentials.
- Keep compliance review in the loop before launching paid ads.
