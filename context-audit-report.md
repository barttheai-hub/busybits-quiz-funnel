# Context Window Issue Audit Report
**Date:** 2026-03-01
**Model:** moonshot/kimi-k2.5 (Kimi K2.5)
**Reported Issue:** "Context limit exceeded" error despite setting `reserveTokensFloor` to 30k

---

## Executive Summary

The error is occurring because **your config changes haven't been applied**. Your config still shows `reserveTokensFloor: 20000` (20k), not 30k. Additionally, there are deeper configuration issues with how Kimi K2.5's context window is being handled.

---

## Root Cause Analysis

### 1. Config Not Applied ❌

**Your current config shows:**
```json
"compaction": {
  "mode": "safeguard",
  "reserveTokensFloor": 20000,  ← Still 20k, not 30k!
  "memoryFlush": {
    "enabled": true,
    "softThresholdTokens": 15000
  }
}
```

**What you need to do:**
- After editing `openclaw.json`, you MUST restart OpenClaw: `openclaw gateway restart`
- Or use: `openclaw config apply` to validate and apply changes

---

### 2. Context Window Calculation Problem 🔍

**How OpenClaw calculates the threshold:**
```javascript
threshold = contextWindow - reserveTokens - softThreshold
```

**Current values:**
- `contextWindow`: 200,000 (DEFAULT_CONTEXT_TOKENS = 2e5)
- `reserveTokens`: 20,000
- `softThreshold`: 15,000
- **Effective threshold: 165,000 tokens**

**The issue:**
Kimi K2.5 has a 256K context window, but OpenClaw is using 200K as the default. This might not be the direct cause, but it reduces headroom.

---

### 3. The Real Culprit: Moonshot API Limits ⚠️

The error "Context limit exceeded" is coming **from Moonshot's API**, not OpenClaw's internal limits. The error detection pattern matches:
- "request_too_large"
- "context window"
- "context length exceeded"
- "maximum context length"
- "prompt is too long"
- "413 too large"

**Possible reasons Moonshot rejects the request:**
1. **Actual API limit < Advertised limit** — Moonshot may have a lower effective limit
2. **Max output tokens (8192) + Input tokens > 256K** — The total context includes both input AND output
3. **System prompt + Tools + Memory + Conversation > 256K** — Everything counts toward the limit
4. **Rate limiting disguised as context error** — Some providers return 413 when rate limited

---

### 4. Memory File Sizes 📊

**Your memory files are large:**
- `memory/2026-02-24.md`: 31,189 bytes (~7,800 tokens)
- `memory/Funnel_Structure_note.md`: 23,744 bytes (~5,900 tokens)
- `memory/2026-02-23.md`: 23,993 bytes (~6,000 tokens)
- **Total memory directory: 932KB** (~233,000 tokens if all loaded!)

**Problem:** AGENTS.md + SOUL.md + USER.md + MEMORY.md + HEARTBEAT.md = ~32KB (~8,000 tokens) loaded on EVERY request. Plus daily memory files may also be loaded.

---

## Recommended Fixes

### Immediate Actions (Do These Now)

#### 1. Update Config Properly
```bash
# Edit config to increase reserveTokensFloor
cat > /tmp/compaction-fix.json << 'EOF'
{
  "agents": {
    "defaults": {
      "compaction": {
        "mode": "safeguard",
        "reserveTokensFloor": 40000,
        "memoryFlush": {
          "enabled": true,
          "softThresholdTokens": 10000
        }
      }
    }
  }
}
EOF

# Apply the patch
openclaw gateway config.patch /tmp/compaction-fix.json

# Restart to ensure changes take effect
openclaw gateway restart
```

#### 2. Add Kimi K2.5 Context Window to Config
Your config is missing the explicit model definition. Add this:

```json
{
  "models": {
    "mode": "merge",
    "providers": {
      "moonshot": {
        "baseUrl": "https://api.moonshot.ai/v1",
        "apiKey": "${MOONSHOT_API_KEY}",
        "api": "openai-completions",
        "models": [
          {
            "id": "kimi-k2.5",
            "name": "Kimi K2.5",
            "reasoning": false,
            "input": ["text"],
            "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 },
            "contextWindow": 256000,
            "maxTokens": 8192
          }
        ]
      }
    }
  }
}
```

#### 3. Archive/Truncate Large Memory Files

Your memory files from February are massive. Archive old ones:

```bash
# Create archive directory
mkdir -p /Users/Ziga/.openclaw/workspace/memory/archive

# Move old large files (keep only last 3 days)
mv /Users/Ziga/.openclaw/workspace/memory/2026-02-24.md /Users/Ziga/.openclaw/workspace/memory/archive/
mv /Users/Ziga/.openclaw/workspace/memory/2026-02-23.md /Users/Ziga/.openclaw/workspace/memory/archive/
mv /Users/Ziga/.openclaw/workspace/memory/2026-02-22.md /Users/Ziga/.openclaw/workspace/memory/archive/ 2>/dev/null || true
```

#### 4. Enable Context Pruning (Already On ✅)

Your config already has this, which is good:
```json
"contextPruning": {
  "mode": "cache-ttl",
  "ttl": "1h"
}
```

#### 5. Use `/new` Command Regularly

When you hit context limits, use `/new` to start a fresh session. This clears conversation history.

---

### Alternative: Switch Models Temporarily

If Moonshot limits are the issue, switch to a different model:

```bash
# Use Groq's Llama 3.3 70B (128K context, very fast)
openclaw config --set agents.defaults.model.primary=groq/llama-3.3-70b-versatile

# Or use Together.ai's Kimi K2.5 (if Moonshot's endpoint is the problem)
openclaw config --set agents.defaults.model.primary=together/moonshotai/Kimi-K2.5
```

---

## Prevention Checklist

- [ ] **Restart OpenClaw after config changes** (`openclaw gateway restart`)
- [ ] **Set `reserveTokensFloor` to 40k** (not 30k) for 256K models
- [ ] **Add explicit model config** with correct `contextWindow: 256000`
- [ ] **Archive memory files > 7 days old** weekly
- [ ] **Use `/new` to reset sessions** when conversations get long
- [ ] **Monitor token usage** with `/status` command
- [ ] **Consider fallback models** if Moonshot limits persist

---

## The Error Message Explained

The error message suggests setting `reserveTokensFloor` to 4000+ because the **default** is much lower in some configurations. Your config already has 20k, but:

1. **The error isn't from OpenClaw's compaction** — it's from Moonshot's API rejecting the request
2. **The suggestion is generic** — it appears whenever context overflow is detected
3. **The real fix** is reducing input size OR increasing the buffer more aggressively

---

## Summary

| Issue | Status | Fix |
|-------|--------|-----|
| Config not applied | ❌ | Restart OpenClaw after changes |
| reserveTokensFloor at 20k | ⚠️ | Increase to 40k |
| Missing model contextWindow | ❌ | Add explicit 256000 config |
| Large memory files | ⚠️ | Archive files > 3 days old |
| Moonshot API limits | ❌ | May need fallback model |

**Most important:** After making config changes, run `openclaw gateway restart` to apply them.
