import { useState, type FormEvent } from 'react'
import { createAggregateRiskRule, type AggregateRiskRule, type AggregateRiskStatus } from '../api'

interface Props {
  status: AggregateRiskStatus | null
  rules: AggregateRiskRule[]
  onRuleCreated: (rule: AggregateRiskRule) => void
}

export function AggregateRiskSection({ status, rules, onRuleCreated }: Props) {
  const [ruleType, setRuleType] = useState('total_daily_loss_all_accounts')
  const [scope, setScope] = useState('all')
  const [threshold, setThreshold] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!threshold) return
    setSubmitting(true)
    setError(null)
    try {
      const created = await createAggregateRiskRule({
        rule_type: ruleType,
        scope,
        threshold: Number(threshold),
      })
      onRuleCreated(created)
      setThreshold('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create rule')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section>
      <h2>Aggregate risk</h2>

      {status && (
        <table>
          <thead>
            <tr>
              <th>Total open risk</th>
              <th>Total daily P&amp;L</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{status.total_open_risk}</td>
              <td>{status.total_daily_pnl}</td>
            </tr>
          </tbody>
        </table>
      )}

      {status && status.breaches.length > 0 && (
        <>
          <h3>Breaches</h3>
          <table>
            <thead>
              <tr>
                <th>Rule type</th>
                <th>Scope</th>
                <th>Threshold</th>
                <th>Actual</th>
              </tr>
            </thead>
            <tbody>
              {status.breaches.map((b) => (
                <tr key={b.rule_id}>
                  <td>{b.rule_type}</td>
                  <td>{b.scope}</td>
                  <td>{b.threshold}</td>
                  <td>{b.actual}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h3>Aggregate risk rules</h3>
      <form onSubmit={handleSubmit}>
        <select value={ruleType} onChange={(e) => setRuleType(e.target.value)}>
          <option value="total_daily_loss_all_accounts">total_daily_loss_all_accounts</option>
          <option value="total_open_risk">total_open_risk</option>
        </select>
        <select value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value="all">all</option>
          <option value="funded_only">funded_only</option>
          <option value="personal_only">personal_only</option>
        </select>
        <input
          type="number"
          placeholder="Threshold"
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
        />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Add rule'}
        </button>
      </form>
      {error && <p>Error: {error}</p>}

      {rules.length === 0 ? (
        <p>No aggregate risk rules yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Rule type</th>
              <th>Scope</th>
              <th>Threshold</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id}>
                <td>{r.rule_type}</td>
                <td>{r.scope}</td>
                <td>{r.threshold}</td>
                <td>{r.active ? 'yes' : 'no'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
