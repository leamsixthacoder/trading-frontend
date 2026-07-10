import { useState, type FormEvent } from 'react'
import { createTrade, updateTrade, type Trade, type TradeDirection } from '../api'
import { formatDate, formatMoney, signClass, signOf, trimDecimals } from '../lib/format'
import { Card } from './ui/Card'
import { EmptyState } from './ui/EmptyState'
import { ErrorState } from './ui/ErrorState'
import { Button, Field, Input, Select } from './ui/form'
import { InstrumentPicker, type InstrumentAssetClass } from './InstrumentPicker'

interface TradeEntryFormProps {
  accountId: string
  trades: Trade[]
  onCreated: (trade: Trade) => void
  onUpdated: (trade: Trade) => void
}

function toIso(localDateTime: string): string {
  return new Date(localDateTime).toISOString()
}

function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const offsetMs = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16)
}

export function TradeEntryForm({ accountId, trades, onCreated, onUpdated }: TradeEntryFormProps) {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
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

  function startEdit(trade: Trade) {
    setEditingId(trade.id)
    setSymbol(trade.symbol)
    setDirection(trade.direction)
    setSize(trimDecimals(trade.size))
    setEntryPrice(trimDecimals(trade.entry_price))
    setExitPrice(trade.exit_price ? trimDecimals(trade.exit_price) : '')
    setEntryTime(toLocalInput(trade.entry_time))
    setExitTime(trade.exit_time ? toLocalInput(trade.exit_time) : '')
    setFees(trimDecimals(trade.fees))
    setPnlGross(trade.pnl_gross ? trimDecimals(trade.pnl_gross) : '')
    setTags(trade.tags.join(', '))
    setNotes(trade.notes ?? '')
    setError(null)
    setOpen(true)
  }

  function cancelForm() {
    setOpen(false)
    setEditingId(null)
    reset()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!symbol.trim() || !size || !entryPrice || !entryTime) return
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
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
      }
      if (editingId) {
        const updated = await updateTrade(editingId, payload)
        onUpdated(updated)
      } else {
        const created = await createTrade({ account_id: accountId, ...payload })
        onCreated(created)
      }
      cancelForm()
    } catch (e) {
      setError(e instanceof Error ? e.message : editingId ? 'Failed to save trade' : 'Failed to log trade')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-text-muted">{editingId ? 'Editing trade' : 'Trades'}</div>
        <Button variant="secondary" onClick={() => (open ? cancelForm() : setOpen(true))}>
          {open ? 'Cancel' : 'Log a trade'}
        </Button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="space-y-3 mb-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <InstrumentPicker
              value={symbol}
              onChange={(sym, ac) => {
                setSymbol(sym)
                setAssetClass(ac)
              }}
              mode="both"
              className="w-full"
            />
            <Field label="Direction" className="w-full">
              <Select
                value={direction}
                onChange={(e) => setDirection(e.target.value as TradeDirection)}
                className="w-full"
              >
                <option value="long">Long</option>
                <option value="short">Short</option>
              </Select>
            </Field>
            <Field label="Size / contracts" className="w-full">
              <Input
                type="number"
                step="0.01"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full"
                required
              />
            </Field>
            <Field label="Entry price" className="w-full">
              <Input
                type="number"
                step="0.01"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full"
                required
              />
            </Field>
            <Field label="Exit price (optional)" className="w-full">
              <Input
                type="number"
                step="0.01"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                className="w-full"
              />
            </Field>
            <Field label="Fees" className="w-full">
              <Input
                type="number"
                step="0.01"
                value={fees}
                onChange={(e) => setFees(e.target.value)}
                className="w-full"
              />
            </Field>
            <Field label="Entry time" className="w-full">
              <Input
                type="datetime-local"
                value={entryTime}
                onChange={(e) => setEntryTime(e.target.value)}
                required
                className="w-full"
              />
            </Field>
            <Field label="Exit time (optional)" className="w-full">
              <Input
                type="datetime-local"
                value={exitTime}
                onChange={(e) => setExitTime(e.target.value)}
                className="w-full"
              />
            </Field>
            <Field label="Gross P&L $ (from your broker)" className="w-full">
              <Input
                type="number"
                step="0.01"
                value={pnlGross}
                onChange={(e) => setPnlGross(e.target.value)}
                className="w-full"
              />
            </Field>
            <Field label="Tags (comma separated)" className="w-full sm:col-span-2">
              <Input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full"
              />
            </Field>
            <Field label="Notes" className="w-full sm:col-span-2 lg:col-span-3">
              <Input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full"
              />
            </Field>
          </div>
          <div className="text-xs text-text-muted">
            Asset class: {assetClass === 'futures' ? 'Futures contract' : 'Stock/ETF'} · Gross P&amp;L isn't
            auto-calculated (contract multipliers aren't tracked yet) — enter the realized dollar amount from
            your platform.
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Log trade'}
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
                <th className="py-2 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums">
              {trades.slice(0, 10).map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="py-2">{formatDate(t.entry_time)}</td>
                  <td className="py-2 font-sans">{t.symbol}</td>
                  <td className="py-2 font-sans capitalize">{t.direction}</td>
                  <td className="py-2">{trimDecimals(t.size)}</td>
                  <td className="py-2">{formatMoney(t.entry_price)}</td>
                  <td className="py-2">{t.exit_price ? formatMoney(t.exit_price) : '—'}</td>
                  <td className={`py-2 ${signClass[signOf(t.pnl_net)]}`}>{formatMoney(t.pnl_net)}</td>
                  <td className="py-2 font-sans">
                    <button
                      type="button"
                      onClick={() => startEdit(t)}
                      className="text-xs text-accent-violet hover:underline"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
