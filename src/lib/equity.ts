import type { PnlByDay } from '../api'
import { toNumber } from './format'
import type { ChartPoint } from '../components/charts/LineAreaChart'

export function cumulativeBalanceSeries(rows: PnlByDay[], capitalBase: number): ChartPoint[] {
  const sorted = [...rows].sort((a, b) => a.day.localeCompare(b.day))
  let running = capitalBase
  return sorted.map((r) => {
    running += toNumber(r.pnl_net)
    return { time: r.day, value: running }
  })
}

export function cumulativePnlSeries(rows: PnlByDay[]): ChartPoint[] {
  const sorted = [...rows].sort((a, b) => a.day.localeCompare(b.day))
  let running = 0
  return sorted.map((r) => {
    running += toNumber(r.pnl_net)
    return { time: r.day, value: running }
  })
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
