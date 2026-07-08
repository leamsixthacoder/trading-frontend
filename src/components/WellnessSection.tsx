import { useState, type FormEvent } from 'react'
import {
  createEmotionalStateLog,
  createTradeReview,
  type EmotionalStateLog,
  type TradeReview,
} from '../api'

interface Props {
  emotionalStateLogs: EmotionalStateLog[]
  tradeReviews: TradeReview[]
  onLogCreated: (log: EmotionalStateLog) => void
  onReviewCreated: (review: TradeReview) => void
}

export function WellnessSection({
  emotionalStateLogs,
  tradeReviews,
  onLogCreated,
  onReviewCreated,
}: Props) {
  const [tags, setTags] = useState('')
  const [intensity, setIntensity] = useState('5')
  const [note, setNote] = useState('')
  const [logSubmitting, setLogSubmitting] = useState(false)
  const [logError, setLogError] = useState<string | null>(null)

  const [tradeId, setTradeId] = useState('')
  const [whatHappened, setWhatHappened] = useState('')
  const [whatWentWell, setWhatWentWell] = useState('')
  const [whatToChange, setWhatToChange] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  async function handleLogSubmit(e: FormEvent) {
    e.preventDefault()
    setLogSubmitting(true)
    setLogError(null)
    try {
      const created = await createEmotionalStateLog({
        state_tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        intensity: intensity ? Number(intensity) : null,
        note: note || null,
      })
      onLogCreated(created)
      setTags('')
      setNote('')
    } catch (e) {
      setLogError(e instanceof Error ? e.message : 'Failed to save log')
    } finally {
      setLogSubmitting(false)
    }
  }

  async function handleReviewSubmit(e: FormEvent) {
    e.preventDefault()
    if (!whatHappened.trim()) return
    setReviewSubmitting(true)
    setReviewError(null)
    try {
      const created = await createTradeReview({
        trade_id: tradeId || null,
        what_happened: whatHappened,
        what_went_well: whatWentWell || null,
        what_to_change: whatToChange || null,
      })
      onReviewCreated(created)
      setTradeId('')
      setWhatHappened('')
      setWhatWentWell('')
      setWhatToChange('')
    } catch (e) {
      setReviewError(e instanceof Error ? e.message : 'Failed to save review')
    } finally {
      setReviewSubmitting(false)
    }
  }

  return (
    <section>
      <h2>Wellness</h2>

      <h3>Emotional state log</h3>
      <form onSubmit={handleLogSubmit}>
        <input
          type="text"
          placeholder="tags (comma separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <input
          type="number"
          min={1}
          max={10}
          placeholder="Intensity 1-10"
          value={intensity}
          onChange={(e) => setIntensity(e.target.value)}
        />
        <input
          type="text"
          placeholder="Note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button type="submit" disabled={logSubmitting}>
          {logSubmitting ? 'Saving...' : 'Log state'}
        </button>
      </form>
      {logError && <p>Error: {logError}</p>}

      {emotionalStateLogs.length === 0 ? (
        <p>No emotional state logs yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Logged at</th>
              <th>Tags</th>
              <th>Intensity</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {emotionalStateLogs.map((log) => (
              <tr key={log.id}>
                <td>{log.logged_at}</td>
                <td>{log.state_tags.join(', ')}</td>
                <td>{log.intensity ?? '-'}</td>
                <td>{log.note ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Trade review</h3>
      <form onSubmit={handleReviewSubmit}>
        <input
          type="text"
          placeholder="Trade ID (optional)"
          value={tradeId}
          onChange={(e) => setTradeId(e.target.value)}
        />
        <input
          type="text"
          placeholder="What happened"
          value={whatHappened}
          onChange={(e) => setWhatHappened(e.target.value)}
        />
        <input
          type="text"
          placeholder="What went well"
          value={whatWentWell}
          onChange={(e) => setWhatWentWell(e.target.value)}
        />
        <input
          type="text"
          placeholder="What to change"
          value={whatToChange}
          onChange={(e) => setWhatToChange(e.target.value)}
        />
        <button type="submit" disabled={reviewSubmitting}>
          {reviewSubmitting ? 'Saving...' : 'Save review'}
        </button>
      </form>
      {reviewError && <p>Error: {reviewError}</p>}

      {tradeReviews.length === 0 ? (
        <p>No trade reviews yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Trade ID</th>
              <th>What happened</th>
              <th>Went well</th>
              <th>To change</th>
            </tr>
          </thead>
          <tbody>
            {tradeReviews.map((r) => (
              <tr key={r.id}>
                <td>{r.trade_id ?? '-'}</td>
                <td>{r.what_happened}</td>
                <td>{r.what_went_well}</td>
                <td>{r.what_to_change}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
