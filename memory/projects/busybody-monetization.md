# BusyBody App - In-App Purchases & Monetization (Paywall CRO)

**Objective:** Maximize Free-to-Paid Conversion.
**Target ARPU:** $29/year (Lifetime Value).
**Strategy:** "The Painkiller" Paywall (Sell the solution, not the feature).

---

## 1. Pricing Strategy (Tiered)
*   **Monthly:** $4.99/mo (Anchor).
*   **Yearly:** $29.99/yr (Best Value - $2.50/mo).
*   **Lifetime:** $99.99 (Cash flow injection).

---

## 2. Paywall Design (The "No-Brainer" Offer)
**Headline:** "Automate Your Nutrition."
**Subheadline:** Save 5 hours/week.

**Feature Matrix (Free vs Pro):**

| Feature | Free | Pro (The Painkiller) |
| :--- | :--- | :--- |
| Food Logging | ✅ Manual Search | ✅ **AI Photo Scanner** (Snap & Log) |
| Macro Tracking | ✅ Basic Ring | ✅ **Advanced Analytics** (Weekly Trends) |
| Barcode Scanner | ❌ | ✅ **Unlimited Scans** |
| Custom Goals | ❌ | ✅ **Smart Adjustment** (Auto-updates) |
| Data Export | ❌ | ✅ **CSV / PDF** |

**The Hook:**
"Is your time worth more than $2.50/month? Upgrade to Pro and never type a food name again."

---

## 3. Paywall Triggers (Contextual)
Do not just show the paywall on launch. Show it when they hit a **friction point**.

1.  **The "AI Envy" Trigger:**
    *   User taps the "Camera" icon to log food.
    *   **Paywall:** "Unlock AI Food Scanner. Snap a photo, get the macros instantly."
    *   **Conversion Logic:** They *wanted* to use the camera. We gated it. High intent.

2.  **The "Barcode" Trigger:**
    *   User taps "Scan Barcode".
    *   **Paywall:** "Scan any package in seconds. Upgrade to Pro."

3.  **The "Trend" Trigger:**
    *   User swipes to the "Weekly Reports" tab.
    *   **Paywall:** "See your progress. Unlock weekly macro trends."

---

## 4. Win-Back Offer (Churn Reduction)
If user cancels the paywall X times:
**Offer:** "One-Time Offer: Get 12 Months for $19.99 (33% Off)."
**Timer:** 24 Hours.

---

## 5. Technical Implementation (RevenueCat)
*   **SDK:** RevenueCat (Standard for iOS/Flutter).
*   **Entitlement ID:** `pro_access`.
*   **Offerings:**
    *   `default` ($4.99/$29.99).
    *   `promo_30` (30% Off Launch).

## 6. App Store Screenshots (Pro Focus)
Slide 4 must explicitly show the **AI Scanner** in action with a "Pro" badge.
"Snap. Track. Done. (Pro Feature)."
