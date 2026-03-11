/**
 * Compliance Checker
 * Flags restricted terms for Meta/TikTok health/fitness ads
 */

const RED_FLAGS = [
  'cure', 'cures', 'cured',
  'permanent', 'permanently',
  'guaranteed', 'guarantee', 'guarantees',
  'fda approved', 'fda-approved',
  'reverses baldness', 'reverse baldness',
  '100% effective', '100% success',
  'miracle', 'miraculous',
  'instant results', 'overnight',
  'doctor approved', 'clinically proven', // unless we have studies
  'no side effects', // for drugs
  'regrow hair', 'regrows hair', // too strong
];

const SAFE_ALTERNATIVES = {
  'cure': ['solution', 'approach', 'protocol', 'system'],
  'permanent': ['long-lasting', 'sustained', 'ongoing support'],
  'guaranteed': ['90-day money back', 'risk-free', 'backed by'],
  'regrow hair': ['support density', 'thicker looking', 'fuller appearance'],
  'no side effects': ['topical application', 'targeted delivery', 'local use'],
};

function check(texts) {
  const violations = [];
  
  texts.forEach(text => {
    const lowerText = text.toLowerCase();
    RED_FLAGS.forEach(flag => {
      if (lowerText.includes(flag)) {
        violations.push({
          word: flag,
          context: text,
          alternatives: SAFE_ALTERNATIVES[flag] || ['use softer language']
        });
      }
    });
  });
  
  return violations;
}

function suggestFix(text) {
  let fixed = text;
  const lowerText = text.toLowerCase();
  
  Object.keys(SAFE_ALTERNATIVES).forEach(flag => {
    if (lowerText.includes(flag)) {
      const alts = SAFE_ALTERNATIVES[flag];
      // Simple replacement with first alternative
      fixed = fixed.replace(new RegExp(flag, 'gi'), alts[0]);
    }
  });
  
  return fixed;
}

module.exports = { check, suggestFix, RED_FLAGS, SAFE_ALTERNATIVES };
