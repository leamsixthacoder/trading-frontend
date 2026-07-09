import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createPositionSizingRule,
  createStrategy,
  listBacktests,
  listStrategies,
  type Backtest,
  type ConditionGroup,
  type PositionSizingMethod,
  type Strategy,
} from '../api'
import { useApi } from '../hooks/useApi'
import { formatMoney, formatPct, signClass, signOf } from '../lib/format'
import { Card } from '../components/ui/Card'
import { StatCardSkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { StrategyStatusBadge } from '../components/ui/Badge'
import { Button, Input, Select } from '../components/ui/form'
import { ConditionBuilder } from '../components/strategies/ConditionBuilder'
import { emptyConditionGroup } from '../components/strategies/conditions'
import { SIZING_METHOD_LABELS, buildSizingParameters } from '../components/strategies/positionSizing'

function nonEmptyConditions(group: ConditionGroup): ConditionGroup | null {
  const conditions = group.conditions.filter((c) => c.indicator.trim())
  return conditions.length > 0 ? { logic: group.logic, conditions } : null
}

function useLatestBacktests(strategies: Strategy[] | null) {
  const [map, setMap] = useState<Record<string, Backtest | undefined>>({})

  useEffect(() => {
    if (!strategies || strategies.length === 0) return
    let cancelled = false
    Promise.all(strategies.map((s) => listBacktests(s.id).catch(() => [] as Backtest[]))).then(
      (results) => {
        if (cancelled) return
        const next: Record<string, Backtest | undefined> = {}
        strategies.forEach((s, i) => {
          const sorted = [...results[i]].sort((a, b) => b.created_at.localeCompare(a.created_at))
          next[s.id] = sorted[0]
        })
        setMap(next)
      },
    )
    return () => {
      cancelled = true
    }
  }, [strategies])

  return map
}

export function StrategiesList() {
  const navigate = useNavigate()
  const strategies = useApi(listStrategies, [])
  const latestBacktests = useLatestBacktests(strategies.data)

  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [entryGroup, setEntryGroup] = useState<ConditionGroup>(emptyConditionGroup)
  const [exitGroup, setExitGroup] = useState<ConditionGroup>(emptyConditionGroup)
  const [sizingMethod, setSizingMethod] = useState<PositionSizingMethod>('fixed_contracts')
  const [sizingValue, setSizingValue] = useState('')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [rawExtra, setRawExtra] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<Strategy[]>([])

  useEffect(() => {
    if (strategies.data) setItems(strategies.data)
  }, [strategies.data])

  const rawExtraError = useMemo(() => {
    if (!rawExtra.trim()) return null
    try {
      const parsed = JSON.parse(rawExtra)
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return 'Advanced rules must be a JSON object'
      }
      return null
    } catch {
      return 'Invalid JSON'
    }
  }, [rawExtra])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || rawExtraError) return
    setSubmitting(true)
    setError(null)
    try {
      const extra = rawExtra.trim() ? JSON.parse(rawExtra) : {}
      const rules: Record<string, unknown> = { ...extra }
      const entry = nonEmptyConditions(entryGroup)
      const exit = nonEmptyConditions(exitGroup)
      if (entry) rules.entry = entry
      if (exit) rules.exit = exit

      const created = await createStrategy({ name, description: description || null, rules })
      setItems((prev) => [created, ...prev])

      if (sizingValue.trim()) {
        try {
          const parameters = buildSizingParameters(sizingMethod, sizingValue)
          await createPositionSizingRule({ strategy_id: created.id, method: sizingMethod, parameters })
        } catch (sizingErr) {
          setError(
            `Strategy created, but position sizing rule failed: ${
              sizingErr instanceof Error ? sizingErr.message : 'unknown error'
            }`,
          )
        }
      }

      setName('')
      setDescription('')
      setEntryGroup(emptyConditionGroup())
      setExitGroup(emptyConditionGroup())
      setSizingMethod('fixed_contracts')
      setSizingValue('')
      setRawExtra('')
      setShowCreate(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create strategy')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium text-text-primary">Strategies</h1>
        <Button variant="violet" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? 'Cancel' : 'New strategy'}
        </Button>
      </div>

      {showCreate && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                type="text"
                placeholder="Strategy name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                type="text"
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <ConditionBuilder
              label="Entry conditions"
              datalistId="entry-indicators"
              value={entryGroup}
              onChange={setEntryGroup}
            />
            <ConditionBuilder
              label="Exit conditions"
              datalistId="exit-indicators"
              value={exitGroup}
              onChange={setExitGroup}
            />

            <div>
              <div className="text-xs text-text-muted mb-1.5">Position sizing</div>
              <div className="flex items-center gap-1.5">
                <Select
                  value={sizingMethod}
                  onChange={(e) => setSizingMethod(e.target.value as PositionSizingMethod)}
                  className="w-44"
                >
                  {Object.entries(SIZING_METHOD_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
                <Input
                  type="text"
                  placeholder={sizingMethod === 'custom' ? 'Notes' : 'Value'}
                  value={sizingValue}
                  onChange={(e) => setSizingValue(e.target.value)}
                  className="w-40"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              className="text-xs text-accent-violet hover:underline"
            >
              {advancedOpen ? 'Hide advanced (raw JSON)' : 'Advanced: raw JSON rules'}
            </button>
            {advancedOpen && (
              <div>
                <textarea
                  value={rawExtra}
                  onChange={(e) => setRawExtra(e.target.value)}
                  placeholder='{"stop_loss_pct": 1.5}'
                  rows={4}
                  className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus-visible:border-accent-violet"
                />
                <div className="text-xs text-text-muted mt-1">
                  Merged into the structured fields above. Covers anything the form doesn't have a field for
                  yet.
                </div>
                {rawExtraError && <div className="text-xs text-accent-red mt-1">{rawExtraError}</div>}
              </div>
            )}

            <Button type="submit" variant="violet" disabled={submitting || !!rawExtraError}>
              {submitting ? 'Creating…' : 'Create strategy'}
            </Button>
          </form>
          {error && <ErrorState message={error} />}
        </Card>
      )}

      {strategies.error && (
        <ErrorState message="Couldn't load strategies — check your connection and retry." onRetry={strategies.refetch} />
      )}

      {!strategies.error && strategies.loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!strategies.error && !strategies.loading && items.length === 0 && (
        <Card>
          <EmptyState
            title="No strategies yet"
            description="Create one to start backtesting."
            action={
              <Button variant="violet" onClick={() => setShowCreate(true)}>
                New strategy
              </Button>
            }
          />
        </Card>
      )}

      {!strategies.error && !strategies.loading && items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s) => {
            const backtest = latestBacktests[s.id]
            return (
              <button key={s.id} type="button" onClick={() => navigate(`/strategies/${s.id}`)} className="text-left">
                <Card className="hover:border-accent-violet transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-text-primary">{s.name}</span>
                    <StrategyStatusBadge status={s.status} />
                  </div>
                  {s.description && <div className="text-xs text-text-muted mt-1 line-clamp-2">{s.description}</div>}
                  {backtest ? (
                    <div className="flex items-center gap-4 mt-3">
                      <div>
                        <div className="text-xs text-text-muted">Win rate</div>
                        <div className="font-mono tabular-nums text-sm text-text-primary">
                          {formatPct(backtest.win_rate, { fromRatio: true })}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-text-muted">Total P&amp;L</div>
                        <div className={`font-mono tabular-nums text-sm ${signClass[signOf(backtest.total_pnl)]}`}>
                          {backtest.total_pnl ? formatMoney(backtest.total_pnl) : '—'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-text-muted mt-3">No backtests yet</div>
                  )}
                </Card>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
