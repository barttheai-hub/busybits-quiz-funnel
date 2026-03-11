/**
 * Email Sequence Generator - Test Suite
 */

const { generateSequence } = require('../lib/generator');
const { validateType, validateFormat } = require('../lib/validator');

let testsRun = 0;
let testsPassed = 0;

function test(name, fn) {
  testsRun++;
  try {
    fn();
    testsPassed++;
    console.log(`✅ ${name}`);
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Test 1: Welcome sequence generates 5 emails
test('Welcome sequence generates 5 emails', () => {
  const result = generateSequence('welcome', { format: 'json' });
  assert(result.emails.length === 5, `Expected 5 emails, got ${result.emails.length}`);
});

// Test 2: Reactivation sequence generates 3 emails
test('Reactivation sequence generates 3 emails', () => {
  const result = generateSequence('reactivation', { format: 'json' });
  assert(result.emails.length === 3, `Expected 3 emails, got ${result.emails.length}`);
});

// Test 3: Quiz-nurture with Time bottleneck works
test('Quiz-nurture with Time bottleneck works', () => {
  const result = generateSequence('quiz-nurture', { bottleneck: 'Time', format: 'json' });
  assert(result.emails.length >= 2, `Expected at least 2 emails, got ${result.emails.length}`);
});

// Test 4: Welcome sequence has A/B subject variants
test('Welcome sequence has A/B subject variants', () => {
  const result = generateSequence('welcome', { format: 'json' });
  const firstEmail = result.emails[0];
  assert(firstEmail.subjects.length === 2, 'Expected 2 subject line variants');
});

// Test 5: HTML output contains email markup
test('HTML output contains email markup', () => {
  const result = generateSequence('welcome', { format: 'html' });
  assert(result.content.includes('<!DOCTYPE html>'), 'Expected HTML doctype');
  assert(result.content.includes('email-body'), 'Expected email-body class');
});

// Test 6: JSON output is valid JSON
test('JSON output is valid JSON', () => {
  const result = generateSequence('welcome', { format: 'json' });
  const parsed = JSON.parse(result.content);
  assert(Array.isArray(parsed.sequence), 'Expected sequence array');
});

// Test 7: Markdown output has headers
test('Markdown output has headers', () => {
  const result = generateSequence('welcome', { format: 'markdown' });
  assert(result.content.includes('# 📧'), 'Expected header emoji');
  assert(result.content.includes('## Email'), 'Expected email headers');
});

// Test 8: Validate type rejects invalid types
test('Validate type rejects invalid types', () => {
  assert(validateType('invalid') === false, 'Should reject invalid type');
  assert(validateType('welcome') === true, 'Should accept welcome');
});

// Test 9: Quiz-nurture requires bottleneck
test('Quiz-nurture requires bottleneck', () => {
  assert(validateType('quiz-nurture', null) === false, 'Should require bottleneck');
  assert(validateType('quiz-nurture', 'Time') === true, 'Should accept Time bottleneck');
});

// Test 10: Personalization placeholders exist
test('Personalization placeholders exist', () => {
  const result = generateSequence('welcome', { format: 'json' });
  const hasPlaceholders = result.emails.some(e => e.body.includes('{{first_name}}'));
  assert(hasPlaceholders, 'Expected {{first_name}} placeholder in at least one email');
});

// Summary
console.log(`\n${testsPassed}/${testsRun} tests passed`);
if (testsPassed === testsRun) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('⚠️ Some tests failed');
  process.exit(1);
}
