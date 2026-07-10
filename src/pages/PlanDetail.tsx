import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  deleteTradingPlan,
  getTradingPlan,
  listAccountGroups,
  listAccounts,
  listChecklistItems,
  updateTradingPlan,
} from '../api'
import { useApi } from '../hooks/useApi'
import { StatCardSkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { StatusBadge } from '../components/ui/Badge'
import { Button, Input } from '../components/ui/form'
import { PlanStrategiesSection } from '../components/tradingPlans/PlanStrategiesSection'
import { PlanChecklistSection } from '../components/tradingPlans/PlanChecklistSection'
import { PlanDailyLogSection } from '../components/tradingPlans/PlanDailyLogSection'

export function PlanDetail() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const plan = useApi(() => getTradingPlan(id), [id])
  const accounts = useApi(listAccounts, [])
  const groups = useApi(listAccountGroups, [])
  const checklist = useApi(() => listChecklistItems(id), [id])

  const [editing, setEditing] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [descriptionValue, setDescriptionValue] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [statusBusy, setStatusBusy] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function startEdit() {
    if (!plan.data) return
    setNameValue(plan.data.name)
    setDescriptionValue(plan.data.description ?? '')
    setEditing(true)
    setEditError(null)
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault()
    if (!nameValue.trim()) return
    setEditSubmitting(true)
    setEditError(null)
    try {
      await updateTradingPlan(id, { name: nameValue.trim(), description: descriptionValue.trim() || null })
      await plan.refetch()
      setEditing(false)
    } catch (e) {
      setEditError(e instanceof Error ? e.message : 'Failed to update plan')
    } finally {
      setEditSubmitting(false)
    }
  }

  async function handleToggleStatus() {
    if (!plan.data) return
    setStatusBusy(true)
    try {
      await updateTradingPlan(id, { status: plan.data.status === 'active' ? 'archived' : 'active' })
      await plan.refetch()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Failed to update plan status')
    } finally {
      setStatusBusy(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete the plan "${plan.data?.name}"? This removes its checklist and daily logs too.`)) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteTradingPlan(id)
      navigate('/plans')
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Failed to delete plan')
      setDeleting(false)
    }
  }

  if (plan.error) {
    return <ErrorState message="Couldn't load this plan — check your connection and retry." onRetry={plan.refetch} />
  }

  if (plan.loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!plan.data) {
    return <EmptyState title="Plan not found" description="It may have been deleted or the link is out of date." />
  }

  const scopeLabel = plan.data.account_id
    ? (accounts.data?.find((a) => a.id === plan.data!.account_id)?.label ?? 'Account')
    : (groups.data?.find((g) => g.id === plan.data!.account_group_id)?.name ?? 'Group')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {editing ? (
            <form onSubmit={handleEdit} className="space-y-2">
              <Input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="text-xl w-72"
                autoFocus
              />
              <Input
                type="text"
                value={descriptionValue}
                onChange={(e) => setDescriptionValue(e.target.value)}
                placeholder="Description (optional)"
                className="w-72"
              />
              <div className="flex items-center gap-2">
                <Button type="submit" variant="secondary" disabled={editSubmitting}>
                  {editSubmitting ? 'Saving…' : 'Save'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
              {editError && <ErrorState message={editError} />}
            </form>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-medium text-text-primary">{plan.data.name}</h1>
                <StatusBadge status={plan.data.status} />
                <button type="button" onClick={startEdit} className="text-xs text-accent-violet hover:underline">
                  Edit
                </button>
              </div>
              {plan.data.description && (
                <div className="text-sm text-text-muted mt-1">{plan.data.description}</div>
              )}
              <div className="text-sm text-text-muted mt-1">
                Scope: {plan.data.account_id ? 'Account' : 'Group'} · {scopeLabel}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleToggleStatus} disabled={statusBusy}>
            {statusBusy ? 'Saving…' : plan.data.status === 'active' ? 'Archive' : 'Reactivate'}
          </Button>
          <Button variant="secondary" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete plan'}
          </Button>
        </div>
      </div>
      {deleteError && <ErrorState message={deleteError} />}

      <PlanStrategiesSection planId={id} />

      <PlanChecklistSection planId={id} onChanged={checklist.refetch} />

      <PlanDailyLogSection planId={id} checklistCount={checklist.data?.length ?? 0} />
    </div>
  )
}
