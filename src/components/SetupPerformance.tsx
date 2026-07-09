import type { PnlBySetup } from '../api'
import { EmptyState } from './ui/EmptyState'
import { formatMoney, formatPct, signClass, signOf } from '../lib/format'

interface Props {
  rows: PnlBySetup[]
}

export function SetupPerformance({ rows }: Props) {
  return (
    <section>
      <h2 className="text-sm text-text-muted mb-3">Setup Performance</h2>
      {rows.length === 0 ? (
        <EmptyState
          title="No tagged, closed trades yet"
          description="Tag trades with a setup on import to see per-setup performance here."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="py-2 font-normal">Setup</th>
                <th className="py-2 font-normal">Trades</th>
                <th className="py-2 font-normal">Total P&amp;L</th>
                <th className="py-2 font-normal">Avg P&amp;L</th>
                <th className="py-2 font-normal">Win rate</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums">
              {rows.map((r) => (
                <tr key={`${r.account_id}-${r.setup_tag}`} className="border-b border-border last:border-0">
                  <td className="py-2 font-sans">{r.setup_tag}</td>
                  <td className="py-2">{r.trade_count}</td>
                  <td className={`py-2 ${signClass[signOf(r.total_pnl)]}`}>{formatMoney(r.total_pnl)}</td>
                  <td className="py-2">{r.avg_pnl ? formatMoney(r.avg_pnl) : '—'}</td>
                  <td className="py-2">{formatPct(r.win_rate, { fromRatio: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
