import { useEffect, useState } from 'react'
import { getDailyLog, listDailyLogs, upsertDailyLog, type DailyLogItem, type DailyLogSummary } from '../../api'
import { useApi } from '../../hooks/useApi'
import { toKey } from '../../lib/calendar'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { ErrorState } from '../ui/ErrorState'
import { Button, Input } from '../ui/form'

function monthRange(date: Date): { start: string; end: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return { start: toKey(start), end: toKey(end) }
}

export function PlanDailyLogSection({ planId, checklistCount }: { planId: string; checklistCount: number }) {
  const [logDate, setLogDate] = useState(() => toKey(new Date()))
  // checklistCount is a dep, not just a prop read, so adding/removing a
  // checklist item mid-session re-fetches the merged default-item list
  // instead of leaving this section showing whatever items existed the
  // last time the log for this date was fetched.
  const log = useApi(() => getDailyLog(planId, logDate), [planId, logDate, checklistCount])

  const [items, setItems] = useState<DailyLogItem[]>([])
  const [notes, setNotes] = useState('')
  useEffect(() => {
    if (log.data) {
      setItems(log.data.items)
      setNotes(log.data.notes ?? '')
    }
  }, [log.data])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { start, end } = monthRange(new Date(logDate))
  const history = useApi<DailyLogSummary[]>(() => listDailyLogs(planId, start, end), [planId, start, end])

  function toggleItem(checklistItemId: string) {
    setItems((prev) =>
      prev.map((i) => (i.checklist_item_id === checklistItemId ? { ...i, checked: !i.checked } : i)),
    )
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await upsertDailyLog(planId, logDate, {
        notes: notes.trim() || null,
        items: items.map((i) => ({ checklist_item_id: i.checklist_item_id, checked: i.checked })),
      })
      history.refetch()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save daily log')
    } finally {
      setSaving(false)
    }
  }

  if (checklistCount === 0) {
    return (
      <Card>
        <div className="text-sm text-text-muted mb-3">Daily Log</div>
        <EmptyState title="Add a checklist first" description="The daily log tracks whether each checklist item was followed." />
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-text-muted">Daily Log</div>
        <Input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className="w-40" />
      </div>

      {log.error && (
        <ErrorState message="Couldn't load this day's log — check your connection and retry." onRetry={log.refetch} />
      )}

      {!log.error && (
        <>
          <ul className="divide-y divide-border mb-4">
            {items.map((i) => (
              <li key={i.checklist_item_id} className="flex items-center gap-3 py-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={i.checked}
                  onChange={() => toggleItem(i.checklist_item_id)}
                  className="h-4 w-4 accent-accent-violet"
                />
                <span className={i.checked ? 'text-text-primary' : 'text-text-muted'}>{i.label}</span>
              </li>
            ))}
          </ul>

          <div className="mb-4">
            <div className="text-xs text-text-muted mb-1">Notes</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Anything worth remembering about how today went"
              className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:border-accent-violet"
            />
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save log'}
          </Button>
          {error && <ErrorState message={error} />}
        </>
      )}

      <div className="mt-6">
        <div className="text-xs text-text-muted mb-2">This month</div>
        {history.error ? (
          <ErrorState message="Couldn't load log history." onRetry={history.refetch} />
        ) : (history.data ?? []).length === 0 ? (
          <div className="text-sm text-text-muted">No logged days yet this month.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-muted">
                  <th className="py-2 pr-4 font-normal">Date</th>
                  <th className="py-2 pr-4 font-normal">Completed</th>
                  <th className="py-2 font-normal">Notes</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {(history.data ?? []).map((h) => (
                  <tr key={h.log_date} className="border-b border-border last:border-0">
                    <td className="py-2 pr-4">
                      <button
                        type="button"
                        onClick={() => setLogDate(h.log_date)}
                        className="text-accent-violet hover:underline"
                      >
                        {h.log_date}
                      </button>
                    </td>
                    <td className="py-2 pr-4">
                      {h.checked_items}/{h.total_items}
                    </td>
                    <td className="py-2 font-sans text-text-muted">{h.notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  )
}
