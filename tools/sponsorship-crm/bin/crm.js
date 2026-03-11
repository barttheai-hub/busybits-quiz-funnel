#!/usr/bin/env node

const CRM = require('../lib/crm');
const TemplateEngine = require('../lib/templates');

const crm = new CRM();
const engine = new TemplateEngine();

function showHelp() {
  console.log(`
BusyBits Sponsorship CRM
========================

Commands:
  list                    Show all sponsors
  pipeline                View pipeline by stage
  status <id> <stage>     Move sponsor to new stage (Prospect|Contacted|Negotiating|Closed|Live)
  email <id> [template]   Generate cold email for sponsor
  follow-ups              Show sponsors needing follow-up
  touch <id>              Record contact attempt and schedule follow-up
  note <id> <text>        Add note to sponsor
  stats                   Show CRM statistics
  templates               List available email templates
  export                  Export all ready-to-send emails
  help                    Show this help

Examples:
  node bin/crm.js list
  node bin/crm.js status eight-sleep Contacted
  node bin/crm.js email eight-sleep
  node bin/crm.js touch eight-sleep
  node bin/crm.js follow-ups
`);
}

function formatDate(iso) {
  if (!iso) return 'Never';
  const d = new Date(iso);
  return d.toLocaleDateString();
}

function cmdList() {
  const sponsors = crm.getAll();
  console.log(`\n📋 All Sponsors (${sponsors.length} total)\n`);
  console.log('ID                  | Status      | Tier | Last Contact | Touches | Contact');
  console.log('--------------------|-------------|------|--------------|---------|-----------------------');
  sponsors.forEach(s => {
    const contact = s.contacts?.[0]?.email || 'N/A';
    console.log(
      `${s.id.padEnd(19)} | ${s.status.padEnd(11)} | ${s.tier}    | ${formatDate(s.lastContact).padEnd(12)} | ${s.touchCount}       | ${contact}`
    );
  });
  console.log('');
}

function cmdPipeline() {
  const pipeline = crm.getPipeline();
  console.log('\n📊 Sponsorship Pipeline\n');
  Object.entries(pipeline).forEach(([stage, sponsors]) => {
    const count = sponsors.length;
    const icon = stage === 'Closed' ? '✅' : stage === 'Live' ? '🚀' : stage === 'Prospect' ? '🔍' : '⏳';
    console.log(`${icon} ${stage.padEnd(12)} (${count})`);
    if (sponsors.length > 0) {
      sponsors.forEach(s => {
        const next = s.nextFollowUp ? `(follow-up: ${formatDate(s.nextFollowUp)})` : '';
        console.log(`   └─ ${s.name} ${next}`);
      });
    }
  });
  console.log('');
}

function cmdStatus(id, newStatus) {
  const validStatuses = ['Prospect', 'Contacted', 'Negotiating', 'Closed', 'Live'];
  if (!validStatuses.includes(newStatus)) {
    console.error(`❌ Invalid status. Use: ${validStatuses.join(', ')}`);
    process.exit(1);
  }

  const result = crm.updateStatus(id, newStatus);
  if (!result) {
    console.error(`❌ Sponsor not found: ${id}`);
    process.exit(1);
  }
  
  console.log(`✅ Updated: ${result.sponsor.name}`);
  console.log(`   ${result.oldStatus} → ${result.newStatus}`);
}

function cmdEmail(id, templateName = null) {
  const sponsor = crm.getById(id);
  if (!sponsor) {
    console.error(`❌ Sponsor not found: ${id}`);
    process.exit(1);
  }

  const email = engine.generate(sponsor, templateName);
  console.log(`\n📧 Email for ${sponsor.name}\n`);
  console.log(`To:      ${email.to}`);
  console.log(`Subject: ${email.subject}`);
  console.log(`\n${'='.repeat(60)}\n`);
  console.log(email.body);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`\nTemplate: ${email.template}\n`);
}

function cmdFollowUps() {
  const due = crm.getFollowUpsDue();
  if (due.length === 0) {
    console.log('\n✅ No follow-ups due.\n');
    return;
  }

  console.log(`\n⏰ Follow-ups Due (${due.length})\n`);
  due.forEach(s => {
    console.log(`• ${s.name} (${s.status})`);
    console.log(`  Last contact: ${formatDate(s.lastContact)}`);
    console.log(`  Touches: ${s.touchCount}`);
    console.log(`  Contact: ${s.contacts?.[0]?.email || 'N/A'}`);
    console.log('');
  });
}

function cmdTouch(id) {
  const sponsor = crm.recordTouch(id);
  if (!sponsor) {
    console.error(`❌ Sponsor not found: ${id}`);
    process.exit(1);
  }

  console.log(`✅ Recorded touch for ${sponsor.name}`);
  console.log(`   Touches: ${sponsor.touchCount}`);
  console.log(`   Next follow-up: ${formatDate(sponsor.nextFollowUp)}`);
}

function cmdNote(id, ...textParts) {
  const text = textParts.join(' ');
  const sponsor = crm.addNote(id, text);
  if (!sponsor) {
    console.error(`❌ Sponsor not found: ${id}`);
    process.exit(1);
  }
  console.log(`✅ Added note to ${sponsor.name}`);
}

function cmdStats() {
  const stats = crm.getStats();
  console.log('\n📈 CRM Statistics\n');
  console.log(`Total Prospects: ${stats.total}`);
  console.log(`Follow-ups Due:  ${stats.followUpsDue}`);
  console.log(`Total Touches:   ${stats.touchCountTotal}`);
  console.log('\nBy Stage:');
  Object.entries(stats.byStatus).forEach(([stage, count]) => {
    console.log(`  ${stage.padEnd(12)}: ${count}`);
  });
  console.log('');
}

function cmdTemplates() {
  const templates = engine.listTemplates();
  console.log('\n📝 Available Templates\n');
  templates.forEach(t => console.log(`  • ${t}`));
  console.log('');
}

function cmdExport() {
  const prospects = crm.getByStatus('Prospect');
  if (prospects.length === 0) {
    console.log('\nℹ️ No prospects to export.\n');
    return;
  }

  console.log(`\n📤 Export: Ready-to-Send Emails (${prospects.length} prospects)\n`);
  console.log(`${'='.repeat(70)}\n`);
  
  prospects.forEach(s => {
    const email = engine.generate(s);
    console.log(`SPONSOR: ${s.name}`);
    console.log(`TO: ${email.to}`);
    console.log(`SUBJECT: ${email.subject}`);
    console.log(`\n${email.body}`);
    console.log(`\n${'='.repeat(70)}\n`);
  });
}

// Main CLI
const [,, command, ...args] = process.argv;

switch (command) {
  case 'list':
    cmdList();
    break;
  case 'pipeline':
    cmdPipeline();
    break;
  case 'status':
    cmdStatus(args[0], args[1]);
    break;
  case 'email':
    cmdEmail(args[0], args[1]);
    break;
  case 'follow-ups':
    cmdFollowUps();
    break;
  case 'touch':
    cmdTouch(args[0]);
    break;
  case 'note':
    cmdNote(args[0], ...args.slice(1));
    break;
  case 'stats':
    cmdStats();
    break;
  case 'templates':
    cmdTemplates();
    break;
  case 'export':
    cmdExport();
    break;
  case 'help':
  default:
    showHelp();
    break;
}