# Meta Ads Setup SOP: BusyBits Quiz Funnel

**Objective:** Acquire Newsletter Subscribers via Quiz.
**Target CPA:** <$2.50.
**Campaign Type:** Leads (Instant Forms OR Website Conversions). *Recommendation: Website Conversions (Quality).*

---

## 1. Campaign Settings
*   **Buying Type:** Auction.
*   **Objective:** **Leads**.
*   **Campaign Name:** `TOF | Leads | Quiz Funnel | [Date]`
*   **Special Ad Categories:** None.
*   **A/B Test:** Off.
*   **Advantage+ Campaign Budget:** **OFF** (We want to control Ad Set budgets for testing).

---

## 2. Ad Set Settings (Structure)
Create 3 Ad Sets to test different audiences.

### Ad Set A: "Biohackers" (Broad Interest)
*   **Conversion Location:** Website.
*   **Performance Goal:** Maximize number of conversions.
*   **Pixel Event:** **Lead** (Ensure this fires on the Result Page load).
*   **Daily Budget:** $20.00.
*   **Audience:**
    *   **Location:** US, UK, CA, AU.
    *   **Age:** 25-55.
    *   **Gender:** All.
    *   **Detailed Targeting:**
        *   Andrew Huberman
        *   Tim Ferriss
        *   Peter Attia
        *   Biohacking
        *   Dave Asprey

### Ad Set B: "Productivity Geeks" (Tool Affinity)
*   **Daily Budget:** $20.00.
*   **Detailed Targeting:**
    *   Notion (Software)
    *   Atomic Habits (Book)
    *   James Clear
    *   Productivity Software
    *   Evernote

### Ad Set C: "Broad/Open" (Let Algo Work)
*   **Daily Budget:** $15.00.
*   **Detailed Targeting:** **NONE**. (Leave completely open).
*   **Age:** 25-50.
*   **Why:** Meta's AI is often smarter than manual targeting.

---

## 3. Placements
*   **Advantage+ Placements (Recommended):** Let Meta find the cheapest leads across FB/IG/Audience Network.
*   *Exception:* If creative is strictly 9:16 (Stories/Reels), exclude Feeds. If creative is 1:1 (Square), include Feeds.

---

## 4. Ad Creative Setup
For *each* Ad Set, upload the 3-4 creative angles we designed (`quiz_ad_creatives.md`).

*   **Format:** Single Image or Video.
*   **Primary Text:** (Copy/Paste from `quiz_ad_creatives.md`).
*   **Headline:** "What's your productivity bottleneck?" OR "Take the 60-second diagnostic."
*   **Call to Action:** **Learn More** (Higher CTR) or **Take Quiz** (Higher Intent).
*   **Destination URL:** `https://your-domain.com/quiz.html`
*   **Tracking:** Ensure "Website Events" is checked and your Pixel is selected.

---

## 5. Testing Protocol (The "3-Day Rule")
Do not touch the ads for 72 hours.

**Day 1-3:**
*   Monitor **CPC** (Link Click) and **CTR**.
*   If CTR < 0.5% -> Creative is the problem. Kill it.
*   If CTR > 1.0% -> Creative is good.

**Day 4 (Optimization):**
*   **Kill:** Any Ad Set with CPA > $4.00.
*   **Kill:** Any Ad Creative with 0 leads after $15 spend.
*   **Scale:** If an Ad Set has CPA < $2.00, increase budget by 20% (every 48 hours).

---

## 6. Critical Checks
1.  **Pixel Verify:** Use "Meta Pixel Helper" extension to verify the `Lead` event fires ONLY after the email is submitted.
2.  **Mobile Check:** Preview the ad on your phone. Does the text get cut off?
3.  **Speed Check:** Does the Quiz page load in <2 seconds? (Use Google PageSpeed Insights). Slow pages kill ad performance.
