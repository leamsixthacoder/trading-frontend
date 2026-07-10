import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAccounts } from '../../context/AccountsContext'
import { useTheme } from '../../context/ThemeContext'
import {
  CalendarIcon,
  ChevronDownIcon,
  DashboardIcon,
  FundedIcon,
  GearIcon,
  GroupsIcon,
  LiveIcon,
  MoonIcon,
  PlansIcon,
  PortfolioIcon,
  StrategiesIcon,
  SunIcon,
  WellnessIcon,
} from './navIcons'

const navItems = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon, end: true },
  { to: '/portfolio', label: 'Portfolio', icon: PortfolioIcon, end: false },
  { to: '/funded', label: 'Funded & Eval', icon: FundedIcon, end: false },
  { to: '/live', label: 'Live', icon: LiveIcon, end: false },
  { to: '/groups', label: 'Groups', icon: GroupsIcon, end: false },
  { to: '/strategies', label: 'Strategies', icon: StrategiesIcon, end: false },
  { to: '/plans', label: 'Plans', icon: PlansIcon, end: false },
  { to: '/calendar', label: 'Calendar', icon: CalendarIcon, end: false },
  { to: '/wellness', label: 'Wellness', icon: WellnessIcon, end: false },
]

function routeFor(accountType: string, accountId: string): string {
  if (accountType === 'personal_live') return `/live/${accountId}`
  if (accountType === 'personal_portfolio') return `/portfolio/${accountId}`
  return `/funded/${accountId}`
}

export function TopNav() {
  const navigate = useNavigate()
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const { accounts } = useAccounts()
  const { theme, toggle } = useTheme()

  return (
    <header className="flex items-center gap-4 border-b border-border bg-surface px-4 py-2.5">
      <span className="font-mono text-sm font-semibold tracking-tight text-accent-green shrink-0">
        TRADEDESK
      </span>

      <nav className="flex flex-1 items-center gap-1 overflow-x-auto no-scrollbar" aria-label="Main">
        {navItems.map(({ to, label, icon: ItemIcon, end }) => {
          const isViolet = to === '/strategies'
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? isViolet
                      ? 'bg-accent-violet/10 text-accent-violet'
                      : 'bg-surface-raised text-text-primary'
                    : 'text-text-muted hover:text-text-primary'
                }`
              }
            >
              <ItemIcon />
              <span className="hidden lg:inline">{label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setAccountMenuOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={accountMenuOpen}
          className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-sm text-text-primary hover:border-accent-violet"
        >
          Account
          <ChevronDownIcon />
        </button>
        {accountMenuOpen && (
          <ul
            role="listbox"
            className="absolute right-0 z-10 mt-1 max-h-72 w-56 overflow-y-auto rounded-md border border-border bg-surface-raised py-1 shadow-lg"
          >
            {(accounts ?? []).length === 0 && (
              <li className="px-3 py-2 text-sm text-text-muted">No accounts yet</li>
            )}
            {(accounts ?? []).map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen(false)
                    navigate(routeFor(a.account_type, a.id))
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-surface"
                >
                  {a.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={toggle}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="shrink-0 rounded-md border border-border p-2 text-text-muted hover:text-text-primary hover:border-accent-violet"
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>

      <button
        type="button"
        title="Settings (coming soon)"
        aria-disabled="true"
        className="shrink-0 rounded-md border border-border p-2 text-text-muted opacity-60 cursor-not-allowed"
      >
        <GearIcon />
      </button>
    </header>
  )
}
