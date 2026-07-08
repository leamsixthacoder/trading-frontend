import { useEffect, useState } from 'react'
import {
  getAccountBalance,
  getPortfolioBalance,
  listAccounts,
  type AccountBalance,
  type PortfolioBalance,
} from './api'
import './App.css'

function App() {
  const [balances, setBalances] = useState<AccountBalance[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioBalance | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [accounts, portfolioBalance] = await Promise.all([
          listAccounts(),
          getPortfolioBalance(),
        ])
        const withBalances = await Promise.all(
          accounts.map((a) => getAccountBalance(a.id)),
        )
        setBalances(withBalances)
        setPortfolio(portfolioBalance)
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
      <h1>Portfolio</h1>
      {portfolio && (
        <>
          <table>
            <thead>
              <tr>
                <th>Total capital</th>
                <th>Total P&amp;L</th>
                <th>Total allocations</th>
                <th>Total balance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{portfolio.total.total_capital_base}</td>
                <td>{portfolio.total.total_trade_pnl}</td>
                <td>{portfolio.total.total_allocations}</td>
                <td>{portfolio.total.total_balance}</td>
              </tr>
            </tbody>
          </table>

          <h2>By account type</h2>
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th># accounts</th>
                <th>Capital</th>
                <th>P&amp;L</th>
                <th>Allocations</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.by_type.map((row) => (
                <tr key={row.account_type}>
                  <td>{row.account_type}</td>
                  <td>{row.account_count}</td>
                  <td>{row.total_capital_base}</td>
                  <td>{row.total_trade_pnl}</td>
                  <td>{row.total_allocations}</td>
                  <td>{row.total_balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

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
