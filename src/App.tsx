import { Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './pages/Dashboard'
import { FundedOverview } from './pages/FundedOverview'
import { LiveAccounts } from './pages/LiveAccounts'
import { AccountDetail } from './pages/AccountDetail'
import { Portfolio } from './pages/Portfolio'
import { StrategiesPlaceholder } from './pages/StrategiesPlaceholder'
import { CalendarPlaceholder } from './pages/CalendarPlaceholder'
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
        <Route path="portfolio/:id" element={<Portfolio />} />
        <Route path="strategies" element={<StrategiesPlaceholder />} />
        <Route path="calendar" element={<CalendarPlaceholder />} />
        <Route path="wellness" element={<Wellness />} />
      </Route>
    </Routes>
  )
}

export default App
