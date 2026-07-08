import type { DashboardSummary as DashboardSummaryData } from '../api'

interface Props {
  summary: DashboardSummaryData
}

export function DashboardSummary({ summary }: Props) {
  return (
    <section>
      <h1>Accounts</h1>
      <table>
        <thead>
          <tr>
            <th>Label</th>
            <th>Type</th>
            <th>Status</th>
            <th>Balance</th>
            <th>Today's P&amp;L</th>
          </tr>
        </thead>
        <tbody>
          {summary.accounts.map((a) => (
            <tr key={a.account_id}>
              <td>{a.label}</td>
              <td>{a.account_type}</td>
              <td>{a.status}</td>
              <td>{a.current_balance}</td>
              <td>{a.today_pnl}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
