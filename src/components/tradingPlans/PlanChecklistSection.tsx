import { useEffect, useState, type FormEvent } from 'react'
import { createChecklistItem, deleteChecklistItem, listChecklistItems, type ChecklistItem } from '../../api'
import { useApi } from '../../hooks/useApi'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { ErrorState } from '../ui/ErrorState'
import { Button, Input } from '../ui/form'

export function PlanChecklistSection({
  planId,
  onChanged,
}: {
  planId: string
  onChanged?: () => void
}) {
  const checklist = useApi(() => listChecklistItems(planId), [planId])

  const [items, setItems] = useState<ChecklistItem[]>([])
  useEffect(() => {
    if (checklist.data) setItems(checklist.data)
  }, [checklist.data])

  const [label, setLabel] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rowBusy, setRowBusy] = useState<string | null>(null)

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!label.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const created = await createChecklistItem(planId, { label: label.trim(), sort_order: items.length })
      setItems((prev) => [...prev, created])
      setLabel('')
      onChanged?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add checklist item')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(itemId: string) {
    setRowBusy(itemId)
    try {
      await deleteChecklistItem(planId, itemId)
      setItems((prev) => prev.filter((i) => i.id !== itemId))
      onChanged?.()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Failed to delete checklist item')
    } finally {
      setRowBusy(null)
    }
  }

  return (
    <Card>
      <div className="text-sm text-text-muted mb-3">Checklist</div>

      <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-2 mb-4">
        <Input
          type="text"
          placeholder="e.g. Checked economic calendar"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-64"
        />
        <Button type="submit" variant="secondary" disabled={submitting || !label.trim()}>
          {submitting ? 'Adding…' : 'Add item'}
        </Button>
      </form>
      {error && <ErrorState message={error} />}

      {checklist.error ? (
        <ErrorState message="Couldn't load the checklist — check your connection and retry." onRetry={checklist.refetch} />
      ) : items.length === 0 ? (
        <EmptyState title="No checklist items yet" description="Add the steps this plan expects you to follow every day." />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((i) => (
            <li key={i.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-text-primary">{i.label}</span>
              <button
                type="button"
                onClick={() => handleDelete(i.id)}
                disabled={rowBusy === i.id}
                className="text-xs text-accent-red hover:underline disabled:opacity-50"
              >
                {rowBusy === i.id ? 'Removing…' : 'Remove'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
