import type { ReactNode } from 'react'
import { Card } from './Card'
import { signClass, type Sign } from '../../lib/format'

interface StatCardProps {
  label: string
  value: ReactNode
  sign?: Sign
  sub?: ReactNode
  size?: 'sm' | 'lg'
}

export function StatCard({ label, value, sign = 'neutral', sub, size = 'lg' }: StatCardProps) {
  return (
    <Card>
      <div className="text-sm text-text-muted">{label}</div>
      <div
        className={`font-mono tabular-nums font-medium mt-2 ${
          size === 'lg' ? 'text-[28px] md:text-[40px]' : 'text-2xl'
        } ${signClass[sign]}`}
      >
        {value}
      </div>
      {sub && <div className="text-sm text-text-muted mt-1">{sub}</div>}
    </Card>
  )
}
