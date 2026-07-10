import { useState, type FormEvent } from 'react'
import {
  createRiskRule,
  deleteRiskRule,
  updateRiskRule,
  type Account,
  type RiskRule,
} from '../api'
import { EmptyState } from './ui/EmptyState'
import { ErrorState } from './ui/ErrorState'
import { Button, Input, Select } from './ui/form'
import { formatMoney } from '../lib/format'

interface Props {
  accounts: Account[]
  rules: RiskRule[]
  onRuleCreated: (rule: RiskRule) => void
  onRuleUpdated: (rule: RiskRule) => void
  onRuleDeleted: (ruleId: string) => void
}

const RULE_TYPE_SUGGESTIONS = ['max_daily_loss', 'max_position_size', 'max_trades_per_day']

export function RiskRulesSection({ accounts, rules, onRuleCreated, onRuleUpdated, onRuleDeleted }: Props) {
  const [accountId, setAccountId] = useState('')
  const [ruleType, setRuleType] = useState('')
  const [threshold, setThreshold] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editThreshold, setEditThreshold] = useState('')
  const [editActive, setEditActive] = useState(true)
  const [rowBusy, setRowBusy] = useState<string | null>(null)
  const [rowError, setRowError] = useState<string | null>(null)

  function accountLabel(id: string | null) {
    if (id === null) return 'All accounts'
    return accounts.find((a) => a.id === id)?.label ?? id
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!ruleType.trim() || !threshold) return
    setSubmitting(true)
    setError(null)
    try {
      const created = await createRiskRule({
        account_id: accountId || null,
        rule_type: ruleType.trim(),
        threshold: Number(threshold),
      })
      onRuleCreated(created)
      setRuleType('')
      setThreshold('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create risk rule')
    } finally {
      setSubmitting(false)
    }
  }

  function startEdit(rule: RiskRule) {
    setEditingId(rule.id)
    setEditThreshold(rule.threshold)
    setEditActive(rule.active)
    setRowError(null)
  }

  async function handleSaveEdit(ruleId: string) {
    const value = Number(editThreshold)
    if (!editThreshold || Number.isNaN(value) || value <= 0) return
    setRowBusy(ruleId)
    setRowError(null)
    try {
      const updated = await updateRiskRule(ruleId, { threshold: value, active: editActive })
      onRuleUpdated(updated)
      setEditingId(null)
    } catch (e) {
      setRowError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setRowBusy(null)
    }
  }

  async function handleDelete(ruleId: string) {
    if (!window.confirm('Remove this risk rule?')) return
    setRowBusy(ruleId)
    setRowError(null)
    try {
      await deleteRiskRule(ruleId)
      onRuleDeleted(ruleId)
    } catch (e) {
      setRowError(e instanceof Error ? e.message : 'Failed to remove')
    } finally {
      setRowBusy(null)
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-sm text-text-muted">Risk Rules</h2>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
        <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          <option value="">All accounts</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </Select>
        <Input
          type="text"
          list="risk-rule-type-suggestions"
          placeholder="Rule type, e.g. max_daily_loss"
          value={ruleType}
          onChange={(e) => setRuleType(e.target.value)}
          className="w-56"
        />
        <datalist id="risk-rule-type-suggestions">
          {RULE_TYPE_SUGGESTIONS.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
        <Input
          type="number"
          step="0.01"
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
        <EmptyState title="No risk rules yet" description="Add one above to start generating risk alerts." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="py-2 font-normal">Account</th>
                <th className="py-2 font-normal">Rule type</th>
                <th className="py-2 font-normal">Threshold</th>
                <th className="py-2 font-normal">Active</th>
                <th className="py-2 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums">
              {rules.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="py-2 font-sans">{accountLabel(r.account_id)}</td>
                  <td className="py-2 font-sans">{r.rule_type}</td>
                  {editingId === r.id ? (
                    <>
                      <td className="py-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={editThreshold}
                          onChange={(e) => setEditThreshold(e.target.value)}
                          className="w-28"
                          autoFocus
                        />
                      </td>
                      <td className="py-2 font-sans">
                        <input
                          type="checkbox"
                          checked={editActive}
                          onChange={(e) => setEditActive(e.target.checked)}
                        />
                      </td>
                      <td className="py-2 font-sans">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(r.id)}
                            disabled={rowBusy === r.id}
                            className="text-xs text-accent-violet hover:underline disabled:opacity-50"
                          >
                            {rowBusy === r.id ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="text-xs text-text-muted hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2">{formatMoney(r.threshold)}</td>
                      <td className="py-2 font-sans">{r.active ? 'Yes' : 'No'}</td>
                      <td className="py-2 font-sans">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => startEdit(r)}
                            className="text-xs text-accent-violet hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(r.id)}
                            disabled={rowBusy === r.id}
                            className="text-xs text-accent-red hover:underline disabled:opacity-50"
                          >
                            {rowBusy === r.id ? 'Removing…' : 'Remove'}
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {rowError && <ErrorState message={rowError} />}
        </div>
      )}
    </section>
  )
}
