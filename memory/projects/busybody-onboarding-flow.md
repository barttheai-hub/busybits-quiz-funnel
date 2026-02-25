# BusyBody App - "Lazy Registration" Onboarding Flow (CRO)

**Objective:** Maximize Day 1 Retention & Activation Rate.
**Philosophy:** "Give value before asking for data." (The "Lazy" approach).
**Goal:** User logs their first meal within 30 seconds of install.
**Metric:** Install-to-Log Conversion Rate (>80%).

---

## The Flow Overview
1.  **Splash:** Value Prop (Speed).
2.  **Micro-Setup:** 3 Questions (Gender, Weight, Goal). *No Email yet.*
3.  **The "Magic" Moment:** Calculate Calorie Target.
4.  **Activation:** "Log your last meal." (Search -> Tap -> Log).
5.  **The Hook:** Show "Calories Remaining" ring closing.
6.  **The Ask (Registration):** "Save your progress?" (Apple/Google Sign-In).

---

## Screen 1: Splash Screen
**Visual:** Minimalist logo. Deep Blue gradient.
**Headline:** "The 3-Second Calorie Counter."
**Subheadline:** Stop wasting time. Start losing weight.
**Button:** **Start Tracking** (No "Login" / "Signup" buttons visible yet - hidden in "Already have an account?" text link at bottom).

---

## Screen 2: Micro-Setup (Wizard)
*Keep it strictly essential. No "Name", no "Birthday".*

**Step 1: The Basics**
*   **Copy:** "Let's calibrate your engine."
*   **Inputs:** Gender (M/F), Weight (lbs/kg), Height.
*   **Button:** Next ->

**Step 2: The Goal**
*   **Copy:** "What's the mission?"
*   **Options:**
    *   Lose Fat (Deficit)
    *   Build Muscle (Surplus)
    *   Maintain (Balance)
*   **Button:** Next ->

**Step 3: Activity**
*   **Copy:** "How much do you move?"
*   **Options:** Desk Job / Active / Athlete.
*   **Button:** Calculate Target ->

---

## Screen 3: The "Magic" Calculation (Loader)
*Psychological trick: Show "Calculating..." to increase perceived value.*

**Visual:** Spinner / Progress Bar.
**Text Cycling:**
*   "Analyzing TDEE..."
*   "Optimizing Protein Ratio..."
*   "Setting Deficit..."

**Result:**
**Headline:** "Your Daily Target: 2,150 kcal"
**Subtext:** "To reach [Goal Weight] by [Date]."
**Button:** **Let's Eat ->**

---

## Screen 4: Activation (The First Log)
*Crucial Step. Do not dump them on an empty dashboard.*

**Headline:** "What was the last thing you ate?"
**Input:** Auto-focused Search Bar.
**Placeholder:** "e.g. 2 eggs and toast"

**Action:**
1.  User types "Oats".
2.  Instant list results.
3.  User taps "Oatmeal (1 cup)".
4.  **Animation:** Food flies into the "Ring". The ring fills up (visual dopamine).

---

## Screen 5: The "Aha" Dashboard
*Now they see the value. The ring is partially full. They feel "started".*

**Visual:** Main Dashboard.
**Overlay/Tooltip:** pointing to the ring.
**Copy:** "You have 1,800 calories left today."

**Trigger:**
After 3 seconds on this screen, OR when they try to log a second item...

---

## Screen 6: The "Soft" Registration (Paywall/Signup)
**Overlay:** Slide-up Modal.

**Headline:** "Save your streak?"
**Copy:** "You've started strong. Create a free account to back up your data and never lose your streak."

**Buttons:**
*   **[ Continue with Apple]** (Primary, High Contrast).
*   **[G Continue with Google]**.
*   *Skip for now* (Small, grey text).

**Why this works:**
We leverage **Loss Aversion**. They already "invested" effort (logging a meal). They don't want to lose that data.
Asking for signup *before* value = Churn.
Asking for signup *after* value = Retention.

---

## Analytics Events (Funnel Tracking)
1.  `view_splash`
2.  `complete_wizard` (TDEE Calculated)
3.  `search_food_first_time`
4.  `log_food_success` (**Activation Metric**)
5.  `view_signup_modal`
6.  `complete_registration` (**Conversion Metric**)

**Target Metrics:**
*   Splash -> Activation: 85%
*   Activation -> Registration: 60%
