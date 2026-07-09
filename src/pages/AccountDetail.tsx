import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  getAccountBalance,
  getAccountPnlDaily,
  getPayoutHistory,
  listAccounts,
} from '../api'
import { useApi } from '../hooks/useApi'
import { cumulativeBalanceSeries, cumulativePnlSeries } from '../lib/equity'
import { daysSince, formatDate, formatMoney, isoWeekKey, signClass, signOf, toNumber } from '../lib/format'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { StatCardSkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { AccountTypeBadge, StatusBadge } from '../components/ui/Badge'
import { DonutRing } from '../components/ui/DonutRing'
import { Button } from '../components/ui/form'
import { LineAreaChart } from '../components/charts/LineAreaChart'

function GapTile({ label, note }: { label: string; note: string }) {
  return (
    <Card>
      <div className="text-sm text-text-muted">{label}</div>
      <div className="font-mono tabular-nums text-xl text-text-muted mt-2">—</div>
      <div className="text-xs text-text-muted mt-1">{note}</div>
    </Card>
  )
}

function StatTile({ label, value, sign }: { label: string; value: string; sign?: 'positive' | 'negative' | 'neutral' }) {
  return (
    <Card>
      <div className="text-sm text-text-muted">{label}</div>
      <div className={`font-mono tabular-nums text-xl mt-2 ${sign ? signClass[sign] : 'text-text-primary'}`}>
        {value}
      </div>
    </Card>
  )
}

export function AccountDetail() {
  const { id = '' } = useParams<{ id: string }>()
  const accounts = useApi(listAccounts, [])
  const balance = useApi(() => getAccountBalance(id), [id])
  const daily = useApi(() => getAccountPnlDaily(id), [id])
  const payouts = useApi(() => getPayoutHistory(id), [id])
  const [summaryView, setSummaryView] = useState<'daily' | 'weekly'>('daily')
  const [page, setPage] = useState(0)
  const pageSize = 10

  const account = useMemo(() => accounts.data?.find((a) => a.id === id), [accounts.data, id])
  const isFunded = account?.account_type.startsWith('funded_') ?? false

  const equitySeries = useMemo(
    () => (daily.data && account ? cumulativeBalanceSeries(daily.data, toNumber(account.capital_base)) : []),
    [daily.data, account],
  )
  const performanceSeries = useMemo(
    () => (daily.data ? cumulativePnlSeries(daily.data) : []),
    [daily.data],
  )

  const highLow = useMemo(() => {
    if (equitySeries.length === 0) return null
    const values = equitySeries.map((p) => p.value)
    return { high: Math.max(...values), low: Math.min(...values) }
  }, [equitySeries])

  const tradingDays = useMemo(() => {
    if (!daily.data || daily.data.length === 0) return null
    const first = [...daily.data].sort((a, b) => a.day.localeCompare(b.day))[0]
    return daysSince(first.day)
  }, [daily.data])

  const tradesPlaced = useMemo(
    () => (daily.data ? daily.data.reduce((sum, r) => sum + r.trade_count, 0) : 0),
    [daily.data],
  )

  const totalApprovedPayouts = useMemo(
    () =>
      payouts.data
        ? payouts.data.filter((a) => a.type === 'payout').reduce((sum, a) => sum + toNumber(a.amount), 0)
        : 0,
    [payouts.data],
  )

  const weeklyRows = useMemo(() => {
    if (!daily.data) return []
    const map = new Map<string, { week: string; pnl: number; trades: number }>()
    for (const row of daily.data) {
      const key = isoWeekKey(row.day)
      const existing = map.get(key) ?? { week: key, pnl: 0, trades: 0 }
      existing.pnl += toNumber(row.pnl_net)
      existing.trades += row.trade_count
      map.set(key, existing)
    }
    return Array.from(map.values()).sort((a, b) => b.week.localeCompare(a.week))
  }, [daily.data])

  const dailyRowsSorted = useMemo(
    () => (daily.data ? [...daily.data].sort((a, b) => b.day.localeCompare(a.day)) : []),
    [daily.data],
  )

  const rows = summaryView === 'daily' ? dailyRowsSorted : weeklyRows
  const pageRows = rows.slice(page * pageSize, page * pageSize + pageSize)

  if (accounts.error) {
    return <ErrorState message="Couldn't load account — check your connection and retry." onRetry={accounts.refetch} />
  }

  if (accounts.loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!account) {
    return <EmptyState title="Account not found" description="It may have been closed or the link is out of date." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-medium text-text-primary">{account.label}</h1>
            <StatusBadge status={account.status} />
            <AccountTypeBadge accountType={account.account_type} />
          </div>
          <div className="text-sm text-text-muted mt-1">
            {account.provider ?? account.account_type} · {formatMoney(account.capital_base)} account · started{' '}
            {formatDate(account.created_at)}
          </div>
        </div>
        <Button
          variant="secondary"
          title="Configure a credentials manager link in Settings to enable this"
          disabled
        >
          Credentials
        </Button>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {balance.loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : balance.error ? (
          <div className="sm:col-span-2">
            <ErrorState message="Couldn't load balance — check your connection and retry." onRetry={balance.refetch} />
          </div>
        ) : (
          <>
            <StatCard label="Balance" value={formatMoney(balance.data?.current_balance)} />
            <StatCard label="Equity" value={formatMoney(balance.data?.current_balance)} />
          </>
        )}
        <Card className="flex items-center gap-4">
          <DonutRing value={null} label="Win Rate" />
          <div className="text-xs text-text-muted">Needs trade-level data (not yet exposed by the backend)</div>
        </Card>
        <StatCard
          label="Trading Days"
          value={tradingDays === null ? '—' : tradingDays}
          sub={tradingDays === null ? 'No trades yet' : undefined}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LineAreaChart
          title="Account Equity"
          data={equitySeries}
          loading={daily.loading}
          emptyMessage="Equity history builds up as closed trades come in."
          variant="area"
        />
        <LineAreaChart
          title="Account Performance"
          data={performanceSeries}
          loading={daily.loading}
          emptyMessage="Cumulative P&L appears here once trades are recorded."
          variant="line"
          color="#8B7CF6"
        />
      </div>

      {/* Highest/Lowest/Time since first trade */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Highest Balance" value={highLow ? formatMoney(highLow.high) : '—'} />
        <StatTile label="Lowest Balance" value={highLow ? formatMoney(highLow.low) : '—'} />
        <StatTile label="Time Since First Trade" value={tradingDays === null ? '—' : `${tradingDays} days`} />
      </div>

      {/* Rules row - funded only */}
      {isFunded && (
        <div>
          <h2 className="text-sm text-text-muted mb-3">Rules</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <GapTile label="Profit Target" note="No account_rules endpoint yet — not configured." />
            <GapTile label="Daily Loss Limit" note="No account_rules endpoint yet — not configured." />
            <GapTile label="Max Loss Limit" note="No account_rules endpoint yet — not configured." />
          </div>
        </div>
      )}

      {/* Most traded + Statistics grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="text-sm text-text-muted mb-3">Most Traded</div>
          <EmptyState title="Needs trade-level data" description="No per-trade symbol endpoint yet." />
        </Card>
        <div className="lg:col-span-2">
          <div className="text-sm text-text-muted mb-3">Statistics</div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <GapTile label="Average Win" note="Needs trade-level data" />
            <GapTile label="Average Loss" note="Needs trade-level data" />
            <GapTile label="Best Trade" note="Needs trade-level data" />
            <GapTile label="Worst Trade" note="Needs trade-level data" />
            <GapTile label="Profit Factor" note="Needs trade-level data" />
            <GapTile label="Win Ratio" note="Needs trade-level data" />
            <GapTile label="Risk:Reward" note="Needs trade-level data" />
            <GapTile label="Highest Realized Profit" note="Needs trade-level data" />
            <StatTile label="Trades Placed" value={String(tradesPlaced)} />
            <GapTile label="Contracts" note="Needs trade-level data" />
            <StatTile
              label="Total Approved Payouts"
              value={payouts.loading ? '…' : formatMoney(totalApprovedPayouts)}
            />
          </div>
        </div>
      </div>

      {/* Daily / Weekly summary */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-text-muted">Summary</div>
          <div className="flex rounded-md border border-border p-0.5">
            {(['daily', 'weekly'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setSummaryView(v)
                  setPage(0)
                }}
                className={`rounded px-2.5 py-1 text-xs capitalize transition-colors ${
                  summaryView === v ? 'bg-surface-raised text-text-primary' : 'text-text-muted'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {daily.loading && <div className="text-sm text-text-muted">Loading…</div>}
        {!daily.loading && rows.length === 0 && (
          <EmptyState title="No P&L history yet" description="This table fills in as daily P&L is recorded." />
        )}
        {!daily.loading && rows.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-text-muted">
                    <th className="py-2 font-normal">{summaryView === 'daily' ? 'Date' : 'Week'}</th>
                    <th className="py-2 font-normal">Realized P&amp;L</th>
                    <th className="py-2 font-normal">Trades</th>
                  </tr>
                </thead>
                <tbody className="font-mono tabular-nums">
                  {summaryView === 'daily'
                    ? (pageRows as typeof dailyRowsSorted).map((r) => (
                        <tr key={r.day} className="border-b border-border last:border-0">
                          <td className="py-2">{formatDate(r.day)}</td>
                          <td className={`py-2 ${signClass[signOf(r.pnl_net)]}`}>{formatMoney(r.pnl_net)}</td>
                          <td className="py-2">{r.trade_count}</td>
                        </tr>
                      ))
                    : (pageRows as typeof weeklyRows).map((r) => (
                        <tr key={r.week} className="border-b border-border last:border-0">
                          <td className="py-2">{r.week}</td>
                          <td className={`py-2 ${signClass[signOf(r.pnl)]}`}>{formatMoney(r.pnl)}</td>
                          <td className="py-2">{r.trades}</td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
            <div className="text-xs text-text-muted mt-2">
              Balance/Equity per period aren't served per-day by the backend yet, so only Realized P&amp;L is shown.
            </div>
            {rows.length > pageSize && (
              <div className="flex items-center justify-end gap-2 mt-3">
                <Button variant="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  Prev
                </Button>
                <span className="text-xs text-text-muted">
                  Page {page + 1} of {Math.ceil(rows.length / pageSize)}
                </span>
                <Button
                  variant="secondary"
                  disabled={(page + 1) * pageSize >= rows.length}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
