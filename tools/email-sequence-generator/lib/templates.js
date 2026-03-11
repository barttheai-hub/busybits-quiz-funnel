/**
 * Email Sequence Templates
 * Based on memory/projects/busybits-welcome-sequence.md
 */

const WELCOME_SEQUENCE = [
  {
    id: 'welcome-1',
    name: 'Asset Delivery',
    delay: 'Immediate',
    subjects: [
      'High-Performance OS (CEO Edition) enclosed',
      'The Morning Protocol used by 50+ Unicorn Founders'
    ],
    body: `Hey {{first_name}},

Welcome to the **BusyBits** community. You're now part of a group of 100,000+ founders and high-performers optimizing their work and life.

As promised, here is your copy of **The High-Performance OS (CEO Edition)**.

**[Download the High-Performance OS]**

**How to use this guide:**
Don't try to implement everything at once.
Pick **ONE** module (I recommend Module 1: Morning Protocol) and stick to it for 7 days.
Once it's automatic, add Module 2.

**One more thing...**
If you're serious about the "Health" part of the OS, you need a way to track your fuel without spending hours logging food.
I built **BusyBody** for exactly this purpose. It's the fastest calorie counter on the market.
[Check it out on the App Store here].

Talk soon,
Ziga

P.S. I send one email a week on Tuesdays. It takes 4 minutes to read. If you hate it, unsubscribe. (But you won't).`
  },
  {
    id: 'welcome-2',
    name: 'Tech Stack Deep Dive',
    delay: 'Day 1',
    subjects: [
      'My $10k Biohacking Stack (What\'s actually worth it?)',
      'Oura vs Whoop vs Apple Watch'
    ],
    body: `Hey {{first_name}},

Yesterday, you downloaded the OS. Today, let's talk hardware.

I've spent over $10,000 testing every health gadget on the market.
Most are trash. Some are life-changing.

**Here is my definitive tier list:**

**S-Tier (Must Have):**
1. **Oura Ring:** The only sleep tracker that doesn't annoy me.
2. **BusyBody App:** Because if you aren't tracking protein, you aren't building muscle. [Get it here].
3. **Blackout Curtains:** $50 investment. 20% more Deep Sleep.

**A-Tier (Nice to Have):**
1. **Eight Sleep Pod:** Expensive, but thermal regulation is magic.
2. **Continuous Glucose Monitor (CGM):** Insightful for 2 weeks, then boring.

**F-Tier (Don't Buy):**
1. **Blue Light Glasses (Cheap ones):** Marketing gimmick. Just use f.lux on your screen.

What's in your stack? Reply and let me know.

- Ziga`
  },
  {
    id: 'welcome-3',
    name: 'Deep Work Algorithm',
    delay: 'Day 3',
    subjects: [
      'How to work 4 hours and produce 8 hours of output',
      'The 90/20 Rule'
    ],
    body: `Hey {{first_name}},

Most people work like they browse Netflix: Aimless, distracted, and low-energy.

Elite performers work like snipers.

**The Protocol: Ultradian Rhythms (90/20)**
Your brain can only focus intensely for about 90 minutes before it needs a "chemical reset" (dopamine replenishment).

If you push past 90 mins, you get diminishing returns.

**Try this tomorrow:**
1. **08:00 - 09:30:** Deep Work Block 1 (Phone in airplane mode).
2. **09:30 - 09:50:** NSDR (Non-Sleep Deep Rest). Stare at a wall. Walk. Do nothing.
3. **09:50 - 11:20:** Deep Work Block 2.

Do this, and you'll be done with your "real work" by lunch.

Then you can spend the rest of the day on high-leverage tasks (or napping).

- Ziga`
  },
  {
    id: 'welcome-4',
    name: 'The Kill List',
    delay: 'Day 5',
    subjects: [
      '3 things destroying your focus',
      'Delete these apps immediately'
    ],
    body: `Hey {{first_name}},

Addition is easy. Subtraction is hard.
But subtraction is where the gains are.

**Here are 3 things I removed from my life to double my output:**

1. **The News:** If it's important, someone will tell you. If it's not, it's just anxiety fuel.
2. **Phone in Bedroom:** Buy an analog alarm clock. Reclaim your mornings.
3. **Meeting Notifications:** If you are a maker, "15 mins until meeting" notifications destroy your flow state. Turn them off.

What can you delete today?

- Ziga`
  },
  {
    id: 'welcome-5',
    name: 'The Sunday Review',
    delay: 'Day 7',
    subjects: [
      'The Weekly System',
      'How I plan my week in 20 mins'
    ],
    body: `Hey {{first_name}},

You've been here for a week. You have the OS. You have the Tech Stack.

Now you need the **Cadence**.

Every Sunday at 6pm, I sit down for 20 minutes and do this:
1. **Review Last Week:** What did I ship? What did I fail at?
2. **Audit Calendar:** Cancel any meeting that doesn't have a clear agenda.
3. **Set "Big 3":** The 3 things that *must* happen this week for it to be a success.

That's it.
Simple systems scale. Complex systems fail.

See you on Tuesday for the regular newsletter.

- Ziga`
  }
];

