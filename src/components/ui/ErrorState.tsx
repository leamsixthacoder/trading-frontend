interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <p className="text-sm text-accent-red">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md border border-border bg-surface-raised px-3 py-1.5 text-sm text-text-primary hover:border-accent-violet transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  )
}
