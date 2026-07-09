import { useState, type FormEvent } from 'react'
import {
  createEmotionalStateLog,
  createTradeReview,
  type EmotionalStateLog,
  type TradeReview,
} from '../api'
import { Card } from './ui/Card'
import { EmptyState } from './ui/EmptyState'
import { ErrorState } from './ui/ErrorState'
import { Button, Input } from './ui/form'
import { formatDate } from '../lib/format'

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
    <div className="space-y-6">
      <h1 className="text-2xl font-medium text-text-primary">Wellness</h1>

      <Card>
        <h2 className="text-sm text-text-muted mb-3">Emotional state log</h2>
        <form onSubmit={handleLogSubmit} className="flex flex-wrap items-center gap-2 mb-4">
          <Input
            type="text"
            placeholder="tags (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="min-w-[200px]"
          />
          <Input
            type="number"
            min={1}
            max={10}
            placeholder="Intensity 1-10"
            value={intensity}
            onChange={(e) => setIntensity(e.target.value)}
            className="w-32"
          />
          <Input
            type="text"
            placeholder="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-w-[200px] flex-1"
          />
          <Button type="submit" disabled={logSubmitting}>
            {logSubmitting ? 'Saving…' : 'Log state'}
          </Button>
        </form>
        {logError && <ErrorState message={logError} />}

        {emotionalStateLogs.length === 0 ? (
          <EmptyState title="No emotional state logs yet" description="Log how you're feeling above to start tracking patterns." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-muted">
                  <th className="py-2 font-normal">Logged at</th>
                  <th className="py-2 font-normal">Tags</th>
                  <th className="py-2 font-normal">Intensity</th>
                  <th className="py-2 font-normal">Note</th>
                </tr>
              </thead>
              <tbody>
                {emotionalStateLogs.map((log) => (
                  <tr key={log.id} className="border-b border-border last:border-0">
                    <td className="py-2 font-mono tabular-nums whitespace-nowrap">{formatDate(log.logged_at)}</td>
                    <td className="py-2">{log.state_tags.join(', ') || '—'}</td>
                    <td className="py-2 font-mono tabular-nums">{log.intensity ?? '—'}</td>
                    <td className="py-2">{log.note ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-sm text-text-muted mb-3">Trade review</h2>
        <form onSubmit={handleReviewSubmit} className="grid grid-cols-1 gap-2 mb-4 sm:grid-cols-2">
          <Input
            type="text"
            placeholder="Trade ID (optional)"
            value={tradeId}
            onChange={(e) => setTradeId(e.target.value)}
          />
          <Input
            type="text"
            placeholder="What happened"
            value={whatHappened}
            onChange={(e) => setWhatHappened(e.target.value)}
          />
          <Input
            type="text"
            placeholder="What went well"
            value={whatWentWell}
            onChange={(e) => setWhatWentWell(e.target.value)}
          />
          <Input
            type="text"
            placeholder="What to change"
            value={whatToChange}
            onChange={(e) => setWhatToChange(e.target.value)}
          />
          <Button type="submit" disabled={reviewSubmitting} className="sm:col-span-2 justify-self-start">
            {reviewSubmitting ? 'Saving…' : 'Save review'}
          </Button>
        </form>
        {reviewError && <ErrorState message={reviewError} />}

        {tradeReviews.length === 0 ? (
          <EmptyState title="No trade reviews yet" description="Write a structured review above after a notable trade." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-muted">
                  <th className="py-2 font-normal">Trade ID</th>
                  <th className="py-2 font-normal">What happened</th>
                  <th className="py-2 font-normal">Went well</th>
                  <th className="py-2 font-normal">To change</th>
                </tr>
              </thead>
              <tbody>
                {tradeReviews.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="py-2 font-mono tabular-nums">{r.trade_id ?? '—'}</td>
                    <td className="py-2">{r.what_happened}</td>
                    <td className="py-2">{r.what_went_well ?? '—'}</td>
                    <td className="py-2">{r.what_to_change ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
