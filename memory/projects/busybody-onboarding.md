# BusyBody App - Onboarding & Activation Strategy

**Objective:** Convert "Install" to "Active User" (First Meal Logged) in <60 seconds.
**Metric:** Activation Rate (Installs / First Log).
**Philosophy:** "Speed to Value". Don't ask 20 questions. Ask 3, give value, then ask more later.

---

## 1. The Flow Overview
1.  **Splash:** Hook (Speed).
2.  **Calorie Calc (3 Qs):** Gender/Weight/Goal.
3.  **The "Reveal":** Show their Daily Target (Value).
4.  **Commitment:** "Day 1 starts now."
5.  **Permissions:** Notifications (Primed).
6.  **Tutorial:** "Log your breakfast" (The Aha Moment).

---

## 2. Screen-by-Screen Copy

### Screen 1: Splash / Welcome
**Visual:** Clean logo, minimal background.
**Headline:** Stop fighting with your food tracker.
**Subhead:** BusyBody helps you log meals in seconds, not minutes.
**Button:** [Get Started]

### Screen 2: The Calculator (Input)
**Headline:** Let's set your baseline.
**Input Fields:**
-   **Gender:** Male / Female
-   **Current Weight:** [ Input ] lbs/kg
-   **Goal:** [ Lose Fat ] [ Maintain ] [ Build Muscle ]
**Button:** [Calculate Targets]
*Note: Skip height/age for now. Use averages. We can refine later in settings. Speed is key.*

### Screen 3: The Reveal (Value)
**Visual:** Large, animated number counting up.
**Headline:** Your Daily Fuel.
**Big Text:** **2,450 kcal**
**Subtext:** Protein: 180g • Carbs: 250g • Fats: 80g
**Copy:** "Hit these numbers, and you *will* reach your goal."
**Button:** [Save My Plan]

### Screen 4: Notification Prime (Retention)
**Headline:** Don't break the chain.
**Copy:** Most people forget to track lunch. We can nudge you at 12pm so you don't fall behind.
**Button:** [Enable Reminders] -> *Triggers System Prompt*
**Secondary:** [Maybe Later]

### Screen 5: The "Aha" Moment (First Log)
**Headline:** Let's try it out.
**Copy:** What did you have for breakfast?
**Search Bar:** [ Type "Eggs" or "Coffee"... ]
**Action:** User types "Eggs".
**Result:** Instant list. Tap "+" to add.
**Animation:** Calorie bar fills up slightly. "300 / 2450".
**Overlay:** "Boom. Done. That took 4 seconds."
**Button:** [Finish Onboarding]

---

## 3. The "Empty State" (Dashboard)
*When they land on the main screen, don't leave it empty.*

**Visual:** The Daily Chart.
**Call to Action:** "Lunch is coming up. Tap '+' to log."
**Micro-Copy:** "Streak: 1 Day."

---

## 4. Paywall Strategy (Freemium Model)
*If we decide to monetize immediately.*

**Placement:** After Screen 3 (The Reveal).
**Headline:** Unlock Pro Speed.
**Features:**
-   **Barcode Scanner:** Scan & Go.
-   **Macro Customization:** Set exact gram targets.
-   **History Export:** PDF reports for your coach.
**Pricing:**
-   **Yearly:** $29.99 ($2.50/mo) - *Selected by default*
-   **Monthly:** $4.99
**Button:** [Start 7-Day Free Trial]

---

## 5. Lifecycle Emails (Activation)
*Triggered via Firebase/RevenueCat.*

**Email 1 (1 Hour Post-Install):** "Your targets are set."
-   Recap the 2,450 kcal goal.
-   Link to "How to weigh food" guide.

**Email 2 (Day 1 Evening):** "Did you hit it?"
-   "You logged [X] calories today. You have [Y] left. Close the gap."

**Email 3 (Day 3):** "The Weekend Trap."
-   "Don't let the weekend ruin your streak. Log your cheat meal. It counts."