const REACTIVATION_SEQUENCE = [
  {
    id: 'reactivation-1',
    name: 'We Miss You',
    delay: 'Day 0',
    subjects: [
      'Did we lose you?',
      '{{first_name}}, you\'re missing out'
    ],
    body: `Hey {{first_name}},

I noticed you haven't opened our emails in a while.

No hard feelings — inboxes are noisy.

But I wanted to reach out personally and ask: **Is there something specific you're struggling with?**

Hit reply and let me know. I read every response.

If you're not interested anymore, no worries — [unsubscribe here].

But if you are, I've got some good stuff coming this month.

- Ziga`
  },
  {
    id: 'reactivation-2',
    name: 'The Breakup',
    delay: 'Day 3',
    subjects: [
      'Should I keep sending these?',
      'Last call...'
    ],
    body: `Hey {{first_name}},

This is the last email I'll send unless you tell me otherwise.

I've been sharing high-performance strategies with 100,000+ founders, but if it's not for you, I get it.

**One click keeps you in:**
[Yes, keep me subscribed]

Or do nothing and I'll remove you from the list in 48 hours.

No hard feelings either way.

- Ziga`
  },
  {
    id: 'reactivation-3',
    name: 'Final Attempt',
    delay: 'Day 7',
    subjects: [
      'Removing you tomorrow',
      'Final notice: List cleanup'
    ],
    body: `Hey {{first_name}},

This is it — I'm cleaning up the list tomorrow and removing inactive subscribers.

If you want to stay and get the Tuesday newsletter, click here:
[Keep me on the list]

Otherwise, best of luck with everything.

- Ziga`
  }
];

const QUIZ_NURTURE_TEMPLATES = {
  Time: [
    {
      id: 'quiz-time-1',
      name: 'Your Time Bottleneck Result',
      delay: 'Immediate',
      subjects: ['Your Time Bottleneck (And How to Fix It)', 'The Calendar Audit'],
      body: 'Time-specific nurture email 1'
    },
    {
      id: 'quiz-time-2',
      name: 'The 4-Hour Decision',
      delay: 'Day 1',
      subjects: ['Work Less, Produce More', 'The Calendar Block Method'],
      body: 'Time-specific nurture email 2'
    }
  ],
  Energy: [
    {
      id: 'quiz-energy-1',
      name: 'Your Energy Bottleneck Result',
      delay: 'Immediate',
      subjects: ['Your Energy Crisis (Solved)', 'The Afternoon Crash Fix'],
      body: 'Energy-specific nurture email 1'
    },
    {
      id: 'quiz-energy-2',
      name: 'The Sleep Protocol',
      delay: 'Day 1',
      subjects: ['Sleep Is Your Superpower', 'How to Wake Up Energized'],
      body: 'Energy-specific nurture email 2'
    }
  ],
  Focus: [
    {
      id: 'quiz-focus-1',
      name: 'Your Focus Bottleneck Result',
      delay: 'Immediate',
      subjects: ['Your Focus Problem (Diagnosed)', 'The Attention Diet'],
      body: 'Focus-specific nurture email 1'
    },
    {
      id: 'quiz-focus-2',
      name: 'The Distraction Detox',
      delay: 'Day 1',
      subjects: ['Reset Your Brain in 48 Hours', 'Digital Minimalism for Founders'],
      body: 'Focus-specific nurture email 2'
    }
  ]
};

module.exports = {
  WELCOME_SEQUENCE,
  REACTIVATION_SEQUENCE,
  QUIZ_NURTURE_TEMPLATES
};
