import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from 'react'

const fieldClass =
  'rounded-md border border-border bg-surface-raised px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus-visible:border-accent-violet'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldClass} ${props.className ?? ''}`} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${fieldClass} ${props.className ?? ''}`} />
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
