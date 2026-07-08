import type { PnlBySetup } from '../api'

interface Props {
  rows: PnlBySetup[]
}

export function SetupPerformance({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <section>
        <h2>Setup performance</h2>
        <p>No tagged, closed trades yet.</p>
      </section>
    )
  }

  return (
    <section>
      <h2>Setup performance</h2>
      <table>
        <thead>
          <tr>
            <th>Setup</th>
            <th>Trades</th>
            <th>Total P&amp;L</th>
            <th>Avg P&amp;L</th>
            <th>Win rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.account_id}-${r.setup_tag}`}>
              <td>{r.setup_tag}</td>
              <td>{r.trade_count}</td>
              <td>{r.total_pnl}</td>
              <td>{r.avg_pnl ?? '-'}</td>
              <td>{r.win_rate !== null ? `${(r.win_rate * 100).toFixed(1)}%` : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
