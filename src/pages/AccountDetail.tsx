import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PieChart, Pie, Cell, Legend, Tooltip } from 'recharts'
import {
  getAccountBalance,
  getAccountPnlDaily,
  getPayoutHistory,
  listAccountAllocations,
  listAccounts,
  listTrades,
  type Trade,
} from '../api'
import { useApi } from '../hooks/useApi'
import { balanceAsOf, cumulativeBalanceSeries, cumulativePnlSeries, dailyBalancePoints } from '../lib/equity'
import { daysSince, dateOnlyKey, formatDate, formatDateUTC, formatMoney, formatPct, isoWeekKey, signClass, signOf, toNumber } from '../lib/format'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { StatCardSkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { AccountTypeBadge, StatusBadge } from '../components/ui/Badge'
import { DonutRing } from '../components/ui/DonutRing'
import { Button } from '../components/ui/form'
import { LineAreaChart } from '../components/charts/LineAreaChart'
import { TradeEntryForm } from '../components/TradeEntryForm'
import { CsvImportSection } from '../components/CsvImportSection'
import { AccountRulesSection } from '../components/AccountRulesSection'

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

const MOST_TRADED_PALETTE = ['#5B8DEF', '#F5A623', '#4FC3B0', '#E07BE0', '#8FA6FF', '#D97757']

function MostTradedDonut({ trades }: { trades: Trade[] }) {
  const data = useMemo(() => {
    const counts = new Map<string, number>()
    for (const t of trades) counts.set(t.symbol, (counts.get(t.symbol) ?? 0) + 1)
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [trades])

  if (data.length === 0) {
    return <EmptyState title="No trades yet" description="Log or import a trade to see the symbol breakdown." />
  }

  return (
    <div className="flex items-center justify-center">
      <PieChart width={260} height={220}>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}>
          {data.map((_, i) => (
            <Cell key={i} fill={MOST_TRADED_PALETTE[i % MOST_TRADED_PALETTE.length]} />
          ))}
        </Pie>
        <Legend />
        <Tooltip
          formatter={(value) => `${value} trade${value === 1 ? '' : 's'}`}
          contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
        />
      </PieChart>
    </div>
  )
}

export function AccountDetail() {
  const { id = '' } = useParams<{ id: string }>()
  const accounts = useApi(listAccounts, [])
  const balance = useApi(() => getAccountBalance(id), [id])
  const daily = useApi(() => getAccountPnlDaily(id), [id])
  const payouts = useApi(() => getPayoutHistory(id), [id])
  const allocations = useApi(() => listAccountAllocations(id), [id])
  const tradesApi = useApi(() => listTrades(id), [id])
  const [summaryView, setSummaryView] = useState<'daily' | 'weekly'>('daily')
  const [page, setPage] = useState(0)
  const pageSize = 10

  const [trades, setTrades] = useState<Trade[]>([])
  useEffect(() => {
    if (tradesApi.data) setTrades(tradesApi.data)
  }, [tradesApi.data])

  function handleTradeCreated(trade: Trade) {
    setTrades((prev) => [trade, ...prev])
    balance.refetch()
    daily.refetch()
  }

  function handleImported() {
    tradesApi.refetch()
    balance.refetch()
    daily.refetch()
  }

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

  const tradeStats = useMemo(() => {
    const closed = trades.filter((t) => t.exit_price !== null)
    if (closed.length === 0) return null

    const pnls = closed.map((t) => toNumber(t.pnl_net))
    const wins = pnls.filter((p) => p > 0)
    const losses = pnls.filter((p) => p < 0)
    const avgWin = wins.length ? wins.reduce((s, v) => s + v, 0) / wins.length : null
    const avgLoss = losses.length ? losses.reduce((s, v) => s + v, 0) / losses.length : null
    const grossWins = wins.reduce((s, v) => s + v, 0)
    const grossLosses = Math.abs(losses.reduce((s, v) => s + v, 0))

    return {
      winRate: (wins.length / closed.length) * 100,
      avgWin,
      avgLoss,
      bestTrade: Math.max(...pnls),
      worstTrade: Math.min(...pnls),
      profitFactor: grossLosses > 0 ? grossWins / grossLosses : null,
      riskReward: avgWin !== null && avgLoss !== null && avgLoss !== 0 ? avgWin / Math.abs(avgLoss) : null,
      contracts: trades.reduce((s, t) => s + toNumber(t.size), 0),
    }
  }, [trades])

  const todayLoss = useMemo(() => {
    if (!daily.data) return 0
    const today = dateOnlyKey(new Date().toISOString())
    const row = daily.data.find((r) => dateOnlyKey(r.day) === today)
    if (!row) return 0
    const pnl = toNumber(row.pnl_net)
    return pnl < 0 ? Math.abs(pnl) : 0
  }, [daily.data])

  const drawdown = useMemo(() => {
    if (!highLow || !account) return 0
    return Math.max(0, toNumber(account.capital_base) - highLow.low)
  }, [highLow, account])

  const profitSoFar = useMemo(() => {
    if (!balance.data || !account) return 0
    return toNumber(balance.data.current_balance) - toNumber(account.capital_base)
  }, [balance.data, account])

  const totalApprovedPayouts = useMemo(
    () =>
      payouts.data
        ? payouts.data.filter((a) => a.type === 'payout').reduce((sum, a) => sum + toNumber(a.amount), 0)
        : 0,
    [payouts.data],
  )

  const weeklyRows = useMemo(() => {
    if (!daily.data) return []
    const map = new Map<string, { week: string; pnl: number; trades: number; endDay: string }>()
    for (const row of daily.data) {
      const key = isoWeekKey(row.day)
      const day = dateOnlyKey(row.day)
      const existing = map.get(key) ?? { week: key, pnl: 0, trades: 0, endDay: day }
      existing.pnl += toNumber(row.pnl_net)
      existing.trades += row.trade_count
      if (day > existing.endDay) existing.endDay = day
      map.set(key, existing)
    }
    return Array.from(map.values()).sort((a, b) => b.week.localeCompare(a.week))
  }, [daily.data])

  const dailyRowsSorted = useMemo(
    () => (daily.data ? [...daily.data].sort((a, b) => b.day.localeCompare(a.day)) : []),
    [daily.data],
  )

  const dailyPoints = useMemo(
    () => (daily.data && account ? dailyBalancePoints(daily.data, allocations.data ?? [], toNumber(account.capital_base)) : []),
    [daily.data, allocations.data, account],
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

      {tradesApi.error ? (
        <ErrorState message="Couldn't load trades — check your connection and retry." onRetry={tradesApi.refetch} />
      ) : (
        <TradeEntryForm accountId={id} trades={trades} onCreated={handleTradeCreated} />
      )}

      <CsvImportSection accountId={id} onImported={handleImported} />

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
          <DonutRing value={tradeStats ? tradeStats.winRate : null} label="Win Rate" />
          <div className="text-xs text-text-muted">
            {tradeStats ? `From ${trades.filter((t) => t.exit_price !== null).length} closed trades` : 'No closed trades yet'}
          </div>
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
          <AccountRulesSection
            accountId={id}
            profitSoFar={profitSoFar}
            todayLoss={todayLoss}
            drawdown={drawdown}
          />
        </div>
      )}

      {/* Most traded + Statistics grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="text-sm text-text-muted mb-3">Most Traded</div>
          <MostTradedDonut trades={trades} />
        </Card>
        <div className="lg:col-span-2">
          <div className="text-sm text-text-muted mb-3">Statistics</div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {tradeStats?.avgWin != null ? (
              <StatTile label="Average Win" value={formatMoney(tradeStats.avgWin)} sign="positive" />
            ) : (
              <GapTile label="Average Win" note="No winning closed trades yet" />
            )}
            {tradeStats?.avgLoss != null ? (
              <StatTile label="Average Loss" value={formatMoney(tradeStats.avgLoss)} sign="negative" />
            ) : (
              <GapTile label="Average Loss" note="No losing closed trades yet" />
            )}
            {tradeStats ? (
              <StatTile label="Best Trade" value={formatMoney(tradeStats.bestTrade)} sign={signOf(tradeStats.bestTrade)} />
            ) : (
              <GapTile label="Best Trade" note="No closed trades yet" />
            )}
            {tradeStats ? (
              <StatTile label="Worst Trade" value={formatMoney(tradeStats.worstTrade)} sign={signOf(tradeStats.worstTrade)} />
            ) : (
              <GapTile label="Worst Trade" note="No closed trades yet" />
            )}
            {tradeStats?.profitFactor != null ? (
              <StatTile label="Profit Factor" value={tradeStats.profitFactor.toFixed(2)} />
            ) : (
              <GapTile label="Profit Factor" note="No losing closed trades yet" />
            )}
            {tradeStats ? (
              <StatTile label="Win Ratio" value={formatPct(tradeStats.winRate)} />
            ) : (
              <GapTile label="Win Ratio" note="No closed trades yet" />
            )}
            {tradeStats?.riskReward != null ? (
              <StatTile label="Risk:Reward" value={`${tradeStats.riskReward.toFixed(2)}:1`} />
            ) : (
              <GapTile label="Risk:Reward" note="Needs both win and loss trades" />
            )}
            {tradeStats ? (
              <StatTile label="Highest Realized Profit" value={formatMoney(tradeStats.bestTrade)} sign={signOf(tradeStats.bestTrade)} />
            ) : (
              <GapTile label="Highest Realized Profit" note="No closed trades yet" />
            )}
            <StatTile label="Trades Placed" value={String(tradesPlaced || trades.length)} />
            {tradeStats ? (
              <StatTile label="Contracts" value={tradeStats.contracts.toLocaleString()} />
            ) : (
              <GapTile label="Contracts" note="No trades logged yet" />
            )}
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
                    <th className="py-2 font-normal">Balance</th>
                    <th className="py-2 font-normal">Equity</th>
                    <th className="py-2 font-normal">Realized P&amp;L</th>
                    <th className="py-2 font-normal">Trades</th>
                  </tr>
                </thead>
                <tbody className="font-mono tabular-nums">
                  {summaryView === 'daily'
                    ? (pageRows as typeof dailyRowsSorted).map((r) => {
                        const rowBalance = balanceAsOf(dateOnlyKey(r.day), dailyPoints, toNumber(account.capital_base))
                        return (
                          <tr key={r.day} className="border-b border-border last:border-0">
                            <td className="py-2">{formatDateUTC(r.day)}</td>
                            <td className="py-2">{formatMoney(rowBalance)}</td>
                            <td className="py-2">{formatMoney(rowBalance)}</td>
                            <td className={`py-2 ${signClass[signOf(r.pnl_net)]}`}>{formatMoney(r.pnl_net)}</td>
                            <td className="py-2">{r.trade_count}</td>
                          </tr>
                        )
                      })
                    : (pageRows as typeof weeklyRows).map((r) => {
                        const rowBalance = balanceAsOf(r.endDay, dailyPoints, toNumber(account.capital_base))
                        return (
                          <tr key={r.week} className="border-b border-border last:border-0">
                            <td className="py-2">{r.week}</td>
                            <td className="py-2">{formatMoney(rowBalance)}</td>
                            <td className="py-2">{formatMoney(rowBalance)}</td>
                            <td className={`py-2 ${signClass[signOf(r.pnl)]}`}>{formatMoney(r.pnl)}</td>
                            <td className="py-2">{r.trades}</td>
                          </tr>
                        )
                      })}
                </tbody>
              </table>
            </div>
            <div className="text-xs text-text-muted mt-2">
              Balance/Equity is the running total as of the end of that {summaryView === 'daily' ? 'day' : "week's last trading day"}
              {' '}(capital base + realized P&amp;L + allocations to date). Equity matches Balance until intraday open
              positions are tracked.
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
