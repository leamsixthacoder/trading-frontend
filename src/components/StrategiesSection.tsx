import { useState, type FormEvent } from 'react'
import {
  createStrategy,
  runBacktest,
  updateStrategyStatus,
  validateStrategy,
  type Backtest,
  type Strategy,
} from '../api'

interface Props {
  strategies: Strategy[]
  onCreated: (strategy: Strategy) => void
  onUpdated: (strategy: Strategy) => void
}

export function StrategiesSection({ strategies, onCreated, onUpdated }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [backtestResults, setBacktestResults] = useState<Record<string, Backtest>>({})
  const [tagsInput, setTagsInput] = useState<Record<string, string>>({})
  const [actionError, setActionError] = useState<Record<string, string>>({})

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const created = await createStrategy({
        name,
        description: description || null,
        rules: { entry: description || 'undefined' },
      })
      onCreated(created)
      setName('')
      setDescription('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create strategy')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleBacktest(strategy: Strategy) {
    setActionError((prev) => ({ ...prev, [strategy.id]: '' }))
    try {
      const tags = (tagsInput[strategy.id] ?? '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      const today = new Date().toISOString().slice(0, 10)
      const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      const result = await runBacktest(strategy.id, {
        period_start: yearAgo,
        period_end: today,
        tags,
      })
      setBacktestResults((prev) => ({ ...prev, [strategy.id]: result }))
    } catch (e) {
      setActionError((prev) => ({
        ...prev,
        [strategy.id]: e instanceof Error ? e.message : 'Backtest failed',
      }))
    }
  }

  async function handleValidateAndGoLive(strategy: Strategy) {
    setActionError((prev) => ({ ...prev, [strategy.id]: '' }))
    const backtest = backtestResults[strategy.id]
    if (!backtest) {
      setActionError((prev) => ({ ...prev, [strategy.id]: 'Run a backtest first' }))
      return
    }
    try {
      await validateStrategy(strategy.id, backtest.id, true)
      const updated = await updateStrategyStatus(strategy.id, 'live')
      onUpdated(updated)
    } catch (e) {
      setActionError((prev) => ({
        ...prev,
        [strategy.id]: e instanceof Error ? e.message : 'Failed to validate/go live',
      }))
    }
  }

  return (
    <section>
      <h2>Strategies</h2>
      <form onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Strategy name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Entry rule description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Add strategy'}
        </button>
      </form>
      {error && <p>Error: {error}</p>}

      {strategies.length === 0 ? (
        <p>No strategies yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Backtest tags</th>
              <th>Actions</th>
              <th>Latest backtest</th>
            </tr>
          </thead>
          <tbody>
            {strategies.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.status}</td>
                <td>
                  <input
                    type="text"
                    placeholder="tag1,tag2"
                    value={tagsInput[s.id] ?? ''}
                    onChange={(e) =>
                      setTagsInput((prev) => ({ ...prev, [s.id]: e.target.value }))
                    }
                  />
                </td>
                <td>
                  <button type="button" onClick={() => handleBacktest(s)}>
                    Run backtest
                  </button>
                  <button
                    type="button"
                    onClick={() => handleValidateAndGoLive(s)}
                    disabled={s.status === 'live'}
                  >
                    Validate &amp; go live
                  </button>
                  {actionError[s.id] && <p>Error: {actionError[s.id]}</p>}
                </td>
                <td>
                  {backtestResults[s.id]
                    ? `${backtestResults[s.id].total_trades} trades, win rate ${
                        backtestResults[s.id].win_rate ?? '-'
                      }, P&L ${backtestResults[s.id].total_pnl ?? '-'}`
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
