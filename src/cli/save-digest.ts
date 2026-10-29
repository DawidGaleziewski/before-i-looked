// Saves /digest/<night> as one self-contained HTML file (ADR 0003 preview). Runs the app
// in-process, so the file is the same page the server serves. Output goes to previews/,
// which is git-ignored: previews are never committed.
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createApp } from '../app.js';
import { loadConfig } from '../config.js';

const night = process.argv[2] ?? '2026-10-28';
if (!/^\d{4}-\d{2}-\d{2}$/.test(night)) {
  console.error(`not a night: ${night}`);
  process.exit(1);
}

const res = await createApp(loadConfig()).request(`/digest/${night}`);
if (!res.ok) {
  console.error(`digest ${night}: HTTP ${res.status}`);
  process.exit(1);
}

const dir = 'previews';
const file = join(dir, `digest-${night}.html`);
await mkdir(dir, { recursive: true });
await writeFile(file, await res.text(), 'utf8');
console.log(`wrote ${file}`);
