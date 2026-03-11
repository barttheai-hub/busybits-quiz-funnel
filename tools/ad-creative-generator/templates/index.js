/**
 * Ad Creative Templates
 * Based on Hair Loss and AI UGC hook packs
 */

const hairlossTemplates = {
  'problem-aware': {
    headlines: [
      'Your hair isn\'t dead. It\'s just thirsty.',
      'The real reason your hair is thinning (it\'s not genetics)',
      'It\'s not baldness. It\'s a kink in the hose.',
      'Try the pinch test on your scalp',
      'Why blood flow matters more than DHT',
      'That tight scalp feeling? That\'s the problem.',
      'Before you take the pill, watch this',
      'Barbers hate this one weird trick',
      '3 months. No surgery. Just peptides.',
      'The dormant follicle awakening protocol',
    ],
    body: {
      short: 'Stop fighting genetics. Start fixing blood flow. Our peptide protocol awakens dormant follicles in 90 days. Risk-free trial.',
      medium: 'Most guys think baldness is permanent. It\'s usually just a "kink in the hose" caused by scalp tension. Our topical peptide protocol unkinks the hose so blood flows again. Results in 90 days or your money back.',
      long: 'Your hair isn\'t dead. It\'s just thirsty. Most hair loss isn\'t genetic—it\'s mechanical. Scalp tension chokes blood supply to follicles, putting them to sleep. Our Dormancy Protocol uses targeted peptides to restore blood flow and awaken dormant follicles. No pills. No systemic side effects. Just a topical serum applied daily. Try it risk-free for 90 days.'
    }
  },
  'solution-aware': {
    headlines: [
      'Peptides > Pills (here\'s why)',
      'The smart bomb vs the nuke',
      'Targeted DHT blocking (without the side effects)',
      'Why I stopped taking finasteride',
      'Topical peptides changed everything',
      'Keep your hair AND your hormones',
      'Minoxidil 2.0 is here',
      'The peptide protocol men are switching to',
      'Surgery-free density restoration',
      '90 days to thicker-looking hair',
    ],
    body: {
      short: 'Systemic blockers nuke your DHT everywhere. Our serum blocks only at the root. Smart targeting, zero compromise.',
      medium: 'You shouldn\'t have to choose between your hair and your hormones. Our peptide serum blocks DHT locally—not systemically. The result? Support for thicker-looking hair without the side effects that make guys quit.',
      long: 'Systemic DHT blockers are like using a nuke when you need a sniper. They work, but the collateral damage isn\'t worth it for many guys. Our peptide protocol is different. It targets DHT at the follicle level only—supporting thicker-looking hair while keeping your hormones intact. Try it for 90 days, risk-free.'
    }
  }
};

const aiugcTemplates = {
  'problem-aware': {
    headlines: [
      'Stop filming. Start generating. 🛑',
      'Your winners die in 3 days. Here\'s the fix.',
      'Can\'t film fast enough to feed the algorithm?',
      'The creative fatigue killer',
      'I generate 50 ads per week (without filming)',
      'No actors. No shipping. No waiting.',
      'How I replaced my $3k/mo UGC agency',
      'Creative fatigue is killing your ROAS',
      'This AI pipeline prints video ads',
      'Fired my UGC creators. Best decision ever.',
    ],
    body: {
      short: 'Winners die in 3 days. You can\'t film fast enough. This AI pipeline generates high-performing video ads in minutes. No actors, no shipping, no edits.',
      medium: 'If you run Meta ads, you know the bottleneck: creative fatigue. Winners die in days, and you can\'t film fast enough. I built an AI pipeline that generates unlimited video ads on demand. No actors. No shipping products. No waiting weeks for edits.',
      long: 'Stop filming. Start generating. 🛑 If you run Meta ads, you know the biggest bottleneck is creative fatigue. Winners die in 3 days, and you can\'t film fast enough to replace them. I fixed this by building an AI pipeline that generates high-performing video ads in minutes. No actors (use AI characters). No shipping products. No waiting weeks for edits. Just consistent, script-to-screen video ads that convert.'
    }
  },
  'solution-aware': {
    headlines: [
      'The $7 AI Ad Workflow',
      'Steal my AI ad pipeline',
      'Generate ads in 3 minutes flat',
      'The end of creative fatigue',
      'AI UGC > Real UGC? (Watch this)',
      'My AI character generates 6-figure ads',
      'The n8n workflow that replaced my agency',
      'Build once. Generate forever.',
      'The toolkit media buyers are stealing',
      'From script to screen in minutes',
    ],
    body: {
      short: 'I packaged my entire AI workflow into a Resource Pack. Prompts, scripts, automation blueprint—all for $7. Less than a coffee.',
      medium: 'I\'m giving away the exact SOPs, prompts, and automation logic I use to generate 50+ ad variations weekly. Total cost? ~$17/mo. Time to ship? Minutes. Grab the AI UGC Resource Pack for just $7.',
      long: 'I packaged my entire AI workflow into a simple Resource Pack. You get: The "Research Agent" Prompt (for viral hooks), The Direct Response Script Template, The Visual Consistency Guide (keep actors looking the same), and my n8n Automation Blueprint. It\'s not a course. It\'s a toolkit. And it\'s $7. If it doesn\'t save you 10+ hours this week, I\'ll refund you.'
    }
  }
};

const ctas = {
  hairloss: [
    'Watch the Free Presentation →',
    'See the 90-Day Protocol →',
    'Try It Risk-Free →',
  ],
  aiugc: [
    'Get the $7 Pack →',
    'Steal My Workflow →',
    'Grab It Before Price Goes Up →',
  ]
};

function getHeadlines(product, angle, count = 5) {
  const templates = product === 'aiugc' ? aiugcTemplates : hairlossTemplates;
  const pool = templates[angle]?.headlines || templates['problem-aware'].headlines;
  
  // Shuffle and return requested count
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function getBodyCopies(product, angle, count = 3) {
  const templates = product === 'aiugc' ? aiugcTemplates : hairlossTemplates;
  const body = templates[angle]?.body || templates['problem-aware'].body;
  
  return [
    { type: 'short', text: body.short },
    { type: 'medium', text: body.medium },
    { type: 'long', text: body.long }
  ].slice(0, count);
}

function getCTAs(product, count = 3) {
  const pool = ctas[product] || ctas.hairloss;
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

module.exports = { getHeadlines, getBodyCopies, getCTAs, hairlossTemplates, aiugcTemplates };
