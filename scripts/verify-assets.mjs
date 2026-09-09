import { readFileSync, existsSync } from 'node:fs';

const crestPath = 'src/assets/afit-logo.svg';
const html = readFileSync('index.html', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const svgSignature = '<svg';

if (!existsSync(crestPath) || !readFileSync(crestPath, 'utf8').includes(svgSignature)) {
  throw new Error('The locally tracked AFIT crest must be a valid SVG asset.');
}
if (!html.includes('/src/assets/afit-logo.svg')) {
  throw new Error('The landing-page hero must reference the local AFIT crest.');
}
for (const token of ['--afit-light-blue', '--afit-deep-blue', '--afit-red']) {
  if (!css.includes(token)) throw new Error(`Missing required crest color token: ${token}`);
}
console.log('Verified local crest asset, hero reference, and crest-derived color tokens.');
