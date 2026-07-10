import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createTradingPlan,
  listAccountGroups,
  listAccounts,
  listTradingPlans,
  type TradingPlan,
} from '../api'
import { useApi } from '../hooks/useApi'
import { Card } from '../components/ui/Card'
import { StatCardSkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { StatusBadge } from '../components/ui/Badge'
import { Button, Input, Select } from '../components/ui/form'

type Scope = 'account' | 'group'

function NewPlanForm({ onCreated }: { onCreated: (plan: TradingPlan) => void }) {
  const accounts = useApi(listAccounts, [])
  const groups = useApi(listAccountGroups, [])

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [scope, setScope] = useState<Scope>('account')
  const [scopeId, setScopeId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !scopeId) return
    setSubmitting(true)
    setError(null)
    try {
      const created = await createTradingPlan({
        name: name.trim(),
        description: description.trim() || null,
        account_id: scope === 'account' ? scopeId : null,
        account_group_id: scope === 'group' ? scopeId : null,
      })
      onCreated(created)
      setName('')
      setDescription('')
      setScopeId('')
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create trading plan')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <Button variant="violet" onClick={() => setOpen(true)}>
        New plan
      </Button>
    )
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            type="text"
            placeholder="Plan name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <Input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={scope}
            onChange={(e) => {
              setScope(e.target.value as Scope)
              setScopeId('')
            }}
            className="w-32"
          >
            <option value="account">Account</option>
            <option value="group">Group</option>
          </Select>
          <Select value={scopeId} onChange={(e) => setScopeId(e.target.value)} className="w-56">
            <option value="">{scope === 'account' ? 'Select an account…' : 'Select a group…'}</option>
            {scope === 'account'
              ? (accounts.data ?? []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))
              : (groups.data ?? []).map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" variant="violet" disabled={submitting || !name.trim() || !scopeId}>
            {submitting ? 'Creating…' : 'Create'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
      {error && <ErrorState message={error} />}
    </Card>
  )
}

export function PlansList() {
  const navigate = useNavigate()
  const plans = useApi(listTradingPlans, [])
  const accounts = useApi(listAccounts, [])
  const groups = useApi(listAccountGroups, [])

  const [items, setItems] = useState<TradingPlan[]>([])
  useEffect(() => {
    if (plans.data) setItems(plans.data)
  }, [plans.data])

  function scopeLabel(plan: TradingPlan): string {
    if (plan.account_id) {
      return accounts.data?.find((a) => a.id === plan.account_id)?.label ?? 'Account'
    }
    return groups.data?.find((g) => g.id === plan.account_group_id)?.name ?? 'Group'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium text-text-primary">Trading Plans</h1>
        <NewPlanForm onCreated={(plan) => setItems((prev) => [plan, ...prev])} />
      </div>

      {plans.error && (
        <ErrorState message="Couldn't load trading plans — check your connection and retry." onRetry={plans.refetch} />
      )}

      {!plans.error && plans.loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!plans.error && !plans.loading && items.length === 0 && (
        <Card>
          <EmptyState
            title="No trading plans yet"
            description="Create a plan for an account or a group, attach strategies to it, and check off your daily checklist."
          />
        </Card>
      )}

      {!plans.error && !plans.loading && items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <button key={p.id} type="button" onClick={() => navigate(`/plans/${p.id}`)} className="text-left">
              <Card className="hover:border-accent-violet transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-text-primary">{p.name}</span>
                  <StatusBadge status={p.status} />
                </div>
                {p.description && <div className="text-xs text-text-muted mt-1 line-clamp-2">{p.description}</div>}
                <div className="text-xs text-text-muted mt-3">{scopeLabel(p)}</div>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
