import { useState, type FormEvent } from 'react'
import { createAggregateRiskRule, type AggregateRiskRule, type AggregateRiskStatus } from '../api'
import { EmptyState } from './ui/EmptyState'
import { ErrorState } from './ui/ErrorState'
import { StatCard } from './ui/StatCard'
import { Button, Input, Select } from './ui/form'
import { formatMoney, signClass, signOf } from '../lib/format'

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
    <section className="space-y-5">
      <h2 className="text-sm text-text-muted">Aggregate Risk</h2>

      {status && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label="Total Open Risk" value={formatMoney(status.total_open_risk)} />
          <StatCard
            label="Total Daily P&L"
            value={formatMoney(status.total_daily_pnl)}
            sign={signOf(status.total_daily_pnl)}
          />
        </div>
      )}

      {status && status.breaches.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-accent-red mb-2">Breaches</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-muted">
                  <th className="py-2 font-normal">Rule type</th>
                  <th className="py-2 font-normal">Scope</th>
                  <th className="py-2 font-normal">Threshold</th>
                  <th className="py-2 font-normal">Actual</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {status.breaches.map((b) => (
                  <tr key={b.rule_id} className="border-b border-border last:border-0">
                    <td className="py-2 font-sans">{b.rule_type}</td>
                    <td className="py-2 font-sans">{b.scope}</td>
                    <td className="py-2">{formatMoney(b.threshold)}</td>
                    <td className={`py-2 ${signClass[signOf(b.actual)]}`}>{formatMoney(b.actual)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-text-primary mb-2">Aggregate risk rules</h3>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2 mb-4">
          <Select value={ruleType} onChange={(e) => setRuleType(e.target.value)}>
            <option value="total_daily_loss_all_accounts">total_daily_loss_all_accounts</option>
            <option value="total_open_risk">total_open_risk</option>
          </Select>
          <Select value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="all">all</option>
            <option value="funded_only">funded_only</option>
            <option value="personal_only">personal_only</option>
          </Select>
          <Input
            type="number"
            placeholder="Threshold"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="w-32"
          />
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Add rule'}
          </Button>
        </form>
        {error && <ErrorState message={error} />}

        {rules.length === 0 ? (
          <EmptyState title="No aggregate risk rules yet" description="Add one above to start monitoring cross-account exposure." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-muted">
                  <th className="py-2 font-normal">Rule type</th>
                  <th className="py-2 font-normal">Scope</th>
                  <th className="py-2 font-normal">Threshold</th>
                  <th className="py-2 font-normal">Active</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {rules.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="py-2 font-sans">{r.rule_type}</td>
                    <td className="py-2 font-sans">{r.scope}</td>
                    <td className="py-2">{formatMoney(r.threshold)}</td>
                    <td className="py-2">{r.active ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
