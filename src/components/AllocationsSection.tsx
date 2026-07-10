import { useState, type FormEvent } from 'react'
import { createAllocation, type Allocation } from '../api'
import { EmptyState } from './ui/EmptyState'
import { ErrorState } from './ui/ErrorState'
import { Button, Input, Select } from './ui/form'
import { formatDate, formatMoney } from '../lib/format'

interface Props {
  accountId: string
  allocations: Allocation[]
  onCreated: (allocation: Allocation) => void
}

const ALLOCATION_TYPES = ['payout', 'profit_share', 'reserve', 'reinvestment', 'correction']

export function AllocationsSection({ accountId, allocations, onCreated }: Props) {
  const [type, setType] = useState('payout')
  const [amount, setAmount] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [memo, setMemo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const value = Number(amount)
    if (!amount || Number.isNaN(value) || value === 0) {
      setError('Amount must be a non-zero number')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const created = await createAllocation(accountId, {
        type,
        amount: value,
        period_start: periodStart || null,
        period_end: periodEnd || null,
        memo: memo || null,
      })
      onCreated(created)
      setAmount('')
      setPeriodStart('')
      setPeriodEnd('')
      setMemo('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to record allocation')
    } finally {
      setSubmitting(false)
    }
  }

  const sorted = [...allocations].sort((a, b) => b.created_at.localeCompare(a.created_at))

  return (
    <div>
      <h2 className="text-sm text-text-muted mb-3">Allocations</h2>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 mb-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted">Type</label>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {ALLOCATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted">Amount</label>
          <Input
            type="number"
            step="0.01"
            placeholder="$ amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-32"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted">Period start</label>
          <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted">Period end</label>
          <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted">Memo</label>
          <Input
            type="text"
            placeholder="Optional note"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="w-48"
          />
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Add allocation'}
        </Button>
      </form>
      {error && <ErrorState message={error} />}

      {sorted.length === 0 ? (
        <EmptyState
          title="No allocations recorded yet"
          description="Deposits, withdrawals, payouts, and corrections you record here feed directly into this account's balance."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="py-2 font-normal">Date</th>
                <th className="py-2 font-normal">Type</th>
                <th className="py-2 font-normal">Amount</th>
                <th className="py-2 font-normal">Memo</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums">
              {sorted.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0">
                  <td className="py-2">{formatDate(a.created_at)}</td>
                  <td className="py-2 font-sans">{a.type}</td>
                  <td className="py-2">{formatMoney(a.amount)}</td>
                  <td className="py-2 font-sans text-text-muted">{a.memo ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
