# BusyBits — 14‑day sprint plan (3 experiments)

Assumption: ~95k subs; goal is open-rate lift + deliverability protection + more clicks.

## Experiment 1 — Subject line system (fast open-rate lift)
**Hypothesis:** A simple subject-line framework + A/B testing on engaged segment will lift overall opens.

**Setup (Day 1):**
- Segment: Engaged 30d (primary test pool)
- For each send, write 3 subject lines:
  1) Curiosity
  2) Benefit
  3) Contrarian
- A/B/C test to Engaged 30d (or smallest viable randomized slices). Roll winner to rest of list.

**Success metric:** +10–20% relative lift in open rate on test segment vs baseline.

## Experiment 2 — Cold 180d reactivation ladder (deliverability + list health)
**Hypothesis:** A 3-email ladder will recover a meaningful portion of cold subs and improve inbox placement by pruning the rest.

**Sequence (Day 2–6):**
1) Email #1: “Still want this?” — one-click keep me
2) Email #2: “Best of” — highest value compilation
3) Email #3: “Removing you tomorrow” — final confirm

**Rule:** If no open/click after #3 → suppress/remove.

**Success metrics:**
- Reactivation rate (opened or clicked) ≥ 5–10% of cold segment
- Spam complaint rate stays flat or improves

## Experiment 3 — Content template for clicks (CTOR lift)
**Hypothesis:** A consistent, skimmable template increases CTOR and sponsor value.

**Template (use Days 1–14):**
1) Hook (1–2 lines)
2) The idea (4–7 bullets)
3) 1 proof link
4) 1 action step
5) Optional sponsor slot

**Success metric:** +15% relative lift in CTOR on engaged segment.

---

## Day-by-day (lightweight)
- Day 1: Pick baseline metrics (opens, CTOR); write 3 subject lines for next send.
- Day 2: Launch reactivation Email #1 to Cold 180d+.
- Day 3: Regular send using template + A/B/C subject to Engaged 30d.
- Day 4: Reactivation Email #2.
- Day 5: Regular send using template + A/B/C subject.
- Day 6: Reactivation Email #3; suppress/remove non-responders after 24–48h.
- Day 7–14: Continue regular sends with template + subject A/B/C; compare metrics.

## Implementation notes (Beehiiv)
- Keep each email under ~150–250 words when possible.
- Use one primary CTA link.
- Add a tiny preference line for cold subs: “Want fewer emails? Click here for weekly only.”
