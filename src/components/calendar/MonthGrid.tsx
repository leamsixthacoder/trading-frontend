import { monthWeeks, pnlCellStyle } from '../../lib/calendar'
import { formatMoney, signClass, signOf } from '../../lib/format'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export interface DayPnl {
  pnl: number
  trades: number
}

interface MonthGridProps {
  year: number
  monthIndex0: number
  dataByDay: Record<string, DayPnl>
  maxAbs: number
  today: string
  onDayClick: (key: string) => void
}

export function MonthGrid({ year, monthIndex0, dataByDay, maxAbs, today, onDayClick }: MonthGridProps) {
  const weeks = monthWeeks(year, monthIndex0)

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-8 gap-1 mb-1">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="text-center text-xs text-text-muted py-1">
              {label}
            </div>
          ))}
          <div className="text-center text-xs text-text-muted py-1">Week</div>
        </div>
        {weeks.map((week, wi) => {
          const weekTotal = week.reduce((sum, day) => sum + (dataByDay[day.key]?.pnl ?? 0), 0)
          return (
            <div key={wi} className="grid grid-cols-8 gap-1 mb-1">
              {week.map((day) => {
                const entry = dataByDay[day.key]
                const pnl = entry?.pnl ?? 0
                const isToday = day.key === today
                return (
                  <button
                    key={day.key}
                    type="button"
                    disabled={!day.inCurrentMonth}
                    onClick={() => onDayClick(day.key)}
                    style={day.inCurrentMonth ? pnlCellStyle(pnl, maxAbs) : undefined}
                    className={`rounded-md p-2 text-left transition-colors ${
                      day.inCurrentMonth
                        ? 'hover:outline hover:outline-1 hover:outline-accent-violet cursor-pointer'
                        : 'opacity-30 cursor-default'
                    } ${isToday ? 'ring-1 ring-accent-violet' : ''}`}
                  >
                    <div className="text-xs text-text-muted">{day.date.getDate()}</div>
                    {day.inCurrentMonth && entry && (
                      <>
                        <div className={`font-mono tabular-nums text-xs mt-1 ${signClass[signOf(pnl)]}`}>
                          {formatMoney(pnl, true)}
                        </div>
                        <div className="text-[10px] text-text-muted">{entry.trades} trades</div>
                      </>
                    )}
                  </button>
                )
              })}
              <div className="rounded-md border border-border p-2 flex flex-col justify-center">
                <div className="text-[10px] text-text-muted">Total</div>
                <div className={`font-mono tabular-nums text-xs ${signClass[signOf(weekTotal)]}`}>
                  {formatMoney(weekTotal, true)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
