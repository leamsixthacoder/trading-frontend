import { useEffect, useState } from 'react'
import {
  attachPlanStrategy,
  detachPlanStrategy,
  listPlanStrategies,
  listStrategies,
  type TradingPlanStrategy,
} from '../../api'
import { useApi } from '../../hooks/useApi'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { ErrorState } from '../ui/ErrorState'
import { StrategyStatusBadge } from '../ui/Badge'
import { Button, Select } from '../ui/form'

export function PlanStrategiesSection({ planId }: { planId: string }) {
  const attached = useApi(() => listPlanStrategies(planId), [planId])
  const allStrategies = useApi(listStrategies, [])

  const [items, setItems] = useState<TradingPlanStrategy[]>([])
  useEffect(() => {
    if (attached.data) setItems(attached.data)
  }, [attached.data])

  const [selected, setSelected] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rowBusy, setRowBusy] = useState<string | null>(null)

  const available = (allStrategies.data ?? []).filter(
    (s) => !items.some((i) => i.strategy_id === s.id),
  )

  async function handleAttach() {
    if (!selected) return
    setSubmitting(true)
    setError(null)
    try {
      const row = await attachPlanStrategy(planId, selected)
      setItems((prev) => [...prev, row])
      setSelected('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to attach strategy')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDetach(strategyId: string) {
    setRowBusy(strategyId)
    try {
      await detachPlanStrategy(planId, strategyId)
      setItems((prev) => prev.filter((i) => i.strategy_id !== strategyId))
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Failed to detach strategy')
    } finally {
      setRowBusy(null)
    }
  }

  return (
    <Card>
      <div className="text-sm text-text-muted mb-3">Strategies</div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Select value={selected} onChange={(e) => setSelected(e.target.value)} className="w-56">
          <option value="">Attach a strategy…</option>
          {available.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
        <Button variant="secondary" onClick={handleAttach} disabled={submitting || !selected}>
          {submitting ? 'Attaching…' : 'Attach'}
        </Button>
      </div>
      {error && <ErrorState message={error} />}

      {attached.error ? (
        <ErrorState message="Couldn't load attached strategies — check your connection and retry." onRetry={attached.refetch} />
      ) : items.length === 0 ? (
        <EmptyState title="No strategies attached" description="Attach one or more strategies this plan is meant to trade." />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((i) => (
            <li key={i.strategy_id} className="flex items-center justify-between py-2.5 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-text-primary">{i.strategy_name}</span>
                <StrategyStatusBadge status={i.strategy_status} />
              </div>
              <button
                type="button"
                onClick={() => handleDetach(i.strategy_id)}
                disabled={rowBusy === i.strategy_id}
                className="text-xs text-accent-red hover:underline disabled:opacity-50"
              >
                {rowBusy === i.strategy_id ? 'Removing…' : 'Detach'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
