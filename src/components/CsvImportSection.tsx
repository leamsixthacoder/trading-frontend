import { useEffect, useState, type FormEvent } from 'react'
import {
  commitCsvImport,
  previewCsvImport,
  type CsvImport,
  type CsvImportPreview,
  type CsvPlatform,
} from '../api'
import { useApi } from '../hooks/useApi'
import { listCsvImports } from '../api'
import { formatDate, formatMoney, signClass, signOf } from '../lib/format'
import { Card } from './ui/Card'
import { EmptyState } from './ui/EmptyState'
import { ErrorState } from './ui/ErrorState'
import { Button, Select } from './ui/form'

const PLATFORM_LABELS: Record<CsvPlatform, string> = {
  ninjatrader: 'NinjaTrader',
  tradestation: 'TradeStation',
  topstepx: 'TopstepX (native)',
}

interface CsvImportSectionProps {
  accountId: string
  onImported: () => void
}

export function CsvImportSection({ accountId, onImported }: CsvImportSectionProps) {
  const [open, setOpen] = useState(false)
  const [platform, setPlatform] = useState<CsvPlatform>('ninjatrader')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CsvImportPreview | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [committing, setCommitting] = useState(false)
  const [commitError, setCommitError] = useState<string | null>(null)
  const [result, setResult] = useState<CsvImport | null>(null)

  const history = useApi(() => listCsvImports(accountId), [accountId])
  const [batches, setBatches] = useState<CsvImport[]>([])
  useEffect(() => {
    if (history.data) setBatches(history.data)
  }, [history.data])

  function resetOutcome() {
    setPreview(null)
    setResult(null)
    setPreviewError(null)
    setCommitError(null)
  }

  async function handlePreview(e: FormEvent) {
    e.preventDefault()
    if (!file) return
    setPreviewing(true)
    resetOutcome()
    try {
      const p = await previewCsvImport(accountId, platform, file)
      setPreview(p)
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Failed to preview import')
    } finally {
      setPreviewing(false)
    }
  }

  async function handleCommit() {
    if (!file) return
    setCommitting(true)
    setCommitError(null)
    try {
      const r = await commitCsvImport(accountId, platform, file)
      setResult(r)
      setPreview(null)
      setBatches((prev) => [r, ...prev])
      onImported()
    } catch (err) {
      setCommitError(err instanceof Error ? err.message : 'Failed to commit import')
    } finally {
      setCommitting(false)
    }
  }

  const importableCount = preview ? preview.valid_count : 0

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-text-muted">CSV Import</div>
        <Button
          variant="secondary"
          onClick={() => {
            setOpen((v) => !v)
            resetOutcome()
          }}
        >
          {open ? 'Cancel' : 'Import CSV'}
        </Button>
      </div>

      {open && (
        <div className="space-y-3 mb-5">
          <form onSubmit={handlePreview} className="flex flex-wrap items-end gap-2">
            <div>
              <div className="text-xs text-text-muted mb-1">Platform</div>
              <Select
                value={platform}
                onChange={(e) => {
                  setPlatform(e.target.value as CsvPlatform)
                  resetOutcome()
                }}
              >
                {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <div className="text-xs text-text-muted mb-1">CSV file</div>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null)
                  resetOutcome()
                }}
                className="block text-sm text-text-primary file:mr-2 file:rounded-md file:border file:border-border file:bg-surface-raised file:px-2 file:py-1.5 file:text-sm file:text-text-primary"
              />
            </div>
            <Button type="submit" variant="secondary" disabled={!file || previewing}>
              {previewing ? 'Checking…' : 'Preview'}
            </Button>
          </form>
          {previewError && <ErrorState message={previewError} />}

          {preview && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="text-text-muted">{preview.total_rows} rows read</span>
                <span className="text-accent-green">{preview.valid_count} will import</span>
                <span className="text-text-muted">{preview.duplicate_count} already imported</span>
                {preview.error_count > 0 && (
                  <span className="text-accent-red">{preview.error_count} invalid</span>
                )}
              </div>

              {preview.rows.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-text-muted">
                        <th className="py-2 font-normal">Row</th>
                        <th className="py-2 font-normal">Symbol</th>
                        <th className="py-2 font-normal">Dir</th>
                        <th className="py-2 font-normal">Entry</th>
                        <th className="py-2 font-normal">Exit</th>
                        <th className="py-2 font-normal">Gross P&amp;L</th>
                        <th className="py-2 font-normal">Status</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono tabular-nums">
                      {preview.rows.map((r) => (
                        <tr
                          key={r.row_number}
                          className={`border-b border-border last:border-0 ${r.is_duplicate ? 'opacity-50' : ''}`}
                        >
                          <td className="py-2">{r.row_number}</td>
                          <td className="py-2 font-sans">{r.symbol}</td>
                          <td className="py-2 font-sans capitalize">{r.direction}</td>
                          <td className="py-2">{formatMoney(r.entry_price)}</td>
                          <td className="py-2">{r.exit_price ? formatMoney(r.exit_price) : '—'}</td>
                          <td className={`py-2 ${r.pnl_gross ? signClass[signOf(r.pnl_gross)] : ''}`}>
                            {r.pnl_gross ? formatMoney(r.pnl_gross) : '—'}
                          </td>
                          <td className="py-2 font-sans">
                            {r.is_duplicate ? (
                              <span className="text-text-muted">Already imported</span>
                            ) : (
                              <span className="text-accent-green">Will import</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {preview.errors.length > 0 && (
                <div>
                  <div className="text-xs text-accent-red mb-1">{preview.errors.length} row(s) invalid — will be skipped</div>
                  <ul className="text-xs text-text-muted space-y-0.5">
                    {preview.errors.map((e, i) => (
                      <li key={i}>
                        Row {e.row_number} [{e.field}]: {e.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button onClick={handleCommit} disabled={committing || importableCount === 0}>
                {committing
                  ? 'Importing…'
                  : `Confirm import (${importableCount} trade${importableCount === 1 ? '' : 's'})`}
              </Button>
              {commitError && <ErrorState message={commitError} />}
            </div>
          )}

          {result && (
            <div className="rounded-md border border-accent-green/30 bg-accent-green-dim px-3 py-2 text-sm text-accent-green">
              Imported {result.rows_inserted} trade{result.rows_inserted === 1 ? '' : 's'}
              {result.rows_skipped_dupe > 0 && ` · ${result.rows_skipped_dupe} already existed`}
              {result.validation_errors.length > 0 && ` · ${result.validation_errors.length} row(s) invalid`}
            </div>
          )}
        </div>
      )}

      <div className="text-sm text-text-muted mb-2">Import history</div>
      {history.error && (
        <ErrorState message="Couldn't load import history — check your connection and retry." onRetry={history.refetch} />
      )}
      {!history.error && batches.length === 0 && (
        <EmptyState title="No imports yet" description="Import a CSV above to see its history here." />
      )}
      {!history.error && batches.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="py-2 font-normal">Date</th>
                <th className="py-2 font-normal">File</th>
                <th className="py-2 font-normal">Platform</th>
                <th className="py-2 font-normal">Inserted</th>
                <th className="py-2 font-normal">Skipped (dupe)</th>
                <th className="py-2 font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums">
              {batches.map((b) => (
                <tr key={b.id} className="border-b border-border last:border-0">
                  <td className="py-2">{formatDate(b.imported_at)}</td>
                  <td className="py-2 font-sans">{b.filename}</td>
                  <td className="py-2 font-sans">{PLATFORM_LABELS[b.source_platform as CsvPlatform] ?? b.source_platform}</td>
                  <td className="py-2 text-accent-green">{b.rows_inserted}</td>
                  <td className="py-2 text-text-muted">{b.rows_skipped_dupe}</td>
                  <td className="py-2 font-sans capitalize">{b.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
