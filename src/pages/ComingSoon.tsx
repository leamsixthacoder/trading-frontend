import { Card } from '../components/ui/Card'

interface ComingSoonProps {
  title: string
  description: string
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div>
      <h1 className="text-2xl font-medium text-text-primary mb-4">{title}</h1>
      <Card className="flex flex-col items-center gap-2 py-16 text-center">
        <span className="inline-flex items-center rounded-full border border-accent-violet/30 bg-accent-violet/10 px-2.5 py-0.5 text-xs font-medium text-accent-violet">
          Coming in a follow-up pass
        </span>
        <p className="max-w-md text-sm text-text-muted">{description}</p>
      </Card>
    </div>
  )
}
