import { useEffect } from 'react'
import { formatMoney, signClass, signOf } from '../../lib/format'
import { EmptyState } from '../ui/EmptyState'
import { DayTradesTable } from './DayTradesTable'
import type { DayPnl } from './MonthGrid'

interface DayPanelProps {
  dateKey: string
  data: DayPnl | undefined
  accountId: string | undefined
  onClose: () => void
}

export function DayPanel({ dateKey, data, accountId, onClose }: DayPanelProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const pnl = data?.pnl ?? 0

  return (
    <div className="fixed inset-0 z-20 flex justify-end bg-black/50" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Trades on ${dateKey}`}
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-sm border-l border-border bg-surface p-5 overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-text-primary">{dateKey}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border p-1.5 text-text-muted hover:text-text-primary"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {!data || (pnl === 0 && data.trades === 0) ? (
          <EmptyState title="No trades this day" description="Nothing recorded for this date." />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <div className="text-xs text-text-muted">Realized P&amp;L</div>
                <div className={`font-mono tabular-nums text-xl ${signClass[signOf(pnl)]}`}>{formatMoney(pnl)}</div>
              </div>
              <div>
                <div className="text-xs text-text-muted">Trades</div>
                <div className="font-mono tabular-nums text-xl text-text-primary">{data.trades}</div>
              </div>
            </div>
            <DayTradesTable dateKey={dateKey} accountId={accountId} />
          </>
        )}
      </div>
    </div>
  )
}
