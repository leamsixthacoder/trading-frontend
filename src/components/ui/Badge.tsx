import type { ReactNode } from 'react'

export type BadgeTone = 'neutral' | 'green' | 'red' | 'violet' | 'muted'

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-surface-raised text-text-primary border-border',
  green: 'bg-accent-green-dim text-accent-green border-accent-green/30',
  red: 'bg-accent-red/10 text-accent-red border-accent-red/30',
  violet: 'bg-accent-violet/10 text-accent-violet border-accent-violet/30',
  muted: 'bg-surface-raised text-text-muted border-border',
}

interface BadgeProps {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}

export function Badge({ children, tone = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

const accountTypeLabels: Record<string, string> = {
  funded_lucid: 'Lucid Flex',
  funded_topstep: 'Topstep',
  personal_live: 'Live',
  personal_portfolio: 'Portfolio',
}

export function AccountTypeBadge({ accountType }: { accountType: string }) {
  return <Badge tone="violet">{accountTypeLabels[accountType] ?? accountType}</Badge>
}

const statusTone: Record<string, BadgeTone> = {
  active: 'green',
  paused: 'muted',
  failed: 'red',
  closed: 'neutral',
}

export function StatusBadge({ status }: { status: string }) {
  const label = status === 'failed' ? 'Breached' : status.charAt(0).toUpperCase() + status.slice(1)
  return <Badge tone={statusTone[status] ?? 'neutral'}>{label}</Badge>
}
