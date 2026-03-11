#!/usr/bin/env node

/**
 * Meta Ads Creative Generator
 * Generates ad creative variations with compliance checking
 * Usage: node bin/generate.js --product="hairloss" --angle="problem-aware"
 */

const fs = require('fs');
const path = require('path');

// Load templates and compliance data
const templates = require('../templates/index.js');
const compliance = require('../lib/compliance.js');

// Parse CLI args
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  if (key && value) acc[key.replace('--', '')] = value.replace(/"/g, '');
  return acc;
}, {});

const PRODUCT = args.product || 'hairloss';
const ANGLE = args.angle || 'problem-aware';
const COUNT = parseInt(args.count) || 5;

console.log(`\n🎯 Meta Ads Creative Generator`);
console.log(`Product: ${PRODUCT}`);
console.log(`Angle: ${ANGLE}`);
console.log(`Count: ${COUNT}\n`);

// Generate creatives
const headlines = templates.getHeadlines(PRODUCT, ANGLE, COUNT);
const bodyCopies = templates.getBodyCopies(PRODUCT, ANGLE, 3);
const ctas = templates.getCTAs(PRODUCT, 3);

// Check compliance
console.log('🛡️  Running compliance check...\n');
const allContent = [...headlines, ...bodyCopies.map(b => b.text), ...ctas];
const violations = compliance.check(allContent);

if (violations.length > 0) {
  console.log('⚠️  Compliance Issues Found:');
  violations.forEach(v => console.log(`   - "${v.word}" in: ${v.context.substring(0, 50)}...`));
  console.log('\n🔄 Suggesting alternatives...\n');
}

// Output formatted for Meta Ads
console.log('═══════════════════════════════════════════════════════════════');
console.log('                     META ADS OUTPUT                            ');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('📱 HEADLINES (Primary Text - 5 variations):');
console.log('─'.repeat(60));
headlines.forEach((h, i) => {
  const status = compliance.check([h]).length > 0 ? '⚠️' : '✅';
  console.log(`${status} ${i + 1}. ${h}`);
});

console.log('\n📝 BODY COPY (3 length variations):');
console.log('─'.repeat(60));
bodyCopies.forEach((b, i) => {
  const label = b.type.toUpperCase();
  const status = compliance.check([b.text]).length > 0 ? '⚠️' : '✅';
  console.log(`${status} ${label} (${b.text.length} chars):`);
  console.log(`   ${b.text.substring(0, 120)}${b.text.length > 120 ? '...' : ''}\n`);
});

console.log('\n🎯 CALLS-TO-ACTION (3 variations):');
console.log('─'.repeat(60));
ctas.forEach((c, i) => {
  const status = compliance.check([c]).length > 0 ? '⚠️' : '✅';
  console.log(`${status} ${i + 1}. ${c}`);
});

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('💡 Pro Tips:');
console.log('   - Test headlines separately in Meta Ads A/B tests');
console.log('   - Short body copy performs best for cold traffic');
console.log('   - Use \"Learn More\" CTA for awareness, \"Shop Now\" for conversion');
console.log('═══════════════════════════════════════════════════════════════\n');

// Export to file if requested
if (args.export) {
  const output = {
    product: PRODUCT,
    angle: ANGLE,
    generatedAt: new Date().toISOString(),
    headlines,
    bodyCopies,
    ctas,
    complianceViolations: violations
  };
  
  const outputPath = path.join(__dirname, '../output', `ad-creative-${PRODUCT}-${Date.now()}.json`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`💾 Exported to: ${outputPath}\n`);
}
