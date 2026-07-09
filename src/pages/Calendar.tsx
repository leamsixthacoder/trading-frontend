import { useEffect, useMemo, useState } from 'react'
import { getAccountPnlDaily, getPortfolioPnlDaily, listAccounts, type PnlByDay, type PortfolioPnlByDay } from '../api'
import { useApi } from '../hooks/useApi'
import { monthLabel, toKey } from '../lib/calendar'
import { dateOnlyKey, formatMoney, signClass, signOf, toNumber } from '../lib/format'
import { Card } from '../components/ui/Card'
import { ChartSkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Button, Select } from '../components/ui/form'
import { MonthGrid, type DayPnl } from '../components/calendar/MonthGrid'
import { YearHeatmap } from '../components/calendar/YearHeatmap'
import { DayPanel } from '../components/calendar/DayPanel'
import { DayTradesTable } from '../components/calendar/DayTradesTable'

type View = 'day' | 'month' | 'year'

function isoDate(d: Date): string {
  return toKey(d)
}

export function Calendar() {
  const [view, setView] = useState<View>('month')
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [scope, setScope] = useState('all')
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null)

  const accounts = useApi(listAccounts, [])

  const rangeStart = useMemo(() => {
    if (view === 'year') return new Date(currentDate.getFullYear(), 0, 1)
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  }, [view, currentDate])

  const rangeEnd = useMemo(() => {
    if (view === 'year') return new Date(currentDate.getFullYear(), 11, 31)
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  }, [view, currentDate])

  const pnl = useApi<PnlByDay[] | PortfolioPnlByDay[]>(
    () =>
      scope === 'all'
        ? getPortfolioPnlDaily(isoDate(rangeStart), isoDate(rangeEnd))
        : getAccountPnlDaily(scope, isoDate(rangeStart), isoDate(rangeEnd)),
    [scope, isoDate(rangeStart), isoDate(rangeEnd)],
  )

  const dataByDay = useMemo(() => {
    const map: Record<string, DayPnl> = {}
    for (const row of pnl.data ?? []) {
      const key = 'day' in row ? dateOnlyKey(row.day) : ''
      map[key] = { pnl: toNumber(row.pnl_net), trades: row.trade_count }
    }
    return map
  }, [pnl.data])

  const maxAbs = useMemo(
    () => Object.values(dataByDay).reduce((max, d) => Math.max(max, Math.abs(d.pnl)), 0),
    [dataByDay],
  )

  function navigate(delta: number) {
    setCurrentDate((prev) => {
      const next = new Date(prev)
      if (view === 'year') next.setFullYear(next.getFullYear() + delta)
      else if (view === 'month') next.setMonth(next.getMonth() + delta)
      else next.setDate(next.getDate() + delta)
      return next
    })
  }

  useEffect(() => {
    setSelectedDayKey(null)
  }, [view, currentDate, scope])

  const label =
    view === 'year'
      ? String(currentDate.getFullYear())
      : view === 'month'
        ? monthLabel(currentDate.getFullYear(), currentDate.getMonth())
        : currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  const dayKey = isoDate(currentDate)
  const dayData = dataByDay[dayKey]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-medium text-text-primary">Calendar</h1>
        <div className="flex items-center gap-2">
          <Select value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="all">All accounts</option>
            {(accounts.data ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </Select>
          <div className="flex rounded-md border border-border p-0.5">
            {(['day', 'month', 'year'] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded px-2.5 py-1 text-xs capitalize transition-colors ${
                  view === v ? 'bg-surface-raised text-text-primary' : 'text-text-muted'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate(-1)} aria-label="Previous">
              ←
            </Button>
            <span className="text-sm font-medium text-text-primary w-48">{label}</span>
            <Button variant="secondary" onClick={() => navigate(1)} aria-label="Next">
              →
            </Button>
          </div>
          <Button variant="secondary" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>

        {pnl.error && (
          <ErrorState message="Couldn't load P&L history — check your connection and retry." onRetry={pnl.refetch} />
        )}
        {!pnl.error && pnl.loading && <ChartSkeleton height={320} />}

        {!pnl.error && !pnl.loading && view === 'month' && (
          <MonthGrid
            year={currentDate.getFullYear()}
            monthIndex0={currentDate.getMonth()}
            dataByDay={dataByDay}
            maxAbs={maxAbs}
            today={isoDate(new Date())}
            onDayClick={setSelectedDayKey}
          />
        )}

        {!pnl.error && !pnl.loading && view === 'year' && (
          <YearHeatmap
            year={currentDate.getFullYear()}
            dataByDay={dataByDay}
            maxAbs={maxAbs}
            onMonthClick={(m) => {
              setCurrentDate(new Date(currentDate.getFullYear(), m, 1))
              setView('month')
            }}
          />
        )}

        {!pnl.error && !pnl.loading && view === 'day' && (
          <>
            {!dayData || (dayData.pnl === 0 && dayData.trades === 0) ? (
              <EmptyState title="No trades this day" description="Nothing recorded for this date." />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 max-w-sm">
                  <div>
                    <div className="text-xs text-text-muted">Realized P&amp;L</div>
                    <div className={`font-mono tabular-nums text-xl ${signClass[signOf(dayData.pnl)]}`}>
                      {formatMoney(dayData.pnl)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted">Trades</div>
                    <div className="font-mono tabular-nums text-xl text-text-primary">{dayData.trades}</div>
                  </div>
                </div>
                <DayTradesTable dateKey={dayKey} accountId={scope === 'all' ? undefined : scope} />
              </div>
            )}
          </>
        )}
      </Card>

      {selectedDayKey && (
        <DayPanel
          dateKey={selectedDayKey}
          data={dataByDay[selectedDayKey]}
          accountId={scope === 'all' ? undefined : scope}
          onClose={() => setSelectedDayKey(null)}
        />
      )}
    </div>
  )
}
