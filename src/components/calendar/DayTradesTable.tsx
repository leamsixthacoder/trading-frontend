import { listTrades } from '../../api'
import { useApi } from '../../hooks/useApi'
import { formatMoney, signClass, signOf } from '../../lib/format'
import { EmptyState } from '../ui/EmptyState'
import { ErrorState } from '../ui/ErrorState'

interface DayTradesTableProps {
  dateKey: string
  accountId: string | undefined
}

export function DayTradesTable({ dateKey, accountId }: DayTradesTableProps) {
  const { data, loading, error, refetch } = useApi(
    () => listTrades(accountId, undefined, dateKey),
    [dateKey, accountId],
  )

  if (error) {
    return <ErrorState message="Couldn't load trades for this day — check your connection and retry." onRetry={refetch} />
  }
  if (loading) {
    return <div className="text-sm text-text-muted">Loading trades…</div>
  }
  if (!data || data.length === 0) {
    return <EmptyState title="No closed trades this day" description="Nothing realized on this date yet." />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-text-muted">
            <th className="py-2 font-normal">Symbol</th>
            <th className="py-2 font-normal">Dir</th>
            <th className="py-2 font-normal">Entry</th>
            <th className="py-2 font-normal">Exit</th>
            <th className="py-2 font-normal">P&amp;L</th>
            <th className="py-2 font-normal">Tags</th>
          </tr>
        </thead>
        <tbody className="font-mono tabular-nums">
          {data.map((t) => (
            <tr key={t.id} className="border-b border-border last:border-0">
              <td className="py-2 font-sans">{t.symbol}</td>
              <td className="py-2 font-sans capitalize">{t.direction}</td>
              <td className="py-2">{formatMoney(t.entry_price)}</td>
              <td className="py-2">{t.exit_price ? formatMoney(t.exit_price) : '—'}</td>
              <td className={`py-2 ${signClass[signOf(t.pnl_net)]}`}>{formatMoney(t.pnl_net)}</td>
              <td className="py-2 font-sans text-text-muted">{t.tags.length > 0 ? t.tags.join(', ') : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
