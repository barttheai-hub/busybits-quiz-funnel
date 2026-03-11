const CRM = require('../lib/crm');
const TemplateEngine = require('../lib/templates');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`❌ ${name}`);
    console.log(`   ${e.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

console.log('\n🧪 Sponsorship CRM Test Suite\n');

// Test 1: CRM loads data
test('CRM loads sponsor data', () => {
  const crm = new CRM();
  const sponsors = crm.getAll();
  assert(sponsors.length === 5, `Expected 5 sponsors, got ${sponsors.length}`);
});

// Test 2: Can find sponsor by ID
test('Can find sponsor by ID', () => {
  const crm = new CRM();
  const sponsor = crm.getById('eight-sleep');
  assert(sponsor !== null, 'Sponsor not found');
  assert(sponsor.name === 'Eight Sleep', `Wrong name: ${sponsor.name}`);
});

// Test 3: Pipeline has correct stages
test('Pipeline has all stages', () => {
  const crm = new CRM();
  const pipeline = crm.getPipeline();
  const stages = ['Prospect', 'Contacted', 'Negotiating', 'Closed', 'Live'];
  stages.forEach(stage => {
    assert(pipeline[stage] !== undefined, `Missing stage: ${stage}`);
  });
});

// Test 4: Template engine generates email
test('Template engine generates cold email', () => {
  const crm = new CRM();
  const engine = new TemplateEngine();
  const sponsor = crm.getById('oura-ring');
  const email = engine.generate(sponsor);
  
  assert(email.subject.includes('Oura'), 'Subject should mention company');
  assert(email.body.includes('BusyBits'), 'Body should mention BusyBits');
  assert(email.body.includes('105k'), 'Body should mention subscriber count');
  assert(email.to === 'press@ouraring.com', 'Should have correct email');
});

// Test 5: Follow-up reminder system
test('Recording touch schedules follow-up', () => {
  const crm = new CRM();
  const initial = crm.getById('whoop');
  const initialTouches = initial.touchCount;
  
  crm.recordTouch('whoop');
  const updated = crm.getById('whoop');
  
  assert(updated.touchCount === initialTouches + 1, 'Touch count should increment');
  assert(updated.nextFollowUp !== null, 'Should have follow-up scheduled');
  assert(updated.lastContact !== null, 'Should have last contact date');
});

// Test 6: Stats calculation
test('Stats calculation works', () => {
  const crm = new CRM();
  const stats = crm.getStats();
  
  assert(stats.total === 5, `Expected 5 total, got ${stats.total}`);
  assert(stats.byStatus['Prospect'] === 5, 'All should be in Prospect stage');
  assert(stats.followUpsDue >= 0, 'Follow-ups due should be non-negative');
});

// Test 7: Email template variations
test('Can generate competitor template', () => {
  const crm = new CRM();
  const engine = new TemplateEngine();
  const sponsor = crm.getById('whoop');
  const email = engine.generate(sponsor, 'competitor');
  
  assert(email.subject.includes('Idea'), 'Competitor subject should mention Idea');
  assert(email.body.includes('sponsoring'), 'Body should mention sponsoring competitors');
});

// Test 8: Follow-up email generation
test('Can generate follow-up emails', () => {
  const crm = new CRM();
  const engine = new TemplateEngine();
  const sponsor = crm.getById('eight-sleep');
  
  const bump1 = engine.generateFollowUp(sponsor, 1);
  const bump2 = engine.generateFollowUp(sponsor, 2);
  
  assert(bump1.subject.includes('Re:'), 'Bump 1 should be reply');
  assert(bump2.subject.includes('Stats'), 'Bump 2 should mention stats');
});

// Test 9: Export functionality
test('Export generates ready-to-send emails', () => {
  const crm = new CRM();
  const engine = new TemplateEngine();
  const prospects = crm.getByStatus('Prospect');
  const emails = engine.generateBatch(prospects);
  
  assert(emails.length === prospects.length, 'Should generate email for each prospect');
  assert(emails.every(e => e.subject && e.body && e.to), 'Each email should have required fields');
});

// Test 10: Status update
test('Status update works correctly', () => {
  const crm = new CRM();
  const result = crm.updateStatus('levels', 'Contacted');
  
  assert(result !== null, 'Should return update result');
  assert(result.oldStatus === 'Prospect', 'Should show old status');
  assert(result.newStatus === 'Contacted', 'Should show new status');
  
  const sponsor = crm.getById('levels');
  assert(sponsor.status === 'Contacted', 'Status should persist');
  
  // Reset for other tests
  crm.updateStatus('levels', 'Prospect');
});

// Reset data after tests
const fs = require('fs');
const path = require('path');
const DATA_FILE = path.join(__dirname, '..', 'data', 'sponsors.json');

// Reload original data
const originalData = {
  "sponsors": [
    {
      "id": "eight-sleep",
      "name": "Eight Sleep",
      "category": "Health Tech",
      "tier": 1,
      "contacts": [{ "name": "Matteo Franceschetti", "role": "CEO/Marketing", "email": "press@eightsleep.com", "verified": true }],
      "status": "Prospect", "lastContact": null, "nextFollowUp": null, "touchCount": 0,
      "notes": "Pod product - high-ROI sleep hardware. Super-user angle available.",
      "template": "super-user",
      "personalization": { "product": "Pod", "hook": "8 hours in 6 - buy back time through sleep efficiency" }
    },
    {
      "id": "oura-ring",
      "name": "Oura Ring",
      "category": "Health Tech",
      "tier": 1,
      "contacts": [{ "name": "Tom Hale", "role": "Partnership Lead", "email": "press@ouraring.com", "verified": true }],
      "status": "Prospect", "lastContact": null, "nextFollowUp": null, "touchCount": 0,
      "notes": "Readiness Score, sleep tracking. Data-driven energy management angle.",
      "template": "super-user",
      "personalization": { "product": "Oura Ring", "hook": "Data-Driven Energy Management - check readiness before email" }
    },
    {
      "id": "whoop",
      "name": "Whoop",
      "category": "Health Tech",
      "tier": 1,
      "contacts": [{ "name": "Will Ahmed", "role": "Marketing", "email": "press@whoop.com", "verified": false }],
      "status": "Prospect", "lastContact": null, "nextFollowUp": null, "touchCount": 0,
      "notes": "Strain vs Recovery. Burnout prevention angle. 4.0 hardware.",
      "template": "competitor",
      "personalization": { "product": "Whoop 4.0", "hook": "Burnout Prevention System for entrepreneurs" }
    },
    {
      "id": "levels",
      "name": "Levels",
      "category": "Health Tech",
      "tier": 1,
      "contacts": [{ "name": "Sam Corcos", "role": "Growth", "email": "press@levelshealth.com", "verified": false }],
      "status": "Prospect", "lastContact": null, "nextFollowUp": null, "touchCount": 0,
      "notes": "CGM, glucose visibility. Metabolic focus angle. Biology vs willpower.",
      "template": "super-user",
      "personalization": { "product": "Levels", "hook": "Metabolic Focus - make invisible problems visible" }
    },
    {
      "id": "apollo-neuro",
      "name": "Apollo Neuro",
      "category": "Health Tech",
      "tier": 1,
      "contacts": [{ "name": "Kathryn Fantauzzi", "role": "Partnerships", "email": "press@apolloneuro.com", "verified": false }],
      "status": "Prospect", "lastContact": null, "nextFollowUp": null, "touchCount": 0,
      "notes": "HRV training, Focus/Relax modes. Stress Switch for entrepreneurs.",
      "template": "super-user",
      "personalization": { "product": "Apollo", "hook": "Stress Switch for entrepreneurs - changes state, not just tracks" }
    }
  ],
  "metadata": { "importedFrom": "tmp/busybits_send_kit.md", "importDate": "2026-03-10", "totalProspects": 5, "version": "1.0" }
};
fs.writeFileSync(DATA_FILE, JSON.stringify(originalData, null, 2));

console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(40)}\n`);

process.exit(failed > 0 ? 1 : 0);