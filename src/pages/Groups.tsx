import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createAccountGroup, listAccountGroups } from '../api'
import { useApi } from '../hooks/useApi'
import { Card } from '../components/ui/Card'
import { StatCardSkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Button, Input } from '../components/ui/form'

function NewGroupForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await createAccountGroup({ name: name.trim() })
      setName('')
      setOpen(false)
      onCreated()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create group')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        + New Group
      </Button>
    )
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted">Name</label>
          <Input
            type="text"
            placeholder="e.g. Prop Accounts"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-56"
            autoFocus
          />
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setName('')
              setOpen(false)
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
      {error && <ErrorState message={error} />}
    </Card>
  )
}

export function Groups() {
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useApi(listAccountGroups, [])

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h1 className="text-2xl font-medium text-text-primary">Groups</h1>
        <NewGroupForm onCreated={refetch} />
      </div>

      {error && <ErrorState message="Couldn't load groups — check your connection and retry." onRetry={refetch} />}

      {!error && loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!error && !loading && (data ?? []).length === 0 && (
        <Card>
          <EmptyState
            title="No groups yet"
            description="Create a group above and assign any of your accounts to it for a combined balance and equity view."
          />
        </Card>
      )}

      {!error && !loading && (data ?? []).length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((g) => (
            <button key={g.id} type="button" onClick={() => navigate(`/groups/${g.id}`)} className="text-left">
              <Card className="hover:border-accent-violet transition-colors">
                <span className="text-sm font-medium text-text-primary">{g.name}</span>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
