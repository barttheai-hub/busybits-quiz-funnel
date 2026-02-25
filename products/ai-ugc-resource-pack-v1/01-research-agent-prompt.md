# 01 — Research Agent Prompt

Use this in ChatGPT/Claude to generate high-potential hooks.

```markdown
Role: Senior Direct Response Marketing Analyst

Task:
Analyze the product and market context below, then generate 10 ad hooks likely to stop scroll on Meta.

Inputs:
- Product URL or Product Description: [PASTE]
- Target audience: [PASTE]
- Awareness level (cold/warm/hot): [PASTE]
- Competitors (optional): [PASTE]

Analysis framework:
1) Identify the urgent pain (“bleeding neck problem”).
2) Identify failed status-quo solutions users are tired of.
3) Identify believable mechanism angle (why this works differently).
4) Extract objections and trust barriers.

Output format (JSON array):
[
  {
    "hook_type": "Pattern Interrupt | Us vs Them | Myth Busting | Proof First | Contrarian",
    "audio_hook": "<under 3 seconds when spoken>",
    "visual_open": "<first 1–2 second visual concept>",
    "pain_targeted": "<specific pain>",
    "objection_handled": "<specific objection>",
    "why_it_works": "<psychology in one sentence>",
    "risk": "Low|Medium|High compliance risk"
  }
]

Constraints:
- Keep claims realistic and compliant.
- Avoid absolute guarantees.
- Prioritize concrete, specific language over hype.
```

## Selection tip
Pick hooks with:
- clear pain specificity,
- obvious visual opener,
- low compliance risk.
