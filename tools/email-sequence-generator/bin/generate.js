#!/usr/bin/env node
/**
 * Email Sequence Generator CLI
 * Generates complete email sequences for BusyBits newsletter
 */

const { generateSequence } = require('../lib/generator');
const { validateType } = require('../lib/validator');
const fs = require('fs');
const path = require('path');

function showHelp() {
  console.log(`
📧 Email Sequence Generator for BusyBits Newsletter

Usage:
  node bin/generate.js --type=<type> [--bottleneck=<type>] [--output=<path>]

Types:
  welcome       - 5-email welcome sequence for new subscribers
  reactivation  - 3-email reactivation for inactive subscribers  
  quiz-nurture  - 7-email nurture sequence for quiz completers

Options:
  --bottleneck  - For quiz-nurture: Time | Energy | Focus
  --output      - Output file path (default: stdout)
  --format      - Output format: html | json | markdown (default: html)

Examples:
  node bin/generate.js --type=welcome
  node bin/generate.js --type=quiz-nurture --bottleneck=Time --output=./emails.html
  node bin/generate.js --type=reactivation --format=json
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    type: null,
    bottleneck: null,
    output: null,
    format: 'html'
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }
    if (arg.startsWith('--type=')) {
      options.type = arg.split('=')[1];
    }
    if (arg.startsWith('--bottleneck=')) {
      options.bottleneck = arg.split('=')[1];
    }
    if (arg.startsWith('--output=')) {
      options.output = arg.split('=')[1];
    }
    if (arg.startsWith('--format=')) {
      options.format = arg.split('=')[1];
    }
  }

  return options;
}

function main() {
  const options = parseArgs();

  if (!options.type) {
    console.error('❌ Error: --type is required');
    showHelp();
    process.exit(1);
  }

  if (!validateType(options.type, options.bottleneck)) {
    console.error(`❌ Error: Invalid type "${options.type}" or missing bottleneck for quiz-nurture`);
    process.exit(1);
  }

  try {
    const result = generateSequence(options.type, {
      bottleneck: options.bottleneck,
      format: options.format
    });

    if (options.output) {
      fs.writeFileSync(options.output, result.content);
      console.log(`✅ Generated ${options.type} sequence (${result.emails.length} emails)`);
      console.log(`📄 Saved to: ${options.output}`);
    } else {
      console.log(result.content);
    }
  } catch (error) {
    console.error(`❌ Error generating sequence: ${error.message}`);
    process.exit(1);
  }
}

main();
