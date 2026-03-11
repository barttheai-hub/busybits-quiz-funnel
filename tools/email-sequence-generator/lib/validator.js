/**
 * Input Validator
 */

const VALID_TYPES = ['welcome', 'reactivation', 'quiz-nurture'];
const VALID_BOTTLENECKS = ['Time', 'Energy', 'Focus'];

function validateType(type, bottleneck) {
  if (!VALID_TYPES.includes(type)) {
    return false;
  }
  
  if (type === 'quiz-nurture' && !VALID_BOTTLENECKS.includes(bottleneck)) {
    return false;
  }
  
  return true;
}

function validateFormat(format) {
  return ['html', 'json', 'markdown'].includes(format);
}

module.exports = {
  validateType,
  validateFormat,
  VALID_TYPES,
  VALID_BOTTLENECKS
};
