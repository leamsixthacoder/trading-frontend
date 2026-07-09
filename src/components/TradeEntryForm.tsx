import { useState, type FormEvent } from 'react'
import { createTrade, type Trade, type TradeDirection } from '../api'
import { formatDate, formatMoney, signClass, signOf } from '../lib/format'
import { Card } from './ui/Card'
import { EmptyState } from './ui/EmptyState'
import { ErrorState } from './ui/ErrorState'
import { Button, Input, Select } from './ui/form'
import { InstrumentPicker, type InstrumentAssetClass } from './InstrumentPicker'

interface TradeEntryFormProps {
  accountId: string
  trades: Trade[]
  onCreated: (trade: Trade) => void
}

function toIso(localDateTime: string): string {
  return new Date(localDateTime).toISOString()
}

export function TradeEntryForm({ accountId, trades, onCreated }: TradeEntryFormProps) {
  const [open, setOpen] = useState(false)
  const [symbol, setSymbol] = useState('')
  const [assetClass, setAssetClass] = useState<InstrumentAssetClass>('futures')
  const [direction, setDirection] = useState<TradeDirection>('long')
  const [size, setSize] = useState('')
  const [entryPrice, setEntryPrice] = useState('')
  const [exitPrice, setExitPrice] = useState('')
  const [entryTime, setEntryTime] = useState('')
  const [exitTime, setExitTime] = useState('')
  const [fees, setFees] = useState('0')
  const [pnlGross, setPnlGross] = useState('')
  const [tags, setTags] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setSymbol('')
    setSize('')
    setEntryPrice('')
    setExitPrice('')
    setEntryTime('')
    setExitTime('')
    setFees('0')
    setPnlGross('')
    setTags('')
    setNotes('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!symbol.trim() || !size || !entryPrice || !entryTime) return
    setSubmitting(true)
    setError(null)
    try {
      const created = await createTrade({
        account_id: accountId,
        symbol: symbol.trim(),
        direction,
        size: Number(size),
        entry_price: Number(entryPrice),
        exit_price: exitPrice ? Number(exitPrice) : null,
        entry_time: toIso(entryTime),
        exit_time: exitTime ? toIso(exitTime) : null,
        fees: fees ? Number(fees) : 0,
        pnl_gross: pnlGross ? Number(pnlGross) : null,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        notes: notes || null,
      })
      onCreated(created)
      reset()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to log trade')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-text-muted">Trades</div>
        <Button variant="secondary" onClick={() => setOpen((v) => !v)}>
          {open ? 'Cancel' : 'Log a trade'}
        </Button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="space-y-3 mb-5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <InstrumentPicker
              value={symbol}
              onChange={(sym, ac) => {
                setSymbol(sym)
                setAssetClass(ac)
              }}
              mode="both"
            />
            <Select value={direction} onChange={(e) => setDirection(e.target.value as TradeDirection)}>
              <option value="long">Long</option>
              <option value="short">Short</option>
            </Select>
            <Input
              type="number"
              step="any"
              placeholder="Size / contracts"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              required
            />
            <Input
              type="number"
              step="any"
              placeholder="Entry price"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              required
            />
            <Input
              type="number"
              step="any"
              placeholder="Exit price (optional)"
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
            />
            <Input
              type="number"
              step="any"
              placeholder="Fees"
              value={fees}
              onChange={(e) => setFees(e.target.value)}
            />
            <div>
              <div className="text-xs text-text-muted mb-1">Entry time</div>
              <Input
                type="datetime-local"
                value={entryTime}
                onChange={(e) => setEntryTime(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div>
              <div className="text-xs text-text-muted mb-1">Exit time (optional)</div>
              <Input
                type="datetime-local"
                value={exitTime}
                onChange={(e) => setExitTime(e.target.value)}
                className="w-full"
              />
            </div>
            <Input
              type="number"
              step="any"
              placeholder="Gross P&L $ (from your broker)"
              value={pnlGross}
              onChange={(e) => setPnlGross(e.target.value)}
            />
            <Input
              type="text"
              placeholder="Tags (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="sm:col-span-2"
            />
            <Input
              type="text"
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="sm:col-span-3"
            />
          </div>
          <div className="text-xs text-text-muted">
            Asset class: {assetClass === 'futures' ? 'Futures contract' : 'Stock/ETF'} · Gross P&amp;L isn't
            auto-calculated (contract multipliers aren't tracked yet) — enter the realized dollar amount from
            your platform.
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Logging…' : 'Log trade'}
          </Button>
          {error && <ErrorState message={error} />}
        </form>
      )}

      {trades.length === 0 ? (
        <EmptyState title="No trades logged yet" description="Log a trade above, or import a CSV." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="py-2 font-normal">Date</th>
                <th className="py-2 font-normal">Symbol</th>
                <th className="py-2 font-normal">Dir</th>
                <th className="py-2 font-normal">Size</th>
                <th className="py-2 font-normal">Entry</th>
                <th className="py-2 font-normal">Exit</th>
                <th className="py-2 font-normal">Net P&amp;L</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums">
              {trades.slice(0, 10).map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="py-2">{formatDate(t.entry_time)}</td>
                  <td className="py-2 font-sans">{t.symbol}</td>
                  <td className="py-2 font-sans capitalize">{t.direction}</td>
                  <td className="py-2">{t.size}</td>
                  <td className="py-2">{formatMoney(t.entry_price)}</td>
                  <td className="py-2">{t.exit_price ? formatMoney(t.exit_price) : '—'}</td>
                  <td className={`py-2 ${signClass[signOf(t.pnl_net)]}`}>{formatMoney(t.pnl_net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
