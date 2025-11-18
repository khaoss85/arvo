/**
 * llms.txt Format Validator
 * Run with: node scripts/validate-llms-txt.js
 *
 * Validates that the llms.txt file follows the official specification from llmstxt.org
 */

const fs = require('fs');
const path = require('path');

const llmsTxtPath = path.join(__dirname, '..', 'public', 'llms.txt');

console.log('🔍 Validating llms.txt format...\n');

// 1. Check file exists
if (!fs.existsSync(llmsTxtPath)) {
  console.error('❌ File not found: public/llms.txt');
  process.exit(1);
}

console.log('✅ File exists at public/llms.txt');

// 2. Read file content
const content = fs.readFileSync(llmsTxtPath, 'utf-8');
const lines = content.split('\n');

// 3. Validate H1 (first non-empty line must be H1)
const firstNonEmptyLine = lines.find(line => line.trim() !== '');
if (!firstNonEmptyLine || !firstNonEmptyLine.startsWith('# ')) {
  console.error('❌ First line must be an H1 heading (starts with "# ")');
  process.exit(1);
}

const projectName = firstNonEmptyLine.replace('# ', '').trim();
console.log(`✅ H1 heading found: "${projectName}"`);

// 4. Validate blockquote (should be present)
const hasBlockquote = content.includes('>');
if (hasBlockquote) {
  console.log('✅ Blockquote summary found');
} else {
  console.log('⚠️  No blockquote summary found (recommended but optional)');
}

// 5. Count H2 sections
const h2Sections = lines.filter(line => line.startsWith('## '));
console.log(`✅ Found ${h2Sections.length} H2 sections:`);
h2Sections.forEach(section => {
  const sectionName = section.replace('## ', '').trim();
  console.log(`  - ${sectionName}`);
});

// 6. Check for "Optional" section
const hasOptionalSection = h2Sections.some(section =>
  section.toLowerCase().includes('optional')
);
if (hasOptionalSection) {
  console.log('✅ "Optional" section found (for secondary information)');
} else {
  console.log('ℹ️  No "Optional" section (optional but recommended)');
}

// 7. Validate markdown links format [text](url)
const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
const links = [...content.matchAll(linkRegex)];
console.log(`\n✅ Found ${links.length} markdown links:`);

// Group links by section
let currentSection = 'Before H2 sections';
const linksBySection = { [currentSection]: [] };

lines.forEach(line => {
  if (line.startsWith('## ')) {
    currentSection = line.replace('## ', '').trim();
    linksBySection[currentSection] = [];
  }

  const lineLinks = [...line.matchAll(linkRegex)];
  if (lineLinks.length > 0) {
    lineLinks.forEach(match => {
      linksBySection[currentSection].push({
        text: match[1],
        url: match[2]
      });
    });
  }
});

Object.entries(linksBySection).forEach(([section, sectionLinks]) => {
  if (sectionLinks.length > 0) {
    console.log(`\n  ${section}:`);
    sectionLinks.forEach(link => {
      console.log(`    - [${link.text}](${link.url})`);
    });
  }
});

// 8. File size check
const fileSizeKB = (content.length / 1024).toFixed(2);
console.log(`\n📊 File size: ${fileSizeKB} KB`);

if (content.length > 100000) {
  console.log('⚠️  File is quite large (>100KB). Consider moving detailed content to separate .md files');
} else {
  console.log('✅ File size is reasonable');
}

// 9. Check for common issues
const issues = [];

if (!content.includes('http')) {
  issues.push('No URLs found - llms.txt should typically include links to documentation');
}

if (content.split('\n').length < 10) {
  issues.push('File seems very short - consider adding more context');
}

if (issues.length > 0) {
  console.log('\n⚠️  Potential issues:');
  issues.forEach(issue => console.log(`  - ${issue}`));
} else {
  console.log('\n✅ No obvious issues detected');
}

// 10. Summary
console.log('\n' + '='.repeat(60));
console.log('✅ llms.txt validation complete!');
console.log('='.repeat(60));

console.log('\n📝 Next steps:');
console.log('  1. Deploy your site to make llms.txt accessible at https://arvo.guru/llms.txt');
console.log('  2. Test the URL in a browser to ensure it\'s publicly accessible');
console.log('  3. Submit to llms.txt directories:');
console.log('     - https://llmstxt.site');
console.log('     - https://directory.llmstxt.cloud');
console.log('  4. Consider using llms_txt2ctx to generate LLM context files');
console.log('     - npm install -g llms-txt2ctx');
console.log('     - llms_txt2ctx https://arvo.guru/llms.txt');
