/** Status of one run-log line. */
export type RunStatus = "ok" | "retry" | "fail";

/** One row per job in a night's run log. */
export type DigestRow = {
  job: string;
  /** `null` when the log has no owner; views render `—`. */
  owner: string | null;
  /** Number of log lines for this job. */
  runs: number;
  /** Number of lines with status `retry`. */
  retries: number;
  lastStatus: RunStatus;
  /** Error of the last line that had one, or `null`; views render `—`. */
  lastError: string | null;
  /** Times as written in the log, offset kept (never converted to UTC). */
  firstAt: string;
  lastAt: string;
};

/** What `readNight` returns: rows sorted by job, plus lines that didn't parse. */
export type Night = {
  night: string;
  rows: DigestRow[];
  /** Lines that failed to parse; counted, never thrown. */
  badLines: number;
};

/**
 * Reads `<runsDir>/<night>.jsonl` (night as `YYYY-MM-DD`).
 * Rejects only when the file is missing (callers map that to 404).
 */
export type ReadNight = (runsDir: string, night: string) => Promise<Night>;

export declare function readNight(runsDir: string, night: string): Promise<Night>;
