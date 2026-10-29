import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { DigestRow, Night, RunStatus } from "./types.js";

type Line = {
  at: string;
  job: string;
  status: RunStatus;
  owner: string | null;
  error: string | null;
};

const STATUSES: readonly string[] = ["ok", "retry", "fail"];

/** Parse one log line at the edge; `null` when it isn't a valid run line. */
function parseLine(text: string): Line | null {
  let v: unknown;
  try {
    v = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof v !== "object" || v === null || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  const { at, job, status, owner, error } = o;
  if (typeof at !== "string" || typeof job !== "string" || job === "") return null;
  if (typeof status !== "string" || !STATUSES.includes(status)) return null;
  if (owner !== undefined && owner !== null && typeof owner !== "string") return null;
  if (error !== undefined && error !== null && typeof error !== "string") return null;
  return {
    at,
    job,
    status: status as RunStatus,
    owner: owner ?? null,
    error: error ?? null,
  };
}

export async function readNight(runsDir: string, night: string): Promise<Night> {
  const text = await readFile(join(runsDir, `${night}.jsonl`), "utf8");
  const rows = new Map<string, DigestRow>();
  let badLines = 0;

  for (const raw of text.split("\n")) {
    if (raw.trim() === "") continue;
    const line = parseLine(raw);
    if (!line) {
      badLines++;
      continue;
    }
    const row = rows.get(line.job);
    if (!row) {
      rows.set(line.job, {
        job: line.job,
        owner: line.owner,
        runs: 1,
        retries: line.status === "retry" ? 1 : 0,
        lastStatus: line.status,
        lastError: line.error,
        firstAt: line.at,
        lastAt: line.at,
      });
      continue;
    }
    row.runs++;
    if (line.status === "retry") row.retries++;
    row.lastStatus = line.status;
    if (line.error !== null) row.lastError = line.error;
    if (line.owner !== null) row.owner = line.owner;
    row.lastAt = line.at;
  }

  return {
    night,
    rows: [...rows.values()].sort((a, b) => (a.job < b.job ? -1 : a.job > b.job ? 1 : 0)),
    badLines,
  };
}

export type StatusCounts = Record<RunStatus, number>;

/** Counts ok / retry / fail lines in one night's log (unreadable lines are not counted). */
export function countNight(runsDir: string, night: string): StatusCounts {
  const counts: StatusCounts = { ok: 0, retry: 0, fail: 0 };
  let text: string;
  try {
    text = readFileSync(join(runsDir, `${night}.jsonl`), "utf8");
  } catch {
    return counts;
  }
  for (const raw of text.split("\n")) {
    if (raw.trim() === "") continue;
    const line = parseLine(raw);
    if (line) counts[line.status]++;
  }
  return counts;
}
