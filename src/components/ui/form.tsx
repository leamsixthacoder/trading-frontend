import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

const fieldClass =
  'h-9 rounded-md border border-border bg-surface-raised px-3 text-sm leading-none text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:border-accent-violet transition-colors'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldClass} ${props.className ?? ''}`} />
}

// Native <select> arrows render with extra intrinsic height in some browsers even with
// identical padding to <input> — appearance-none + a drawn chevron keeps the box heights
// pixel-identical instead of relying on each browser's default arrow rendering.
const chevronUrl =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%239a9a9a' stroke-width='1.5'%3E%3Cpath d='M5 7l5 5 5-5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"

export function Select({ style, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`${fieldClass} appearance-none bg-no-repeat pr-8 ${props.className ?? ''}`}
      style={{
        backgroundImage: `url("${chevronUrl}")`,
        backgroundPosition: 'right 0.6rem center',
        backgroundSize: '14px 14px',
        ...style,
      }}
    />
  )
}

export function Field({
  label,
  children,
  className = '',
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <div className="text-xs text-text-muted mb-1">{label}</div>
      {children}
    </div>
  )
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'violet' }) {
  const base = 'rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-accent-green text-bg hover:bg-accent-green/90',
    secondary: 'border border-border bg-surface-raised text-text-primary hover:border-accent-violet',
    violet: 'bg-accent-violet text-bg hover:bg-accent-violet/90',
  }
  return <button {...props} className={`${base} ${variants[variant]} ${className}`} />
}
