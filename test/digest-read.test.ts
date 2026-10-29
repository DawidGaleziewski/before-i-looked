import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readNight } from "../src/digest/read.js";

describe("readNight", () => {
  it("reads runs/2026-10-28.jsonl: 5 jobs, 1 bad line", async () => {
    const n = await readNight("runs", "2026-10-28");
    expect(n.badLines).toBe(1);
    expect(n.rows.map((r) => r.job)).toEqual([
      "digest/render",
      "fixtures/refresh",
      "lane/sync",
      "notes/backup",
      "rig/rotate-logs",
    ]);
    const by = Object.fromEntries(n.rows.map((r) => [r.job, r]));
    expect(by["digest/render"]?.owner).toBeNull();
    expect(by["fixtures/refresh"]).toMatchObject({
      runs: 4, retries: 3, lastStatus: "ok", lastError: "upstream 503",
      firstAt: "2026-10-29T01:30:00+01:00", lastAt: "2026-10-29T01:37:00+01:00",
    });
    expect(by["notes/backup"]).toMatchObject({ lastStatus: "fail", lastError: "quota exceeded" });
    expect(by["lane/sync"]?.firstAt).toBe("2026-10-28T23:00:06+01:00");
  });

  it("counts bad lines and rejects on a missing file", async () => {
    const dir = await mkdtemp(join(tmpdir(), "rig-"));
    await writeFile(join(dir, "x.jsonl"), 'nope\n{"at":"a","job":"j","status":"zzz"}\n\n');
    const n = await readNight(dir, "x");
    expect(n).toMatchObject({ rows: [], badLines: 2 });
    await expect(readNight(dir, "missing")).rejects.toThrow();
  });
});
