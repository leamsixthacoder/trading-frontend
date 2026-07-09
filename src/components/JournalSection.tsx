import { useState, type FormEvent } from 'react'
import {
  createJournalEntry,
  type JournalEntry,
  type JournalEntryType,
} from '../api'
import { EmptyState } from './ui/EmptyState'
import { ErrorState } from './ui/ErrorState'
import { Button, Input, Select } from './ui/form'
import { formatDate } from '../lib/format'

interface Props {
  entries: JournalEntry[]
  onCreated: (entry: JournalEntry) => void
}

export function JournalSection({ entries, onCreated }: Props) {
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [entryType, setEntryType] = useState<JournalEntryType>('daily_log')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const created = await createJournalEntry({
        entry_date: entryDate,
        entry_type: entryType,
        content,
      })
      onCreated(created)
      setContent('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save entry')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section>
      <h2 className="text-sm text-text-muted mb-3">Journal</h2>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2 mb-4">
        <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
        <Select value={entryType} onChange={(e) => setEntryType(e.target.value as JournalEntryType)}>
          <option value="daily_log">Daily log</option>
          <option value="meeting_note">Meeting note</option>
          <option value="general">General</option>
        </Select>
        <Input
          type="text"
          placeholder="What happened today..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-w-[220px] flex-1"
        />
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Add entry'}
        </Button>
      </form>
      {error && <ErrorState message={error} />}

      {entries.length === 0 ? (
        <EmptyState title="No journal entries yet" description="Log your first daily entry above to start tracking." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="py-2 font-normal">Date</th>
                <th className="py-2 font-normal">Type</th>
                <th className="py-2 font-normal">Content</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-border last:border-0">
                  <td className="py-2 font-mono tabular-nums whitespace-nowrap">{formatDate(entry.entry_date)}</td>
                  <td className="py-2 text-text-muted">{entry.entry_type.replace('_', ' ')}</td>
                  <td className="py-2">{entry.content}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
