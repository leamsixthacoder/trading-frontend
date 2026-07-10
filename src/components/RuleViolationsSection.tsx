import { useMemo, useState } from 'react'
import { getRuleViolations } from '../api'
import { useApi } from '../hooks/useApi'
import { toKey } from '../lib/calendar'
import { formatMoney } from '../lib/format'
import { Card } from './ui/Card'
import { EmptyState } from './ui/EmptyState'
import { ErrorState } from './ui/ErrorState'

type Range = 'week' | 'month'

const RULE_LABELS: Record<string, string> = {
  profit_target: 'Profit Target',
  daily_loss_limit: 'Daily Loss Limit',
  max_loss_limit: 'Max Loss Limit',
}

function rangeFor(range: Range): { start: string; end: string } {
  const now = new Date()
  if (range === 'week') {
    const start = new Date(now)
    start.setDate(start.getDate() - start.getDay())
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return { start: toKey(start), end: toKey(end) }
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { start: toKey(start), end: toKey(end) }
}

export function RuleViolationsSection() {
  const [range, setRange] = useState<Range>('month')
  const { start, end } = useMemo(() => rangeFor(range), [range])
  const violations = useApi(() => getRuleViolations(start, end), [start, end])

  const breached = (violations.data?.violations ?? []).filter((v) => v.breached_days > 0)

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm text-text-muted">Rule Violations</h2>
        <div className="flex rounded-md border border-border p-0.5">
          {(['week', 'month'] as Range[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded px-2.5 py-1 text-xs capitalize transition-colors ${
                range === r ? 'bg-surface-raised text-text-primary' : 'text-text-muted'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {violations.loading && <div className="text-sm text-text-muted">Loading…</div>}
      {violations.error && (
        <ErrorState
          message="Couldn't load rule violations — check your connection and retry."
          onRetry={violations.refetch}
        />
      )}
      {!violations.loading && !violations.error && (
        <>
          <div className="mb-4">
            <div className="text-xs text-text-muted">Total rule breaches this {range}</div>
            <div
              className={`font-mono tabular-nums text-2xl mt-1 ${
                (violations.data?.total_breached_days ?? 0) > 0 ? 'text-accent-red' : 'text-text-primary'
              }`}
            >
              {violations.data?.total_breached_days ?? 0}
            </div>
          </div>

          {breached.length === 0 ? (
            <EmptyState
              title="No rules broken"
              description={`Every account stayed within its configured rules this ${range}.`}
            />
          ) : (
            <ul className="divide-y divide-border">
              {breached.map((v) => (
                <li
                  key={`${v.account_id}-${v.rule_type}`}
                  className="flex items-center justify-between py-2.5 text-sm"
                >
                  <div>
                    <div className="text-text-primary">{v.account_label}</div>
                    <div className="text-text-muted">
                      {RULE_LABELS[v.rule_type] ?? v.rule_type} · threshold {formatMoney(v.threshold)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono tabular-nums text-text-primary">{v.breached_days}x</div>
                    {v.currently_breached && <div className="text-xs text-accent-red">currently breached</div>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Card>
  )
}
