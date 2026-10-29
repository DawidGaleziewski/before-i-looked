import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const config = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir: 'runs' };

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
});
