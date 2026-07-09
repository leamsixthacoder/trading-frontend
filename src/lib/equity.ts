import type { Allocation, PnlByDay } from '../api'
import { dateOnlyKey, toNumber } from './format'
import type { ChartPoint } from '../components/charts/LineAreaChart'

export function cumulativeBalanceSeries(rows: PnlByDay[], capitalBase: number): ChartPoint[] {
  const sorted = [...rows].sort((a, b) => a.day.localeCompare(b.day))
  let running = capitalBase
  return sorted.map((r) => {
    running += toNumber(r.pnl_net)
    return { time: dateOnlyKey(r.day), value: running }
  })
}

export function cumulativePnlSeries(rows: PnlByDay[]): ChartPoint[] {
  const sorted = [...rows].sort((a, b) => a.day.localeCompare(b.day))
  let running = 0
  return sorted.map((r) => {
    running += toNumber(r.pnl_net)
    return { time: dateOnlyKey(r.day), value: running }
  })
}

export interface DayBalancePoint {
  day: string
  balance: number
}

// Balance as of the end of each day that had activity (a closed trade or an
// allocation), for the Daily/Weekly Summary table (FRONTEND_SPEC.md §4).
// Unlike cumulativeBalanceSeries (used by the Account Equity chart), this
// folds in allocations — a payout/reserve/etc. actually moves the balance,
// so leaving it out here would make the table disagree with the "Balance"
// stat card above it, which reads from account_balances and does include
// allocations.
export function dailyBalancePoints(rows: PnlByDay[], allocations: Allocation[], capitalBase: number): DayBalancePoint[] {
  const changeByDay = new Map<string, number>()
  for (const r of rows) {
    const key = dateOnlyKey(r.day)
    changeByDay.set(key, (changeByDay.get(key) ?? 0) + toNumber(r.pnl_net))
  }
  for (const a of allocations) {
    const key = dateOnlyKey(a.created_at)
    changeByDay.set(key, (changeByDay.get(key) ?? 0) + toNumber(a.amount))
  }

  const days = Array.from(changeByDay.keys()).sort()
  let running = capitalBase
  return days.map((day) => {
    running += changeByDay.get(day)!
    return { day, balance: running }
  })
}

// Balance as of the end of `day` — the last activity day at or before it,
// or capitalBase if nothing had happened yet by then. `points` must be
// sorted ascending by day (dailyBalancePoints already returns it that way).
export function balanceAsOf(day: string, points: DayBalancePoint[], capitalBase: number): number {
  let balance = capitalBase
  for (const p of points) {
    if (p.day > day) break
    balance = p.balance
  }
  return balance
}

export function mergeAggregateBalance(
  accounts: { capitalBase: number; rows: PnlByDay[] }[],
): ChartPoint[] {
  const perAccountSeries = accounts.map((a) => cumulativeBalanceSeries(a.rows, a.capitalBase))
  const allDates = Array.from(new Set(perAccountSeries.flatMap((s) => s.map((p) => p.time)))).sort()
  if (allDates.length === 0) return []

  return allDates.map((date) => {
    let total = 0
    perAccountSeries.forEach((series, i) => {
      const lastAtOrBefore = [...series].reverse().find((p) => p.time <= date)
      total += lastAtOrBefore ? lastAtOrBefore.value : accounts[i].capitalBase
    })
    return { time: date, value: total }
  })
}
