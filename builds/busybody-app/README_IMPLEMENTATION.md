# BusyBody App - Lazy Registration Implementation Guide

## Objective
Implement the "Lazy Registration" flow to boost Day 1 Retention.
Goal: User logs their first meal within 30 seconds of install.

## Assets provided
1.  `BusyBodyOnboarding.swift` - SwiftUI implementation of the flow.
2.  `onboarding-prototype/index.html` - Functional HTML/JS prototype (logic reference).
3.  `onboarding-prototype/README.md` - Analytics event definitions.

## Integration Steps
1.  **Copy `BusyBodyOnboarding.swift`** into your Xcode project (e.g., `BusyBody/Views/Onboarding/`).
2.  **State Management:** Ensure `UserDraft` struct persists across app restarts (e.g., using `UserDefaults` or CoreData) *before* authentication.
3.  **Analytics:** Add tracking calls (e.g., Firebase/Mixpanel) at the marked points in the code:
    - `view_splash`
    - `complete_wizard` (with TDEE value)
    - `search_food_first_time`
    - `log_food_success` (Activation metric)
    - `view_signup_modal`
    - `complete_registration`
4.  **Backend:** Ensure the registration endpoint accepts the `UserDraft` data payload along with the auth token to populate the user profile immediately.

## Testing
- Verify that users can complete the entire flow *offline* (up to registration).
- Confirm the "Streak" modal appears after logging the first food.
- Check analytics dashboard for the new event funnel.
