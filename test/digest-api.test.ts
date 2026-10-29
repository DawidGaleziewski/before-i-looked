import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const config = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir: 'runs' };

async function tempRuns(files: Record<string, string>): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'rig-'));
  for (const [name, body] of Object.entries(files)) await writeFile(join(dir, name), body);
  return dir;
}

describe('GET /api/digest/:night', () => {
  it('returns the night rows as JSON, sorted by job', async () => {
    const res = await createApp(config).request('/api/digest/2026-10-28');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { night: string; rows: { job: string }[]; badLines: number };
    expect(body.night).toBe('2026-10-28');
    expect(body.badLines).toBe(1);
    const jobs = body.rows.map((r) => r.job);
    expect(jobs).toEqual([...jobs].sort());
    expect(jobs).toHaveLength(5);
  });

  it('404 for a night with no file', async () => {
    const res = await createApp(config).request('/api/digest/1999-01-01');
    expect(res.status).toBe(404);
  });

  it('404 for a malformed night', async () => {
    const res = await createApp(config).request('/api/digest/nope');
    expect(res.status).toBe(404);
  });

  it('empty night: 200 with no rows', async () => {
    const dir = await tempRuns({ '2026-01-01.jsonl': '' });
    const res = await createApp({ ...config, runsDir: dir }).request('/api/digest/2026-01-01');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ night: '2026-01-01', rows: [], badLines: 0 });
  });

  it('bad line: 200, counted in badLines, valid rows kept', async () => {
    const dir = await tempRuns({
      '2026-01-02.jsonl': 'not json\n{"at":"2026-01-02T01:00:00+01:00","job":"a/b","status":"ok","owner":null}\n',
    });
    const res = await createApp({ ...config, runsDir: dir }).request('/api/digest/2026-01-02');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { rows: { job: string; owner: string | null }[]; badLines: number };
    expect(body.badLines).toBe(1);
    expect(body.rows.map((r) => r.job)).toEqual(['a/b']);
    expect(body.rows[0]?.owner).toBeNull();
  });
});
