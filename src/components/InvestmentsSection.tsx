import { useState, type FormEvent } from 'react'
import { createHolding, type Account, type Holding } from '../api'
import { Card } from './ui/Card'
import { EmptyState } from './ui/EmptyState'
import { ErrorState } from './ui/ErrorState'
import { Button, Input } from './ui/form'
import { formatDate, formatMoney } from '../lib/format'

interface Props {
  holdings: Holding[]
  portfolioAccounts: Account[]
  onCreated: (holding: Holding) => void
}

export function InvestmentsSection({ holdings, portfolioAccounts, onCreated }: Props) {
  const [symbol, setSymbol] = useState('')
  const [quantity, setQuantity] = useState('')
  const [costBasis, setCostBasis] = useState('')
  const [acquiredDate, setAcquiredDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (portfolioAccounts.length === 0) {
    return (
      <Card>
        <h2 className="text-sm text-text-muted mb-3">Investments</h2>
        <EmptyState
          title="No personal_portfolio account yet"
          description="Add one (a real stock/brokerage account) when you have one, and holdings tracking will show up here."
        />
      </Card>
    )
  }

  const account = portfolioAccounts[0]

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!symbol.trim() || !quantity || !costBasis) return
    setSubmitting(true)
    setError(null)
    try {
      const created = await createHolding({
        account_id: account.id,
        symbol: symbol.toUpperCase(),
        quantity: Number(quantity),
        cost_basis: Number(costBasis),
        acquired_date: acquiredDate,
      })
      onCreated(created)
      setSymbol('')
      setQuantity('')
      setCostBasis('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add holding')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <h2 className="text-sm text-text-muted mb-3">Investments — {account.label}</h2>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2 mb-4">
        <Input type="text" placeholder="Symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} className="w-28" />
        <Input
          type="number"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-28"
        />
        <Input
          type="number"
          placeholder="Cost basis / share"
          value={costBasis}
          onChange={(e) => setCostBasis(e.target.value)}
          className="w-40"
        />
        <Input type="date" value={acquiredDate} onChange={(e) => setAcquiredDate(e.target.value)} />
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Add holding'}
        </Button>
      </form>
      {error && <ErrorState message={error} />}

      {holdings.length === 0 ? (
        <EmptyState title="No holdings yet" description="Add your first holding above." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="py-2 font-normal">Symbol</th>
                <th className="py-2 font-normal">Quantity</th>
                <th className="py-2 font-normal">Cost basis</th>
                <th className="py-2 font-normal">Acquired</th>
                <th className="py-2 font-normal">Asset class</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums">
              {holdings.map((h) => (
                <tr key={h.id} className="border-b border-border last:border-0">
                  <td className="py-2 font-sans">{h.symbol}</td>
                  <td className="py-2">{h.quantity}</td>
                  <td className="py-2">{formatMoney(h.cost_basis)}</td>
                  <td className="py-2">{formatDate(h.acquired_date)}</td>
                  <td className="py-2 font-sans">{h.asset_class}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
