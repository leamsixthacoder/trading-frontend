import { AccountsList } from './AccountsList'

export function LiveAccounts() {
  return (
    <AccountsList
      title="Live Accounts"
      accountTypes={['personal_live']}
      basePath="/live"
      emptyDescription="Personal live accounts will appear here once seeded on the backend."
    />
  )
}
