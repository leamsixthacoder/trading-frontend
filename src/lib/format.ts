export type Sign = 'positive' | 'negative' | 'neutral'

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const compactMoneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  return typeof value === 'number' ? value : Number(value)
}

// Backend NUMERIC columns round-trip as fixed-precision strings (e.g. size "1.0000"),
// which is too noisy to show in a form field. Round to maxDecimals and strip trailing
// zeros — the result stays a plain decimal string, safe to feed back into
// <input type="number">.
export function trimDecimals(value: string | number | null | undefined, maxDecimals = 2): string {
  if (value === null || value === undefined || value === '') return ''
  const n = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(n)) return ''
  const fixed = n.toFixed(maxDecimals)
  if (!fixed.includes('.')) return fixed
  const trimmed = fixed.replace(/0+$/, '')
  return trimmed.endsWith('.') ? trimmed.slice(0, -1) : trimmed
}

export function signOf(value: string | number | null | undefined): Sign {
  const n = toNumber(value)
  if (n > 0) return 'positive'
  if (n < 0) return 'negative'
  return 'neutral'
}

export const signClass: Record<Sign, string> = {
  positive: 'text-accent-green',
  negative: 'text-accent-red',
  neutral: 'text-text-primary',
}

export function formatMoney(value: string | number | null | undefined, compact = false): string {
  const n = toNumber(value)
  return compact ? compactMoneyFormatter.format(n) : moneyFormatter.format(n)
}

export function formatSigned(value: string | number | null | undefined, compact = false): string {
  const n = toNumber(value)
  const formatted = formatMoney(Math.abs(n), compact)
  if (n > 0) return `+${formatted}`
  if (n < 0) return `-${formatted}`
  return formatted
}

export function formatPct(value: number | null | undefined, opts?: { fromRatio?: boolean }): string {
  if (value === null || value === undefined) return '—'
  const pct = opts?.fromRatio ? value * 100 : value
  return `${pct.toFixed(1)}%`
}

export function formatSignedPct(value: number | null | undefined, opts?: { fromRatio?: boolean }): string {
  if (value === null || value === undefined) return '—'
  const pct = opts?.fromRatio ? value * 100 : value
  const formatted = `${Math.abs(pct).toFixed(1)}%`
  if (pct > 0) return `+${formatted}`
  if (pct < 0) return `-${formatted}`
  return formatted
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// Backend DATE columns (day, acquired_date, snapshot_date, entry_date, period_start/end)
// serialize as "YYYY-MM-DD..." — a pure calendar date, not an instant. Parsing that with
// `new Date()` and reading local getters (or plain toLocaleDateString) reinterprets UTC
// midnight in the viewer's timezone, shifting the displayed day back one for any zone
// behind UTC. Read the Y/M/D directly from the string prefix instead of round-tripping
// through a local Date so the calendar date never moves.
export function dateOnlyParts(value: string): { year: number; month: number; day: number } {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return { year, month, day }
}

export function dateOnlyKey(value: string): string {
  return value.slice(0, 10)
}

export function formatDateUTC(value: string | null | undefined): string {
  if (!value) return '—'
  const { year, month, day } = dateOnlyParts(value)
  if (!year || !month || !day) return value
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function daysSince(value: string | null | undefined): number | null {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  const ms = Date.now() - d.getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}

export function isoWeekKey(dateStr: string): string {
  const { year, month, day } = dateOnlyParts(dateStr)
  const target = new Date(Date.UTC(year, month - 1, day))
  const dayNum = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${target.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}
