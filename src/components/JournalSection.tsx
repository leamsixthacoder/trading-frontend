import { useState, type FormEvent } from 'react'
import {
  createJournalEntry,
  type JournalEntry,
  type JournalEntryType,
} from '../api'

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
      <h2>Journal</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="date"
          value={entryDate}
          onChange={(e) => setEntryDate(e.target.value)}
        />
        <select
          value={entryType}
          onChange={(e) => setEntryType(e.target.value as JournalEntryType)}
        >
          <option value="daily_log">Daily log</option>
          <option value="meeting_note">Meeting note</option>
          <option value="general">General</option>
        </select>
        <input
          type="text"
          placeholder="What happened today..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Add entry'}
        </button>
      </form>
      {error && <p>Error: {error}</p>}

      {entries.length === 0 ? (
        <p>No journal entries yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Content</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.entry_date}</td>
                <td>{entry.entry_type}</td>
                <td>{entry.content}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
