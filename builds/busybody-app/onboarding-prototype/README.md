# BusyBody "Lazy Registration" Prototype

This is a functional prototype of the new Onboarding Flow designed to maximize activation.

## How to Run
Simply open `index.html` in any modern web browser. No server required.

## The Flow (Happy Path)
1.  **Splash:** Click "Start Tracking".
2.  **Wizard:** Select Gender -> Weight -> Height -> Next -> Goal -> Activity -> Calculate.
3.  **Calculation:** Watch the simulated loader. Click "Let's Eat".
4.  **Activation:** Type "oats" (or anything > 2 chars) in the search bar. Click the first result ("Oatmeal").
5.  **Dashboard:** Watch the ring fill up.
6.  **Soft Reg:** After 2.5 seconds, the "Save your streak?" modal will appear.

## Analytics Events (Console)
Open your browser's Developer Tools (Console) to see the tracked events firing in real-time:
- `view_splash`
- `complete_wizard`
- `search_food_first_time`
- `log_food_success`
- `view_signup_modal`

## Tech Stack
- Vanilla HTML/JS (No framework overhead for prototype).
- TailwindCSS (via CDN).
