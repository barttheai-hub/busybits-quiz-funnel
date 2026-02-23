# ERRORS.md

## [ERR-20260205-001] pagespeedonline.googleapis.com

**Logged**: 2026-02-05T05:16:48Z
**Priority**: medium
**Status**: pending
**Area**: infra

### Summary
PageSpeed Insights API call failed due to quota/rate limit.

### Error
```
Web fetch failed (429): RESOURCE_EXHAUSTED: Quota exceeded for quota metric 'Queries' and limit 'Queries per day' of service 'pagespeedonline.googleapis.com'
```

### Context
- Attempted to use PSI API directly for busybody.io CWV audit.

### Suggested Fix
- Use alternative tools: Chrome Lighthouse via browser automation, or use a different PSI key/project with quota.

### Metadata
- Reproducible: yes
- Related Files: memory/overnight-2026-02-04.md
- Tags: seo, pagespeed, cwv, quota

---

## [ERR-20260220-001] nano-banana-pro

**Logged**: 2026-02-20T14:09:00Z
**Priority**: medium
**Status**: pending
**Area**: infra

### Summary
Nano Banana Pro image generation failed due to API quota exhaustion.

### Error
```
Error generating image: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'Resource has been exhausted (e.g. check quota).', 'status': 'RESOURCE_EXHAUSTED'}}
```

### Context
- Command: `uv run .../nano-banana-pro/scripts/generate_image.py`
- Prompt: "Close up of a 32 year old man looking fresh and calm..."
- Output file: `builds/social-ai-char/assets/mark_video4_clean.png`

### Suggested Fix
- Retry later or switch to a different key/project with available quota.
- Consider batching fewer simultaneous requests to reduce quota spikes.

### Metadata
- Reproducible: unknown
- Related Files: builds/social-ai-char/video_batch_2.md
- Tags: gemini, image, quota

---

## [ERR-20260223-001] mission-control-api-task-owner-validation

**Logged**: 2026-02-23T11:22:30Z
**Priority**: medium
**Status**: pending
**Area**: config

### Summary
Mission Control task creation failed because `owner` was set to unsupported value `Ziga`.

### Error
```
{"error":{"code":"REQUEST_ERROR","message":"owner must be one of: Me, OpenClaw"}}
```

### Context
- Operation: `POST /api/tasks`
- Payload used `owner: "Ziga"`
- API enforces owner enum values only

### Suggested Fix
Use `owner: "Me"` or `owner: "OpenClaw"` when creating tasks.

### Metadata
- Reproducible: yes
- Related Files: mission-control/API.md

---
