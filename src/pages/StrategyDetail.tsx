import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import {
  getValidationStatus,
  listAccounts,
  listBacktests,
  listStrategies,
  runBacktest,
  updateStrategyStatus,
  validateStrategy,
  type Backtest,
  type StrategyStatus,
  type StrategyValidation,
} from '../api'
import { useApi } from '../hooks/useApi'
import { formatDate, formatDateUTC, formatMoney, formatPct, signClass, signOf } from '../lib/format'
import { Card } from '../components/ui/Card'
import { StatCardSkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { StrategyStatusBadge } from '../components/ui/Badge'
import { Button, Input, Select } from '../components/ui/form'

const KNOWN_RULE_KEYS = ['entry', 'exit', 'position_sizing']
const RULE_LABELS: Record<string, string> = {
  entry: 'Entry condition',
  exit: 'Exit condition',
  position_sizing: 'Position sizing',
}

function RulesView({ rules }: { rules: Record<string, unknown> }) {
  const [rawOpen, setRawOpen] = useState(false)
  const knownEntries = KNOWN_RULE_KEYS.filter((k) => rules[k] !== undefined)
  const extraKeys = Object.keys(rules).filter((k) => !KNOWN_RULE_KEYS.includes(k))

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-text-muted">Rules</div>
        <span className="text-xs text-text-muted">Set at creation — not editable yet</span>
      </div>
      {knownEntries.length === 0 && extraKeys.length === 0 ? (
        <EmptyState title="No rules recorded" description="This strategy was created without structured rules." />
      ) : (
        <div className="space-y-3">
          {knownEntries.map((k) => (
            <div key={k}>
              <div className="text-xs text-text-muted">{RULE_LABELS[k]}</div>
              <div className="text-sm text-text-primary">{String(rules[k])}</div>
            </div>
          ))}
          {extraKeys.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setRawOpen((v) => !v)}
                className="text-xs text-accent-violet hover:underline"
              >
                {rawOpen ? 'Hide raw JSON' : `Show ${extraKeys.length} more field(s) as raw JSON`}
              </button>
              {rawOpen && (
                <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-surface-raised p-3 font-mono text-xs text-text-primary">
                  {JSON.stringify(Object.fromEntries(extraKeys.map((k) => [k, rules[k]])), null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export function StrategyDetail() {
  const { id = '' } = useParams<{ id: string }>()
  const strategies = useApi(listStrategies, [])
  const backtests = useApi(() => listBacktests(id), [id])
  const validation = useApi(() => getValidationStatus(id), [id])
  const accounts = useApi(listAccounts, [])

  const strategy = useMemo(() => strategies.data?.find((s) => s.id === id), [strategies.data, id])

  const [backtestItems, setBacktestItems] = useState<Backtest[]>([])
  useEffect(() => {
    if (backtests.data) setBacktestItems(backtests.data)
  }, [backtests.data])

  const [validationByBacktest, setValidationByBacktest] = useState<Record<string, StrategyValidation>>({})
  const [notesByBacktest, setNotesByBacktest] = useState<Record<string, string>>({})
  const [validatingId, setValidatingId] = useState<string | null>(null)

  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 1)
    return d.toISOString().slice(0, 10)
  })
  const [periodEnd, setPeriodEnd] = useState(() => new Date().toISOString().slice(0, 10))
  const [tags, setTags] = useState('')
  const [accountId, setAccountId] = useState('')
  const [runningBacktest, setRunningBacktest] = useState(false)
  const [backtestError, setBacktestError] = useState<string | null>(null)

  const [statusUpdating, setStatusUpdating] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [statusOverride, setStatusOverride] = useState<StrategyStatus | null>(null)

  const effectiveStatus = statusOverride ?? strategy?.status

  async function handleRunBacktest(e: FormEvent) {
    e.preventDefault()
    setRunningBacktest(true)
    setBacktestError(null)
    try {
      const result = await runBacktest(id, {
        period_start: periodStart,
        period_end: periodEnd,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        account_id: accountId || null,
      })
      setBacktestItems((prev) => [result, ...prev])
    } catch (e) {
      setBacktestError(e instanceof Error ? e.message : 'Backtest failed')
    } finally {
      setRunningBacktest(false)
    }
  }

  async function handleValidate(backtestId: string, approved: boolean) {
    setValidatingId(backtestId)
    try {
      const result = await validateStrategy(id, backtestId, approved, notesByBacktest[backtestId])
      setValidationByBacktest((prev) => ({ ...prev, [backtestId]: result }))
      validation.refetch()
    } catch {
      // surfaced inline via the validation column staying blank; user can retry
    } finally {
      setValidatingId(null)
    }
  }

  async function handleStatusChange(status: StrategyStatus) {
    setStatusUpdating(true)
    setStatusError(null)
    try {
      const updated = await updateStrategyStatus(id, status)
      setStatusOverride(updated.status)
    } catch (e) {
      setStatusError(e instanceof Error ? e.message : 'Failed to update status')
    } finally {
      setStatusUpdating(false)
    }
  }

  if (strategies.error) {
    return <ErrorState message="Couldn't load strategy — check your connection and retry." onRetry={strategies.refetch} />
  }
  if (strategies.loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    )
  }
  if (!strategy) {
    return <EmptyState title="Strategy not found" description="It may have been removed or the link is out of date." />
  }

  const canMarkLive = validation.data?.has_approval ?? false
  const markLiveTooltip = canMarkLive
    ? 'Flip this strategy to live'
    : 'Run a backtest and get it validated (approved) before marking live'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-medium text-text-primary">{strategy.name}</h1>
            <StrategyStatusBadge status={effectiveStatus ?? strategy.status} />
          </div>
          {strategy.description && <div className="text-sm text-text-muted mt-1">{strategy.description}</div>}
          <div className="text-xs text-text-muted mt-1">Created {formatDate(strategy.created_at)}</div>
        </div>
        <div className="flex items-center gap-2">
          {effectiveStatus === 'draft' && (
            <Button variant="secondary" disabled={statusUpdating} onClick={() => handleStatusChange('backtesting')}>
              Start backtesting
            </Button>
          )}
          {effectiveStatus !== 'retired' && effectiveStatus !== 'live' && (
            <Button variant="secondary" disabled={statusUpdating} onClick={() => handleStatusChange('retired')}>
              Retire
            </Button>
          )}
          <span title={markLiveTooltip}>
            <Button
              variant="violet"
              disabled={!canMarkLive || statusUpdating || effectiveStatus === 'live'}
              onClick={() => handleStatusChange('live')}
            >
              {effectiveStatus === 'live' ? 'Live' : 'Mark Live'}
            </Button>
          </span>
        </div>
      </div>
      {statusError && <ErrorState message={statusError} />}

      <RulesView rules={strategy.rules} />

      <Card>
        <div className="text-sm text-text-muted mb-3">Run a backtest</div>
        <form onSubmit={handleRunBacktest} className="flex flex-wrap items-end gap-2">
          <div>
            <div className="text-xs text-text-muted mb-1">Start</div>
            <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} required />
          </div>
          <div>
            <div className="text-xs text-text-muted mb-1">End</div>
            <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} required />
          </div>
          <div>
            <div className="text-xs text-text-muted mb-1">Tags</div>
            <Input
              type="text"
              placeholder="tag1,tag2"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-40"
            />
          </div>
          <div>
            <div className="text-xs text-text-muted mb-1">Account</div>
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value="">All accounts</option>
              {(accounts.data ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="violet" disabled={runningBacktest}>
            {runningBacktest ? 'Running…' : 'Run backtest'}
          </Button>
        </form>
        {backtestError && <ErrorState message={backtestError} />}
      </Card>

      <Card>
        <div className="text-sm text-text-muted mb-3">Backtest history</div>
        {backtests.error && (
          <ErrorState message="Couldn't load backtests — check your connection and retry." onRetry={backtests.refetch} />
        )}
        {!backtests.error && backtests.loading && <div className="text-sm text-text-muted">Loading…</div>}
        {!backtests.error && !backtests.loading && backtestItems.length === 0 && (
          <EmptyState title="No backtests yet" description="Run one above to see results here." />
        )}
        {!backtests.error && !backtests.loading && backtestItems.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-muted">
                  <th className="py-2 font-normal">Period</th>
                  <th className="py-2 font-normal">Data source</th>
                  <th className="py-2 font-normal">Trades</th>
                  <th className="py-2 font-normal">Win rate</th>
                  <th className="py-2 font-normal">Total P&amp;L</th>
                  <th className="py-2 font-normal">Max DD</th>
                  <th className="py-2 font-normal">Sharpe</th>
                  <th className="py-2 font-normal">Validate</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {backtestItems.map((b) => {
                  const v = validationByBacktest[b.id]
                  return (
                    <tr key={b.id} className="border-b border-border last:border-0 align-top">
                      <td className="py-2 whitespace-nowrap">
                        {formatDateUTC(b.period_start)} → {formatDateUTC(b.period_end)}
                      </td>
                      <td className="py-2 font-sans">{b.data_source}</td>
                      <td className="py-2">{b.total_trades}</td>
                      <td className="py-2">{formatPct(b.win_rate, { fromRatio: true })}</td>
                      <td className={`py-2 ${signClass[signOf(b.total_pnl)]}`}>
                        {b.total_pnl ? formatMoney(b.total_pnl) : '—'}
                      </td>
                      <td className="py-2">{b.max_drawdown ? formatMoney(b.max_drawdown) : '—'}</td>
                      <td className="py-2">{b.sharpe_ratio ?? '—'}</td>
                      <td className="py-2 font-sans">
                        {v ? (
                          <span className={v.approved ? 'text-accent-green' : 'text-accent-red'}>
                            {v.approved ? 'Approved' : 'Rejected'}
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <Input
                              type="text"
                              placeholder="Notes (optional)"
                              value={notesByBacktest[b.id] ?? ''}
                              onChange={(e) =>
                                setNotesByBacktest((prev) => ({ ...prev, [b.id]: e.target.value }))
                              }
                              className="w-40 text-xs"
                            />
                            <div className="flex gap-1">
                              <Button
                                variant="secondary"
                                disabled={validatingId === b.id}
                                onClick={() => handleValidate(b.id, true)}
                                className="text-accent-green"
                              >
                                Approve
                              </Button>
                              <Button
                                variant="secondary"
                                disabled={validatingId === b.id}
                                onClick={() => handleValidate(b.id, false)}
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
