import type { DigestRow, Night } from '../digest/types.js';

// Missing data renders as `—`, never as an empty cell (styleguide).
const dash = (v: string | null) => (v === null || v === '' ? '—' : v);

// Retries of 3 or more and any `fail` are marked, so a slow reader sees them without colour.
export function flagged(row: DigestRow): boolean {
  return row.retries >= 3 || row.lastStatus === 'fail';
}

export function DigestPage({ night }: { night: Night }) {
  return (
    <>
      <h1>digest · {night.night}</h1>
      {night.rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>job</th>
              <th>owner</th>
              <th>runs</th>
              <th>retries</th>
              <th>last</th>
              <th>last error</th>
              <th>first</th>
              <th>last at</th>
            </tr>
          </thead>
          <tbody>
            {night.rows.map((r) => {
              const mark = flagged(r);
              return (
                <tr class={mark ? 'warn' : undefined}>
                  <td>{r.job}{mark ? ' ⚠' : ''}</td>
                  <td>{dash(r.owner)}</td>
                  <td>{r.runs}</td>
                  <td>{r.retries}</td>
                  <td>{r.lastStatus}</td>
                  <td>{dash(r.lastError)}</td>
                  <td>{r.firstAt}</td>
                  <td>{r.lastAt}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {night.badLines > 0 ? <p class="mute">{night.badLines} unreadable line(s) skipped</p> : null}
    </>
  );
}
