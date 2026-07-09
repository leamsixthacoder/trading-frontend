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

export function daysSince(value: string | null | undefined): number | null {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  const ms = Date.now() - d.getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}

export function isoWeekKey(dateStr: string): string {
  const d = new Date(dateStr)
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${target.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}
