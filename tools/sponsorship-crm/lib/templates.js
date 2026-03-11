const templates = {
  'super-user': {
    subject: (data) => `Who handles creator partnerships at ${data.company}?`,
    body: (data) => `Hey ${data.firstName || '[Name]'},

I've been a paid user of ${data.company} for [X months] and genuinely love it. (The [Specific Feature] is a game changer for my workflow).

I write a newsletter called **BusyBits** (105k+ subscribers, mostly founders and high-performance professionals).

I'm planning my Q2 sponsorship calendar and ${data.company} is at the top of my list. I think my audience would convert well because they are obsessed with optimizing their [Sleep/Focus/Health].

Are you currently doing newsletter partnerships?

Best,
Ziga`
  },

  'competitor': {
    subject: (data) => `Idea for ${data.company} x BusyBits`,
    body: (data) => `Hey ${data.firstName || '[Name]'},

I saw you guys sponsoring [Competitor/Similar Newsletter]. It caught my eye because my audience at **BusyBits** (105k subs) is almost identical, but we haven't featured a [Category] partner yet.

We typically see a 2-4% CTR on high-fit tech placements.

Would you be open to a small test run to see if we can beat your current CPA?

Cheers,
Ziga`
  },

  'bump-1': {
    subject: (data) => `Re: ${data.originalSubject || 'Partnership'}`,
    body: (data) => `Hey ${data.firstName || '[Name]'}, just floating this to the top of your inbox.

Let me know if you're the right person to chat with, or if I should reach out to someone else on the growth team?

Thanks,
Ziga`
  },

  'bump-2': {
    subject: (data) => `Quick update (Stats)`,
    body: (data) => `Hey ${data.firstName || '[Name]'},

Quick update since my last email: We just crossed 105k subscribers and our open rate is holding steady at 48%.

I have 2 slots left for April. If you want to test the waters, I can offer a "New Partner" rate for the first run.

Let me know.
Ziga`
  },

  'custom-tier-1': {
    subject: (data) => data.subject || `${data.hook} (Partnership Idea)`,
    body: (data) => `Hey ${data.firstName || '[Name]'},

${data.personalHook || `I've been using ${data.product} and it's been a game-changer for my ${data.useCase || 'daily routine'}.`}

I run **BusyBits**, a newsletter for 100,000+ high-performance founders and executives.
${data.audienceAngle || 'My audience is obsessed with optimization and biohacking.'}

${data.proposal || `I'd love to feature ${data.company} as the "${data.positioning}" for my readers in an upcoming issue.`}

Are you currently doing newsletter partnerships for Q2?

Best,
Ziga
Founder, BusyBits`
  }
};

class TemplateEngine {
  generate(sponsor, templateName = null) {
    const template = templateName || sponsor.template || 'super-user';
    const tmpl = templates[template];
    
    if (!tmpl) {
      throw new Error(`Unknown template: ${template}`);
    }

    const data = {
      company: sponsor.name,
      product: sponsor.personalization?.product || sponsor.name,
      hook: sponsor.personalization?.hook || '',
      firstName: sponsor.contacts?.[0]?.name?.split(' ')[0] || '[Name]'
    };

    return {
      subject: tmpl.subject(data),
      body: tmpl.body(data),
      template: template,
      to: sponsor.contacts?.[0]?.email || '',
      sponsor: sponsor.name
    };
  }

  generateFollowUp(sponsor, bumpNumber = 1) {
    const templateName = bumpNumber === 1 ? 'bump-1' : 'bump-2';
    return this.generate(sponsor, templateName);
  }

  listTemplates() {
    return Object.keys(templates);
  }

  generateBatch(sponsors, templateName = null) {
    return sponsors.map(s => this.generate(s, templateName));
  }
}

module.exports = TemplateEngine;