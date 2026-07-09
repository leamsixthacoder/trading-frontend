import { monthLabel, monthWeeks, pnlCellStyle } from '../../lib/calendar'
import { formatMoney, signClass, signOf } from '../../lib/format'
import type { DayPnl } from './MonthGrid'

interface YearHeatmapProps {
  year: number
  dataByDay: Record<string, DayPnl>
  maxAbs: number
  onMonthClick: (monthIndex0: number) => void
}

export function YearHeatmap({ year, dataByDay, maxAbs, onMonthClick }: YearHeatmapProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 12 }).map((_, monthIndex0) => {
        const weeks = monthWeeks(year, monthIndex0)
        const monthTotal = weeks
          .flat()
          .filter((d) => d.inCurrentMonth)
          .reduce((sum, d) => sum + (dataByDay[d.key]?.pnl ?? 0), 0)

        return (
          <button
            key={monthIndex0}
            type="button"
            onClick={() => onMonthClick(monthIndex0)}
            className="rounded-xl border border-border bg-surface p-3 text-left hover:border-accent-violet transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-text-primary">{monthLabel(year, monthIndex0)}</span>
              <span className={`font-mono tabular-nums text-xs ${signClass[signOf(monthTotal)]}`}>
                {formatMoney(monthTotal, true)}
              </span>
            </div>
            <div className="space-y-[3px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex gap-[3px]">
                  {week.map((day) => (
                    <div
                      key={day.key}
                      title={day.inCurrentMonth ? `${day.key}: ${formatMoney(dataByDay[day.key]?.pnl ?? 0)}` : undefined}
                      style={day.inCurrentMonth ? pnlCellStyle(dataByDay[day.key]?.pnl ?? 0, maxAbs) : undefined}
                      className={`h-3 flex-1 rounded-sm ${day.inCurrentMonth ? '' : 'opacity-0'}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </button>
        )
      })}
    </div>
  )
}
