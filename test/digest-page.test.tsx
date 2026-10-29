import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const config = { adapter: 'shim', installed: 'x', beatEverySeconds: 60, runsDir: 'runs' };

async function tempRuns(files: Record<string, string>): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'rig-'));
  for (const [name, body] of Object.entries(files)) await writeFile(join(dir, name), body);
  return dir;
}

describe('digest page', () => {
  it('renders 2026-10-28 with jobs sorted and flagged rows', async () => {
    const res = await createApp(config).request('/digest/2026-10-28');
    const html = await res.text();
    expect(res.status).toBe(200);
    const order = ['digest/render', 'fixtures/refresh', 'lane/sync', 'notes/backup', 'rig/rotate-logs'];
    let last = -1;
    for (const job of order) {
      const i = html.indexOf(job);
      expect(i).toBeGreaterThan(last);
      last = i;
    }
    expect(html).toContain('quota exceeded');
    expect(html).toContain('fixtures/refresh ⚠');
  });

  it('404 for a night with no file and for a malformed night', async () => {
    const app = createApp(config);
    expect((await app.request('/digest/2030-01-01')).status).toBe(404);
    expect((await app.request('/digest/..%2Fx')).status).toBe(404);
  });

  it('renders "nothing ran" for an empty night', async () => {
    const dir = await tempRuns({ '2026-01-01.jsonl': '' });
    const res = await createApp({ ...config, runsDir: dir }).request('/digest/2026-01-01');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });

  it('bad line: still 200, valid job rendered, owner shown as —', async () => {
    const dir = await tempRuns({
      '2026-01-02.jsonl': 'not json\n{"at":"2026-01-02T01:00:00+01:00","job":"a/b","status":"ok","owner":null}\n',
    });
    const res = await createApp({ ...config, runsDir: dir }).request('/digest/2026-01-02');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('a/b');
    expect(html).toContain('—');
    expect(html).not.toContain('nothing ran');
  });
});
