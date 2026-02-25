# BusyBits — 3‑email reactivation ladder (Beehiiv-ready)

Target segment: Cold 180d+ (no opens/clicks).
Goal: re-activate or clean list to protect deliverability.

---

## Email 1 — “Still want this?” (one-click keep)
**Subject A:** Still want these?
**Subject B:** Quick check‑in
**Subject C:** Should I stop emailing you?

**Preheader:** One click and you’re in. No hard feelings if not.

**Body (paste):**
Hey — quick check.

Do you still want BusyBits?

- ✅ **Keep me subscribed**: {{KEEP_LINK}}
- 🛑 **Unsubscribe**: {{UNSUB_LINK}}

If you’re still in, I’ll keep sending the best fitness ideas in short, skimmable emails.

Ziga

---

## Email 2 — “Best of” (high value)
**Subject A:** Best of BusyBits (save this)
**Subject B:** 7 things that actually work
**Subject C:** If I could only send one email…

**Preheader:** Here’s the stuff worth keeping.

**Body (paste):**
If you’ve been out of the loop, no worries.

Here are 7 ideas I’d bet on:

1) {{IDEA_1}}
2) {{IDEA_2}}
3) {{IDEA_3}}
4) {{IDEA_4}}
5) {{IDEA_5}}
6) {{IDEA_6}}
7) {{IDEA_7}}

Want to keep getting these?
✅ {{KEEP_LINK}}

Ziga

---

## Email 3 — “Removing you tomorrow” (final)
**Subject A:** Removing you tomorrow
**Subject B:** Last email (unless you want this)
**Subject C:** Final check

**Preheader:** Click to stay.

**Body (paste):**
Last check — I don’t want to spam you.

If you want to stay subscribed, click here:
✅ {{KEEP_LINK}}

If not, no action needed — I’ll remove you.

Ziga

---

## Implementation notes
- Replace placeholders with Beehiiv links:
  - {{KEEP_LINK}} → link to a simple preference/confirm page (or a tracked link you treat as “keep”).
  - {{UNSUB_LINK}} → standard unsubscribe.
- Suppress/remove anyone who doesn’t open/click after Email 3 (after 24–48h).
