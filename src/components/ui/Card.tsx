import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  as?: 'div' | 'section'
}

export function Card({ children, className = '', as: As = 'div' }: CardProps) {
  return (
    <As
      className={`rounded-xl border border-border bg-surface p-5 ${className}`}
    >
      {children}
    </As>
  )
}
