import { useEffect, useState } from 'react'
import {
  getAggregateRiskStatus,
  getDashboardSummary,
  getPortfolioBalance,
  getSetupPerformance,
  listAccounts,
  listAggregateRiskRules,
  listEmotionalStateLogs,
  listHoldings,
  listJournalEntries,
  listPayoutRules,
  listStrategies,
  listTradeReviews,
  type Account,
  type AggregateRiskRule,
  type AggregateRiskStatus,
  type DashboardSummary as DashboardSummaryData,
  type EmotionalStateLog,
  type Holding,
  type JournalEntry,
  type PayoutRule,
  type PnlBySetup,
  type PortfolioBalance,
  type Strategy,
  type TradeReview,
} from './api'
import { DashboardSummary } from './components/DashboardSummary'
import { SetupPerformance } from './components/SetupPerformance'
import { JournalSection } from './components/JournalSection'
import { StrategiesSection } from './components/StrategiesSection'
import { InvestmentsSection } from './components/InvestmentsSection'
import { PayoutsSection } from './components/PayoutsSection'
import { AggregateRiskSection } from './components/AggregateRiskSection'
import { WellnessSection } from './components/WellnessSection'
import './App.css'

function App() {
  const [portfolio, setPortfolio] = useState<PortfolioBalance | null>(null)
  const [summary, setSummary] = useState<DashboardSummaryData | null>(null)
  const [setupRows, setSetupRows] = useState<PnlBySetup[]>([])
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [payoutRules, setPayoutRules] = useState<PayoutRule[]>([])
  const [aggregateRiskStatus, setAggregateRiskStatus] = useState<AggregateRiskStatus | null>(null)
  const [aggregateRiskRules, setAggregateRiskRules] = useState<AggregateRiskRule[]>([])
  const [emotionalStateLogs, setEmotionalStateLogs] = useState<EmotionalStateLog[]>([])
  const [tradeReviews, setTradeReviews] = useState<TradeReview[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [
          portfolioBalance,
          dashboardSummary,
          setupPerformance,
          entries,
          strategyList,
          holdingList,
          accountList,
          payoutRuleList,
          riskStatus,
          riskRuleList,
          stateLogList,
          reviewList,
        ] = await Promise.all([
          getPortfolioBalance(),
          getDashboardSummary(),
          getSetupPerformance(),
          listJournalEntries(),
          listStrategies(),
          listHoldings(),
          listAccounts(),
          listPayoutRules(),
          getAggregateRiskStatus(),
          listAggregateRiskRules(),
          listEmotionalStateLogs(),
          listTradeReviews(),
        ])
        setPortfolio(portfolioBalance)
        setSummary(dashboardSummary)
        setSetupRows(setupPerformance)
        setJournalEntries(entries)
        setStrategies(strategyList)
        setHoldings(holdingList)
        setAccounts(accountList)
        setPayoutRules(payoutRuleList)
        setAggregateRiskStatus(riskStatus)
        setAggregateRiskRules(riskRuleList)
        setEmotionalStateLogs(stateLogList)
        setTradeReviews(reviewList)
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
      <StrategiesSection
        strategies={strategies}
        onCreated={(strategy) => setStrategies((prev) => [strategy, ...prev])}
        onUpdated={(strategy) =>
          setStrategies((prev) => prev.map((s) => (s.id === strategy.id ? strategy : s)))
        }
      />
      <InvestmentsSection
        holdings={holdings}
        portfolioAccounts={accounts.filter((a) => a.account_type === 'personal_portfolio')}
        onCreated={(holding) => setHoldings((prev) => [holding, ...prev])}
      />
      <PayoutsSection
        accounts={accounts}
        rules={payoutRules}
        onRuleCreated={(rule) => setPayoutRules((prev) => [rule, ...prev])}
      />
      <AggregateRiskSection
        status={aggregateRiskStatus}
        rules={aggregateRiskRules}
        onRuleCreated={(rule) => setAggregateRiskRules((prev) => [rule, ...prev])}
      />
      <WellnessSection
        emotionalStateLogs={emotionalStateLogs}
        tradeReviews={tradeReviews}
        onLogCreated={(log) => setEmotionalStateLogs((prev) => [log, ...prev])}
        onReviewCreated={(review) => setTradeReviews((prev) => [review, ...prev])}
      />
    </main>
  )
}

export default App
