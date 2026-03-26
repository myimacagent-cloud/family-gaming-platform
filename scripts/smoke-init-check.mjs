import fs from 'node:fs';
import path from 'node:path';

const gamesDir = path.resolve('src/games');
const gameFolders = fs.readdirSync(gamesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .filter((name) => !name.startsWith('_'));

const failures = [];

for (const game of gameFolders) {
  const indexPath = path.join(gamesDir, game, 'index.ts');
  if (!fs.existsSync(indexPath)) continue;
  const src = fs.readFileSync(indexPath, 'utf8');

  if (!src.includes('createInitialState')) failures.push(`${game}: missing createInitialState`);
  if (!src.includes('createRestartState')) failures.push(`${game}: missing createRestartState`);

  const hasHands = src.includes('hands:');
  if (hasHands && src.includes('hands: {}')) {
    console.warn(`warn: ${game} initializes hands as empty object (runtime guard will backfill on active start)`);
  }
}

if (failures.length) {
  console.error('Smoke init check failed:\n' + failures.map((f) => `- ${f}`).join('\n'));
  process.exit(1);
}

console.log(`Smoke init check passed for ${gameFolders.length} game folders.`);
