import { useState, type FormEvent } from 'react'
import {
  checkPayoutEligibility,
  createPayoutRule,
  type Account,
  type PayoutEligibility,
  type PayoutRule,
} from '../api'
import { EmptyState } from './ui/EmptyState'
import { ErrorState } from './ui/ErrorState'
import { Button, Input, Select } from './ui/form'
import { formatMoney, formatPct } from '../lib/format'

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
    <section className="space-y-5">
      <h2 className="text-sm text-text-muted">Payouts</h2>

      <div>
        <h3 className="text-sm font-medium text-text-primary mb-2">Payout rules</h3>
        <form onSubmit={handleCreateRule} className="flex flex-wrap items-center gap-2 mb-4">
          <Select value={accountType} onChange={(e) => setAccountType(e.target.value)}>
            <option value="funded_lucid">funded_lucid</option>
            <option value="funded_topstep">funded_topstep</option>
            <option value="personal_live">personal_live</option>
            <option value="personal_portfolio">personal_portfolio</option>
          </Select>
          <Input
            type="number"
            step="0.01"
            placeholder="Split % (e.g. 0.90)"
            value={splitPct}
            onChange={(e) => setSplitPct(e.target.value)}
            className="w-40"
          />
          <Input
            type="number"
            placeholder="Min payout amount"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            className="w-44"
          />
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Add rule'}
          </Button>
        </form>
        {error && <ErrorState message={error} />}

        {rules.length === 0 ? (
          <EmptyState title="No payout rules configured yet" description="Add one above to start tracking eligibility." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-muted">
                  <th className="py-2 font-normal">Account type</th>
                  <th className="py-2 font-normal">Split %</th>
                  <th className="py-2 font-normal">Min payout</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {rules.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="py-2 font-sans">{r.account_type}</td>
                    <td className="py-2">{formatPct(Number(r.profit_split_pct) * 100)}</td>
                    <td className="py-2">{r.min_payout_amount ? formatMoney(r.min_payout_amount) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-text-primary mb-2">Eligibility</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="py-2 font-normal">Account</th>
                <th className="py-2 font-normal">Action</th>
                <th className="py-2 font-normal">Result</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0">
                  <td className="py-2">{a.label}</td>
                  <td className="py-2">
                    <Button variant="secondary" onClick={() => handleCheck(a.id)}>
                      Check eligibility
                    </Button>
                    {checkError[a.id] && <div className="text-xs text-accent-red mt-1">{checkError[a.id]}</div>}
                  </td>
                  <td className="py-2 font-mono tabular-nums">
                    {results[a.id] ? (
                      results[a.id].eligible ? (
                        <span className="text-accent-green">
                          Eligible: {formatMoney(results[a.id].computed_amount)}
                        </span>
                      ) : (
                        <span className="text-text-muted">Not eligible: {results[a.id].reason_if_ineligible}</span>
                      )
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
