/**
 * Email Sequence Generator Logic
 */

const { WELCOME_SEQUENCE, REACTIVATION_SEQUENCE, QUIZ_NURTURE_TEMPLATES } = require('./templates');

function generateSequence(type, options = {}) {
  let emails = [];
  
  switch (type) {
    case 'welcome':
      emails = [...WELCOME_SEQUENCE];
      break;
    case 'reactivation':
      emails = [...REACTIVATION_SEQUENCE];
      break;
    case 'quiz-nurture':
      const bottleneck = options.bottleneck || 'Time';
      emails = QUIZ_NURTURE_TEMPLATES[bottleneck] || QUIZ_NURTURE_TEMPLATES['Time'];
      break;
    default:
      throw new Error(`Unknown sequence type: ${type}`);
  }

  const format = options.format || 'html';
  
  switch (format) {
    case 'html':
      return { emails, content: formatAsHTML(emails, type) };
    case 'json':
      return { emails, content: formatAsJSON(emails) };
    case 'markdown':
      return { emails, content: formatAsMarkdown(emails) };
    default:
      throw new Error(`Unknown format: ${format}`);
  }
}

function formatAsHTML(emails, sequenceType) {
  const emailBlocks = emails.map((email, index) => {
    const subjectAB = email.subjects.map((s, i) => 
      `<li>Variant ${String.fromCharCode(65 + i)}: "${escapeHtml(s)}"</li>`
    ).join('\n');
    
    return `
<!-- Email ${index + 1}: ${escapeHtml(email.name)} -->
<div class="email" data-email-id="${email.id}">
  <h2>Email ${index + 1}: ${escapeHtml(email.name)}</h2>
  <p><strong>Send:</strong> ${escapeHtml(email.delay)}</p>
  
  <h3>Subject Lines (A/B Test):</h3>
  <ul>
    ${subjectAB}
  </ul>
  
  <h3>Body:</h3>
  <div class="email-body">
${formatBodyAsHTML(email.body)}
  </div>
  
  <hr />
</div>
`;
  }).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(sequenceType)} Email Sequence - BusyBits</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 700px; margin: 40px auto; padding: 20px; }
    .email { margin-bottom: 40px; }
    .email-body { background: #f5f5f5; padding: 20px; border-radius: 8px; white-space: pre-wrap; }
    h2 { color: #1a1a1a; }
    h3 { color: #333; margin-top: 20px; }
    hr { border: none; border-top: 1px solid #ddd; margin: 30px 0; }
    ul { line-height: 1.8; }
    code { background: #e0e0e0; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>📧 ${escapeHtml(sequenceType.charAt(0).toUpperCase() + sequenceType.slice(1))} Email Sequence</h1>
  <p><strong>Total Emails:</strong> ${emails.length}</p>
  <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
  
  ${emailBlocks}
</body>
</html>`;
}

function formatAsJSON(emails) {
  return JSON.stringify({
    sequence: emails,
    generated: new Date().toISOString()
  }, null, 2);
}

function formatAsMarkdown(emails) {
  const emailBlocks = emails.map((email, index) => {
    const subjects = email.subjects.map((s, i) => 
      `- **Variant ${String.fromCharCode(65 + i)}:** "${s}"`
    ).join('\n');
    
    return `
## Email ${index + 1}: ${email.name}

**Send:** ${email.delay}

### Subject Lines (A/B Test)
${subjects}

### Body
${email.body}

---
`;
  }).join('\n');

  return `# 📧 Email Sequence

**Total Emails:** ${emails.length}  
**Generated:** ${new Date().toISOString()}

${emailBlocks}`;
}

function formatBodyAsHTML(body) {
  return escapeHtml(body)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = {
  generateSequence,
  formatAsHTML,
  formatAsJSON,
  formatAsMarkdown
};
