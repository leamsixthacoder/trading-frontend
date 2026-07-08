import { useState, type FormEvent } from 'react'
import { createHolding, type Account, type Holding } from '../api'

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
      <section>
        <h2>Investments</h2>
        <p>
          No personal_portfolio account yet — add one (a real stock/brokerage
          account) when you have one, and holdings tracking will show up here.
        </p>
      </section>
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
    <section>
      <h2>Investments — {account.label}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
        />
        <input
          type="number"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        <input
          type="number"
          placeholder="Cost basis / share"
          value={costBasis}
          onChange={(e) => setCostBasis(e.target.value)}
        />
        <input
          type="date"
          value={acquiredDate}
          onChange={(e) => setAcquiredDate(e.target.value)}
        />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Add holding'}
        </button>
      </form>
      {error && <p>Error: {error}</p>}

      {holdings.length === 0 ? (
        <p>No holdings yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Quantity</th>
              <th>Cost basis</th>
              <th>Acquired</th>
              <th>Asset class</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => (
              <tr key={h.id}>
                <td>{h.symbol}</td>
                <td>{h.quantity}</td>
                <td>{h.cost_basis}</td>
                <td>{h.acquired_date}</td>
                <td>{h.asset_class}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
