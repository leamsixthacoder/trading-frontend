import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { PieChart, Pie, Cell, Legend, Tooltip } from 'recharts'
import {
  createHolding,
  createPortfolioSnapshot,
  getPortfolioReturns,
  listAccounts,
  listHoldings,
  listPortfolioSnapshots,
  updateHolding,
  type Holding,
  type PortfolioReturn,
  type PortfolioSnapshot,
} from '../api'
import { useApi } from '../hooks/useApi'
import { formatDate, formatDateUTC, formatMoney, formatSignedPct, signClass, signOf, toNumber } from '../lib/format'
import { Card } from '../components/ui/Card'
import { StatCardSkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { StatusBadge } from '../components/ui/Badge'
import { Button, Input, Select } from '../components/ui/form'
import { InstrumentPicker } from '../components/InstrumentPicker'

const PALETTE = ['#5B8DEF', '#F5A623', '#4FC3B0', '#E07BE0', '#8FA6FF', '#D97757']

const RETURN_PERIODS: { label: string; period: string }[] = [
  { label: 'Quarter', period: 'quarter' },
  { label: 'Year', period: 'year' },
  { label: '4-Year', period: '4y' },
  { label: '5-Year', period: '5y' },
]

function holdingValue(h: Holding): number {
  return toNumber(h.quantity) * toNumber(h.cost_basis)
}

function AllocationDonut({ holdings }: { holdings: Holding[] }) {
  const [groupBy, setGroupBy] = useState<'asset_class' | 'symbol'>('asset_class')

  const data = useMemo(() => {
    const map = new Map<string, number>()
    for (const h of holdings) {
      const key = groupBy === 'asset_class' ? h.asset_class || 'unknown' : h.symbol
      map.set(key, (map.get(key) ?? 0) + holdingValue(h))
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [holdings, groupBy])

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-text-muted">Allocation (by cost basis)</div>
        <div className="flex rounded-md border border-border p-0.5">
          {(['asset_class', 'symbol'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setGroupBy(v)}
              className={`rounded px-2.5 py-1 text-xs transition-colors ${
                groupBy === v ? 'bg-surface-raised text-text-primary' : 'text-text-muted'
              }`}
            >
              {v === 'asset_class' ? 'Asset class' : 'Symbol'}
            </button>
          ))}
        </div>
      </div>
      {data.length === 0 ? (
        <EmptyState title="No holdings yet" description="Add a holding to see the allocation breakdown." />
      ) : (
        <div className="flex items-center justify-center">
          <PieChart width={320} height={240}>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Legend />
            <Tooltip
              formatter={(value) => formatMoney(typeof value === 'number' ? value : Number(value))}
              contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
            />
          </PieChart>
        </div>
      )}
    </Card>
  )
}

function ReturnsRow({ accountId }: { accountId: string }) {
  const [active, setActive] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PortfolioReturn | null>(null)
  const [insufficientHistory, setInsufficientHistory] = useState(false)

  async function handleClick(period: string) {
    setActive(period)
    setLoading(true)
    setResult(null)
    setInsufficientHistory(false)
    try {
      const r = await getPortfolioReturns(accountId, period)
      setResult(r)
    } catch {
      setInsufficientHistory(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <div className="text-sm text-text-muted mb-3">Returns</div>
      <div className="flex flex-wrap gap-2 mb-4">
        {RETURN_PERIODS.map(({ label, period }) => (
          <Button
            key={period}
            variant={active === period ? 'violet' : 'secondary'}
            onClick={() => handleClick(period)}
          >
            {label}
          </Button>
        ))}
      </div>
      {loading && <div className="text-sm text-text-muted">Loading…</div>}
      {!loading && insufficientHistory && (
        <EmptyState
          title="Not enough history yet"
          description="Record snapshots at the start and end of this window to see a return here."
        />
      )}
      {!loading && result && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <div className="text-xs text-text-muted">Start ({formatDateUTC(result.start_date)})</div>
            <div className="font-mono tabular-nums text-lg text-text-primary">{formatMoney(result.start_value)}</div>
          </div>
          <div>
            <div className="text-xs text-text-muted">End ({formatDateUTC(result.end_date)})</div>
            <div className="font-mono tabular-nums text-lg text-text-primary">{formatMoney(result.end_value)}</div>
          </div>
          <div>
            <div className="text-xs text-text-muted">Return</div>
            <div className={`font-mono tabular-nums text-lg ${signClass[signOf(result.return_pct)]}`}>
              {formatSignedPct(result.return_pct)}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

export function PortfolioDetail() {
  const { id = '' } = useParams<{ id: string }>()
  const accounts = useApi(listAccounts, [])
  const holdings = useApi(() => listHoldings(id), [id])
  const snapshots = useApi(() => listPortfolioSnapshots(id), [id])

  const account = useMemo(() => accounts.data?.find((a) => a.id === id), [accounts.data, id])

  const [holdingItems, setHoldingItems] = useState<Holding[]>([])
  useEffect(() => {
    if (holdings.data) setHoldingItems(holdings.data)
  }, [holdings.data])

  const [snapshotItems, setSnapshotItems] = useState<PortfolioSnapshot[]>([])
  useEffect(() => {
    if (snapshots.data) setSnapshotItems(snapshots.data)
  }, [snapshots.data])

  const totalCostBasisValue = useMemo(
    () => holdingItems.reduce((sum, h) => sum + holdingValue(h), 0),
    [holdingItems],
  )

  // add-holding form
  const [symbol, setSymbol] = useState('')
  const [assetClass, setAssetClass] = useState('equity')
  const [quantity, setQuantity] = useState('')
  const [costBasis, setCostBasis] = useState('')
  const [acquiredDate, setAcquiredDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  async function handleAddHolding(e: FormEvent) {
    e.preventDefault()
    if (!symbol.trim() || !quantity || !costBasis) return
    setAddSubmitting(true)
    setAddError(null)
    try {
      const created = await createHolding({
        account_id: id,
        symbol: symbol.trim(),
        quantity: Number(quantity),
        cost_basis: Number(costBasis),
        acquired_date: acquiredDate,
        asset_class: assetClass,
      })
      setHoldingItems((prev) => [created, ...prev])
      setSymbol('')
      setQuantity('')
      setCostBasis('')
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Failed to add holding')
    } finally {
      setAddSubmitting(false)
    }
  }

  // inline edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQuantity, setEditQuantity] = useState('')
  const [editCostBasis, setEditCostBasis] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  function startEdit(h: Holding) {
    setEditingId(h.id)
    setEditQuantity(h.quantity)
    setEditCostBasis(h.cost_basis)
  }

  async function saveEdit(holdingId: string) {
    setEditSubmitting(true)
    try {
      const updated = await updateHolding(holdingId, {
        quantity: Number(editQuantity),
        cost_basis: Number(editCostBasis),
      })
      setHoldingItems((prev) => prev.map((h) => (h.id === holdingId ? updated : h)))
      setEditingId(null)
    } catch {
      // leave the row in edit mode so the user can retry
    } finally {
      setEditSubmitting(false)
    }
  }

  // snapshot form
  const [snapshotDate, setSnapshotDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [snapshotValue, setSnapshotValue] = useState('')
  const [snapshotSubmitting, setSnapshotSubmitting] = useState(false)
  const [snapshotError, setSnapshotError] = useState<string | null>(null)

  async function handleAddSnapshot(e: FormEvent) {
    e.preventDefault()
    if (!snapshotValue) return
    setSnapshotSubmitting(true)
    setSnapshotError(null)
    try {
      const created = await createPortfolioSnapshot({
        account_id: id,
        snapshot_date: snapshotDate,
        total_value: Number(snapshotValue),
      })
      setSnapshotItems((prev) => [created, ...prev])
      setSnapshotValue('')
    } catch (e) {
      setSnapshotError(e instanceof Error ? e.message : 'Failed to record snapshot')
    } finally {
      setSnapshotSubmitting(false)
    }
  }

  if (accounts.error) {
    return <ErrorState message="Couldn't load account — check your connection and retry." onRetry={accounts.refetch} />
  }
  if (accounts.loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    )
  }
  if (!account) {
    return <EmptyState title="Account not found" description="It may have been closed or the link is out of date." />
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-medium text-text-primary">{account.label}</h1>
          <StatusBadge status={account.status} />
        </div>
        <div className="text-sm text-text-muted mt-1">
          {formatMoney(account.capital_base)} capital · started {formatDate(account.created_at)}
        </div>
      </div>

      <Card>
        <div className="text-sm text-text-muted mb-3">Holdings</div>
        <form onSubmit={handleAddHolding} className="flex flex-wrap items-end gap-2 mb-4">
          <InstrumentPicker value={symbol} onChange={setSymbol} mode="stock" className="w-28" />
          <Select value={assetClass} onChange={(e) => setAssetClass(e.target.value)}>
            <option value="equity">Equity</option>
            <option value="etf">ETF</option>
            <option value="other">Other</option>
          </Select>
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
          <Button type="submit" disabled={addSubmitting}>
            {addSubmitting ? 'Adding…' : 'Add holding'}
          </Button>
        </form>
        {addError && <ErrorState message={addError} />}

        {holdings.error && (
          <ErrorState message="Couldn't load holdings — check your connection and retry." onRetry={holdings.refetch} />
        )}
        {!holdings.error && holdings.loading && <div className="text-sm text-text-muted">Loading…</div>}
        {!holdings.error && !holdings.loading && holdingItems.length === 0 && (
          <EmptyState title="No holdings yet" description="Add your first holding above." />
        )}
        {!holdings.error && !holdings.loading && holdingItems.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-text-muted">
                    <th className="py-2 font-normal">Symbol</th>
                    <th className="py-2 font-normal">Class</th>
                    <th className="py-2 font-normal">Quantity</th>
                    <th className="py-2 font-normal">Cost basis</th>
                    <th className="py-2 font-normal">Cost value</th>
                    <th className="py-2 font-normal">% of portfolio</th>
                    <th className="py-2 font-normal">Current value</th>
                    <th className="py-2 font-normal">Unrealized G/L</th>
                    <th className="py-2 font-normal">Acquired</th>
                    <th className="py-2 font-normal"></th>
                  </tr>
                </thead>
                <tbody className="font-mono tabular-nums">
                  {holdingItems.map((h) => {
                    const value = holdingValue(h)
                    const pct = totalCostBasisValue > 0 ? (value / totalCostBasisValue) * 100 : 0
                    const isEditing = editingId === h.id
                    return (
                      <tr key={h.id} className="border-b border-border last:border-0">
                        <td className="py-2 font-sans">{h.symbol}</td>
                        <td className="py-2 font-sans">{h.asset_class}</td>
                        <td className="py-2">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editQuantity}
                              onChange={(e) => setEditQuantity(e.target.value)}
                              className="w-20"
                            />
                          ) : (
                            h.quantity
                          )}
                        </td>
                        <td className="py-2">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editCostBasis}
                              onChange={(e) => setEditCostBasis(e.target.value)}
                              className="w-24"
                            />
                          ) : (
                            formatMoney(h.cost_basis)
                          )}
                        </td>
                        <td className="py-2">{formatMoney(value)}</td>
                        <td className="py-2">{pct.toFixed(1)}%</td>
                        <td className="py-2 text-text-muted">—</td>
                        <td className="py-2 text-text-muted">—</td>
                        <td className="py-2">{formatDateUTC(h.acquired_date)}</td>
                        <td className="py-2 font-sans">
                          {isEditing ? (
                            <Button
                              variant="secondary"
                              disabled={editSubmitting}
                              onClick={() => saveEdit(h.id)}
                            >
                              Save
                            </Button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEdit(h)}
                              className="text-xs text-accent-violet hover:underline"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="text-xs text-text-muted mt-2">
              Current value and unrealized gain/loss need a live/delayed price source — not wired up yet, so % of
              portfolio above is weighted by cost basis rather than market value.
            </div>
          </>
        )}
      </Card>

      <AllocationDonut holdings={holdingItems} />

      <ReturnsRow accountId={id} />

      <Card>
        <div className="text-sm text-text-muted mb-3">Snapshots</div>
        <form onSubmit={handleAddSnapshot} className="flex flex-wrap items-end gap-2 mb-4">
          <Input type="date" value={snapshotDate} onChange={(e) => setSnapshotDate(e.target.value)} />
          <Input
            type="number"
            placeholder="Total value"
            value={snapshotValue}
            onChange={(e) => setSnapshotValue(e.target.value)}
            className="w-36"
          />
          <Button type="submit" disabled={snapshotSubmitting}>
            {snapshotSubmitting ? 'Recording…' : 'Record snapshot'}
          </Button>
        </form>
        {snapshotError && <ErrorState message={snapshotError} />}
        <div className="text-xs text-text-muted mb-3">
          Returns are computed from snapshots — record one periodically (e.g. from a brokerage statement) so
          Quarter/Year/4-Year/5-Year windows above have real start/end values.
        </div>

        {snapshots.error && (
          <ErrorState message="Couldn't load snapshots — check your connection and retry." onRetry={snapshots.refetch} />
        )}
        {!snapshots.error && !snapshots.loading && snapshotItems.length === 0 && (
          <EmptyState title="No snapshots recorded yet" description="Record one above to start building return history." />
        )}
        {!snapshots.error && snapshotItems.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-muted">
                  <th className="py-2 font-normal">Date</th>
                  <th className="py-2 font-normal">Total value</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {[...snapshotItems]
                  .sort((a, b) => b.snapshot_date.localeCompare(a.snapshot_date))
                  .map((s) => (
                    <tr key={s.id} className="border-b border-border last:border-0">
                      <td className="py-2">{formatDateUTC(s.snapshot_date)}</td>
                      <td className="py-2">{formatMoney(s.total_value)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
