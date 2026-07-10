import { AccountsList } from './AccountsList'

export function Portfolio() {
  return (
    <AccountsList
      title="Portfolio"
      accountTypes={['personal_portfolio']}
      basePath="/portfolio"
      emptyDescription="Personal stock/brokerage accounts will appear here once seeded on the backend."
      allowAdd
    />
  )
}
