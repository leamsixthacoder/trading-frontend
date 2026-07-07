import { useEffect, useState } from 'react'
import { getAccountBalance, listAccounts, type AccountBalance } from './api'
import './App.css'

function App() {
  const [balances, setBalances] = useState<AccountBalance[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const accounts = await listAccounts()
        const withBalances = await Promise.all(
          accounts.map((a) => getAccountBalance(a.id)),
        )
        setBalances(withBalances)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load accounts')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <p>Loading accounts...</p>
  if (error) return <p>Error: {error}</p>

  return (
    <main>
      <h1>Accounts</h1>
      <table>
        <thead>
          <tr>
            <th>Label</th>
            <th>Type</th>
            <th>Status</th>
            <th>Capital base</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {balances.map((b) => (
            <tr key={b.account_id}>
              <td>{b.label}</td>
              <td>{b.account_type}</td>
              <td>{b.status}</td>
              <td>{b.capital_base}</td>
              <td>{b.current_balance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}

export default App
