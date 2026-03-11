const compliance = require('../lib/compliance.js');
const templates = require('../templates/index.js');

// Test Suite for Meta Ads Creative Generator

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) throw new Error(`${msg || 'Assertion failed'}: expected ${expected}, got ${actual}`);
}

function assertTrue(actual, msg) {
  if (!actual) throw new Error(msg || 'Expected true');
}

console.log('\n🧪 Running Test Suite\n');

// Test 1: Compliance checker detects red flags
test('Compliance detects "cure"', () => {
  const violations = compliance.check(['This will cure your baldness']);
  assertTrue(violations.length > 0, 'Should detect cure as red flag');
});

// Test 2: Compliance checker allows safe content
test('Compliance allows safe language', () => {
  const violations = compliance.check(['Supports thicker looking hair']);
  assertEqual(violations.length, 0, 'Should not flag safe language');
});

// Test 3: Headline generation returns correct count
test('Headline generation returns 5 headlines', () => {
  const headlines = templates.getHeadlines('hairloss', 'problem-aware', 5);
  assertEqual(headlines.length, 5, 'Should return 5 headlines');
});

// Test 4: Body copy generation returns all 3 types
test('Body copy returns short/medium/long', () => {
  const copies = templates.getBodyCopies('aiugc', 'solution-aware', 3);
  assertEqual(copies.length, 3, 'Should return 3 body copies');
  assertTrue(copies.some(c => c.type === 'short'), 'Should include short');
  assertTrue(copies.some(c => c.type === 'medium'), 'Should include medium');
  assertTrue(copies.some(c => c.type === 'long'), 'Should include long');
});

// Test 5: CTA generation works for both products
test('CTA generation works for hairloss', () => {
  const ctas = templates.getCTAs('hairloss', 3);
  assertEqual(ctas.length, 3, 'Should return 3 CTAs');
});

test('CTA generation works for aiugc', () => {
  const ctas = templates.getCTAs('aiugc', 3);
  assertEqual(ctas.length, 3, 'Should return 3 CTAs');
});

// Test 6: Export directory is created
test('Output directory exists', () => {
  const fs = require('fs');
  const path = require('path');
  const outputDir = path.join(__dirname, '../output');
  assertTrue(fs.existsSync(outputDir), 'Output directory should exist');
});

// Summary
console.log('\n' + '─'.repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('─'.repeat(60) + '\n');

process.exit(failed > 0 ? 1 : 0);
