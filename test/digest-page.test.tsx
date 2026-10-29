import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const config = { adapter: 'shim', installed: 'x', beatEverySeconds: 60, runsDir: 'runs' };

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
    const fs = await import('node:fs/promises');
    const os = await import('node:os');
    const path = await import('node:path');
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'rig-'));
    await fs.writeFile(path.join(dir, '2026-01-01.jsonl'), '');
    const res = await createApp({ ...config, runsDir: dir }).request('/digest/2026-01-01');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });
});
