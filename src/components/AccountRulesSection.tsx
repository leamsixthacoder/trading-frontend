import { useEffect, useState, type FormEvent } from 'react'
import {
  createAccountRule,
  listAccountRules,
  updateAccountRule,
  type AccountRule,
  type AccountRuleType,
} from '../api'
import { useApi } from '../hooks/useApi'
import { formatMoney } from '../lib/format'
import { Card } from './ui/Card'
import { Button, Input } from './ui/form'
import { ErrorState } from './ui/ErrorState'

const RULE_ORDER: AccountRuleType[] = ['profit_target', 'daily_loss_limit', 'max_loss_limit']

const RULE_LABELS: Record<AccountRuleType, string> = {
  profit_target: 'Profit Target',
  daily_loss_limit: 'Daily Loss Limit',
  max_loss_limit: 'Max Loss Limit',
}

interface RuleCurrentValue {
  amount: number
  breached: boolean
  breachLabel: string
}

function currentValueFor(
  ruleType: AccountRuleType,
  threshold: number,
  ctx: { profitSoFar: number; todayLoss: number; drawdown: number },
): RuleCurrentValue {
  switch (ruleType) {
    case 'profit_target':
      return { amount: ctx.profitSoFar, breached: ctx.profitSoFar >= threshold, breachLabel: 'Target reached' }
    case 'daily_loss_limit':
      return { amount: ctx.todayLoss, breached: ctx.todayLoss >= threshold, breachLabel: 'Limit reached' }
    case 'max_loss_limit':
      return { amount: ctx.drawdown, breached: ctx.drawdown >= threshold, breachLabel: 'Limit reached' }
  }
}

interface RuleCardProps {
  accountId: string
  ruleType: AccountRuleType
  rule: AccountRule | undefined
  current: { profitSoFar: number; todayLoss: number; drawdown: number }
  onCreated: (rule: AccountRule) => void
  onUpdated: (rule: AccountRule) => void
}

function RuleCard({ accountId, ruleType, rule, current, onCreated, onUpdated }: RuleCardProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(rule?.threshold ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setValue(rule?.threshold ?? '')
  }, [rule?.threshold])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const threshold = Number(value)
    if (!value || Number.isNaN(threshold) || threshold <= 0) return
    setSubmitting(true)
    setError(null)
    try {
      if (rule) {
        const updated = await updateAccountRule(accountId, rule.id, threshold)
        onUpdated(updated)
      } else {
        const created = await createAccountRule(accountId, { rule_type: ruleType, threshold })
        onCreated(created)
      }
      setEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  if (!rule || editing) {
    return (
      <Card>
        <div className="text-sm text-text-muted">{RULE_LABELS[ruleType]}</div>
        <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
          <Input
            type="number"
            step="any"
            placeholder="$ amount"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-28"
            autoFocus={editing}
          />
          <Button type="submit" variant="secondary" disabled={submitting}>
            {submitting ? 'Saving…' : rule ? 'Save' : 'Set'}
          </Button>
          {editing && (
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          )}
        </form>
        {!rule && <div className="text-xs text-text-muted mt-1">Not configured yet</div>}
        {error && <ErrorState message={error} />}
      </Card>
    )
  }

  const threshold = Number(rule.threshold)
  const { amount, breached, breachLabel } = currentValueFor(ruleType, threshold, current)

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="text-sm text-text-muted">{RULE_LABELS[ruleType]}</div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs text-accent-violet hover:underline"
        >
          Edit
        </button>
      </div>
      <div className={`font-mono tabular-nums text-xl mt-2 ${breached ? (ruleType === 'profit_target' ? 'text-accent-green' : 'text-accent-red') : 'text-text-primary'}`}>
        {formatMoney(amount)} <span className="text-sm text-text-muted">/ {formatMoney(threshold)}</span>
      </div>
      {breached && (
        <div className={`text-xs mt-1 ${ruleType === 'profit_target' ? 'text-accent-green' : 'text-accent-red'}`}>
          {breachLabel}
        </div>
      )}
    </Card>
  )
}

interface AccountRulesSectionProps {
  accountId: string
  profitSoFar: number
  todayLoss: number
  drawdown: number
}

export function AccountRulesSection({ accountId, profitSoFar, todayLoss, drawdown }: AccountRulesSectionProps) {
  const rulesApi = useApi(() => listAccountRules(accountId), [accountId])
  const [rules, setRules] = useState<AccountRule[]>([])
  useEffect(() => {
    if (rulesApi.data) setRules(rulesApi.data)
  }, [rulesApi.data])

  if (rulesApi.error) {
    return <ErrorState message="Couldn't load account rules — check your connection and retry." onRetry={rulesApi.refetch} />
  }

  const current = { profitSoFar, todayLoss, drawdown }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {RULE_ORDER.map((ruleType) => (
        <RuleCard
          key={ruleType}
          accountId={accountId}
          ruleType={ruleType}
          rule={rules.find((r) => r.rule_type === ruleType)}
          current={current}
          onCreated={(created) => setRules((prev) => [...prev, created])}
          onUpdated={(updated) => setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))}
        />
      ))}
    </div>
  )
}
