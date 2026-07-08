import { useEffect, useState } from 'react'
import {
  getDashboardSummary,
  getPortfolioBalance,
  getSetupPerformance,
  listJournalEntries,
  type DashboardSummary as DashboardSummaryData,
  type JournalEntry,
  type PnlBySetup,
  type PortfolioBalance,
} from './api'
import { DashboardSummary } from './components/DashboardSummary'
import { SetupPerformance } from './components/SetupPerformance'
import { JournalSection } from './components/JournalSection'
import './App.css'

function App() {
  const [portfolio, setPortfolio] = useState<PortfolioBalance | null>(null)
  const [summary, setSummary] = useState<DashboardSummaryData | null>(null)
  const [setupRows, setSetupRows] = useState<PnlBySetup[]>([])
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [portfolioBalance, dashboardSummary, setupPerformance, entries] =
          await Promise.all([
            getPortfolioBalance(),
            getDashboardSummary(),
            getSetupPerformance(),
            listJournalEntries(),
          ])
        setPortfolio(portfolioBalance)
        setSummary(dashboardSummary)
        setSetupRows(setupPerformance)
        setJournalEntries(entries)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <p>Loading...</p>
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

      {summary && <DashboardSummary summary={summary} />}
      <SetupPerformance rows={setupRows} />
      <JournalSection
        entries={journalEntries}
        onCreated={(entry) => setJournalEntries((prev) => [entry, ...prev])}
      />
    </main>
  )
}

export default App
