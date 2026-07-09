import { Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './pages/Dashboard'
import { FundedOverview } from './pages/FundedOverview'
import { LiveAccounts } from './pages/LiveAccounts'
import { AccountDetail } from './pages/AccountDetail'
import { Portfolio } from './pages/Portfolio'
import { PortfolioDetail } from './pages/PortfolioDetail'
import { StrategiesList } from './pages/StrategiesList'
import { StrategyDetail } from './pages/StrategyDetail'
import { Calendar } from './pages/Calendar'
import { Wellness } from './pages/Wellness'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="funded" element={<FundedOverview />} />
        <Route path="funded/:id" element={<AccountDetail />} />
        <Route path="live" element={<LiveAccounts />} />
        <Route path="live/:id" element={<AccountDetail />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="portfolio/:id" element={<PortfolioDetail />} />
        <Route path="strategies" element={<StrategiesList />} />
        <Route path="strategies/:id" element={<StrategyDetail />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="wellness" element={<Wellness />} />
      </Route>
    </Routes>
  )
}

export default App
