#!/usr/bin/env node
// The copy gate: no em dashes, no stock words, no developer-note placeholders in the visible Hebrew copy.
import fs from 'node:fs';
const s = fs.readFileSync(new URL('../content/he.ts', import.meta.url), 'utf8');
const problems = [];
if (s.includes('—')) problems.push('em dash found');
for (const w of ['seamless', 'leverage', 'empower', 'unlock', 'robust', 'actionable', 'data-driven', 'solutions', 'TODO', 'lorem', 'יוכנס כאן', 'יופיע כאן']) if (s.toLowerCase().includes(w.toLowerCase())) problems.push(`stock/dev word: ${w}`);
console.log(problems.length ? problems.join('\n') : 'copy gate: clean');
process.exit(problems.length ? 1 : 0);
