import { useState, type FormEvent } from 'react'
import {
  checkPayoutEligibility,
  createPayoutRule,
  type Account,
  type PayoutEligibility,
  type PayoutRule,
} from '../api'

interface Props {
  accounts: Account[]
  rules: PayoutRule[]
  onRuleCreated: (rule: PayoutRule) => void
}

export function PayoutsSection({ accounts, rules, onRuleCreated }: Props) {
  const [accountType, setAccountType] = useState('funded_lucid')
  const [splitPct, setSplitPct] = useState('0.90')
  const [minAmount, setMinAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [results, setResults] = useState<Record<string, PayoutEligibility>>({})
  const [checkError, setCheckError] = useState<Record<string, string>>({})

  async function handleCreateRule(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const created = await createPayoutRule({
        account_type: accountType,
        profit_split_pct: Number(splitPct),
        min_payout_amount: minAmount ? Number(minAmount) : null,
      })
      onRuleCreated(created)
      setMinAmount('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create payout rule')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCheck(accountId: string) {
    setCheckError((prev) => ({ ...prev, [accountId]: '' }))
    try {
      const result = await checkPayoutEligibility(accountId)
      setResults((prev) => ({ ...prev, [accountId]: result }))
    } catch (e) {
      setCheckError((prev) => ({
        ...prev,
        [accountId]: e instanceof Error ? e.message : 'Eligibility check failed',
      }))
    }
  }

  return (
    <section>
      <h2>Payouts</h2>

      <h3>Payout rules</h3>
      <form onSubmit={handleCreateRule}>
        <select value={accountType} onChange={(e) => setAccountType(e.target.value)}>
          <option value="funded_lucid">funded_lucid</option>
          <option value="funded_topstep">funded_topstep</option>
          <option value="personal_live">personal_live</option>
          <option value="personal_portfolio">personal_portfolio</option>
        </select>
        <input
          type="number"
          step="0.01"
          placeholder="Split % (e.g. 0.90)"
          value={splitPct}
          onChange={(e) => setSplitPct(e.target.value)}
        />
        <input
          type="number"
          placeholder="Min payout amount"
          value={minAmount}
          onChange={(e) => setMinAmount(e.target.value)}
        />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Add rule'}
        </button>
      </form>
      {error && <p>Error: {error}</p>}

      {rules.length === 0 ? (
        <p>No payout rules configured yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Account type</th>
              <th>Split %</th>
              <th>Min payout</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id}>
                <td>{r.account_type}</td>
                <td>{r.profit_split_pct}</td>
                <td>{r.min_payout_amount ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Eligibility</h3>
      <table>
        <thead>
          <tr>
            <th>Account</th>
            <th>Action</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((a) => (
            <tr key={a.id}>
              <td>{a.label}</td>
              <td>
                <button type="button" onClick={() => handleCheck(a.id)}>
                  Check eligibility
                </button>
                {checkError[a.id] && <p>Error: {checkError[a.id]}</p>}
              </td>
              <td>
                {results[a.id]
                  ? results[a.id].eligible
                    ? `Eligible: $${results[a.id].computed_amount}`
                    : `Not eligible: ${results[a.id].reason_if_ineligible}`
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
