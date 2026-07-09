# FRONTEND_SPEC.md — UI/UX Specification

Read `CONTEXT.md`, `TECH_STACK.md`, and the Phase 1–4 docs in the backend repo
before building — every screen here reads from endpoints already specced
there. This file does not redefine backend behavior, only how it's presented.

Reference material: the person supplied screenshots of a prop-firm account
dashboard (dark theme, account header with program/status badges, balance/
equity/win-rate/trading-days stat cards, an equity area chart with hover
tooltip, a performance line chart, profit-target/daily-loss/max-loss cards, a
statistics grid, a daily/weekly summary table, and a month calendar with
per-day P&L). That reference sets the bar for density and financial-dashboard
conventions — this spec adapts it into an original visual identity rather
than copying it directly.

---

## 1. Design System

### Why not the obvious default
A near-black background with a single bright green accent is the single most
common "AI trading dashboard" look — it's also literally what the reference
screenshots already show. Rather than reproduce that directly, the direction
below keeps the financial-dashboard conventions that actually work (dark
surface, tabular numbers, green/red for gain/loss — traders read these
instantly and changing them for novelty would hurt usability) but grounds the
palette and signature element in something more specific than "dark + neon
green."

### Palette

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#0A0D0C` | App background — graphite with a faint green undertone, not pure black |
| `--surface` | `#121715` | Cards, panels |
| `--surface-raised` | `#1A211E` | Modals, dropdowns, hover states |
| `--border` | `#212B26` | Hairline dividers, card borders |
| `--text-primary` | `#EAF0ED` | Headings, key numbers |
| `--text-muted` | `#7E8F87` | Labels, secondary text |
| `--accent-green` | `#3ECF8E` | Profit, positive P&L, primary CTAs, active/live status |
| `--accent-green-dim` | `#1B4332` | Green fills at low opacity (chart areas, subtle backgrounds) |
| `--accent-red` | `#F0616B` | Loss, negative P&L, breached/failed status, destructive actions |
| `--accent-violet` | `#8B7CF6` | Strategy module identity, focus rings, secondary emphasis — deliberately NOT used for money values, so it never competes with green/red's meaning |

Green and red are reserved exclusively for financial sign (profit/loss,
pass/breach). Violet is the one place this design takes a visual risk — used
only for the Strategy module's identity color and for interactive focus
states — so a user always knows at a glance "violet = system/strategy
context, not a P&L value."

### Typography

- **UI/display face**: Inter — clean grotesk, used for nav, labels, headings, body copy.
- **Numeric/data face**: IBM Plex Mono, `font-variant-numeric: tabular-nums` — used for every dollar figure, percentage, and table column of numbers. This is the deliberate choice: money and stats are set in monospace so columns of numbers actually align vertically, the way a real trading terminal does. UI chrome around them stays in Inter so the interface doesn't read as all-monospace/generic-terminal.
- **Scale**: 12 / 14 / 16 / 20 / 28 / 40px. Card titles at 14px muted, card primary figures at 28–40px depending on card size, table body at 14px.

### Signature element — the Equity Tape

A thin (32px) horizontal ticker strip pinned under the top nav, present on
every screen: each account's label and current balance (from
`account_balances`), color-coded green/red by today's change, scrolling
horizontally like a trading tape. Clicking an entry jumps to that account's
detail view. This is the one memorable, subject-specific signature — it
turns "list of accounts" into something that feels like the market data it's
tracking, and it's the fastest possible way to see every account's status
without navigating anywhere.

### Layout shell

```
┌─────────────────────────────────────────────────────────┐
│ Logo   Dashboard  Portfolio  Funded/Eval  Live  Strategy │  <- top nav
│ Calendar                              [Account ▾] [⚙]   │
├─────────────────────────────────────────────────────────┤
│ ▸ TOF104888 $99,031.94 ▾1.0%  LUCID-03 $50,220 ▲0.4% ... │  <- equity tape
├─────────────────────────────────────────────────────────┤
│                                                           │
│                     (module content)                     │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

Sidebar nav collapses to icons under 1024px; equity tape stays full-width and
scrollable at every breakpoint since it's the fastest cross-account glance.

### Component conventions (apply everywhere)

- Cards: `--surface`, 1px `--border`, 12px radius, 20px padding.
- Positive numbers get a `+` prefix and `--accent-green`; negative get
  `--accent-red`; zero/neutral stays `--text-primary`.
- Every chart has a visible loading skeleton (not a spinner) matching the
  chart's final shape, and an explicit empty state with a one-line
  explanation + next action (never a blank chart with no message).
- Focus rings: 2px `--accent-violet`, always visible on keyboard focus.

---

## 2. Information Architecture

```
Dashboard          <- cross-account overview, default landing page
Portfolio          <- stock holdings (personal_portfolio accounts)
Funded & Eval       <- Lucid Flex / Topstep accounts (account_type funded_*)
Live Accounts       <- personal_live accounts
Strategies          <- strategy builder, backtests, validation status
Calendar            <- day/month/year P&L calendar, all accounts or filtered
```

Each of Funded & Eval, Live Accounts, and Portfolio follows the same pattern:
a list/grid view of accounts in that category, drilling into a per-account
detail view. Don't build three unrelated UIs — build one account-detail
template and one list template, parameterized by account_type, so adding an
8th funded account or a new personal live account never requires new UI code.

---

## 3. Dashboard (landing page)

Cross-account overview — pulls from Phase 2's `/dashboard/summary`.

**Top row — stat cards** (mirrors the reference screenshot's card row, but
aggregated across all accounts instead of one):
- Total Capital (sum of `capital_base` across active accounts)
- Total Balance (sum of `account_balances.current_balance`)
- Today's P&L (sum of today's `trades.pnl_net`, green/red)
- Accounts at Risk (count of accounts with an unacknowledged `risk_alert`)

**Account grid**: one card per account, each showing label, account_type
badge (funded/live/portfolio — colored subtly, not with the green/red
money colors), current balance, today's change. Clicking opens that
account's detail view in the relevant module.

**Aggregate equity chart**: combined balance across all accounts over time,
using `lightweight-charts` (TradingView's open-source charting library —
purpose-built for financial time series, gives the same crosshair/tooltip
interaction as the reference screenshot's equity chart for free, rather than
hand-rolling that interaction on a general charting library).

**Recent risk alerts**: last 5 unacknowledged alerts from
`/risk-alerts?acknowledged=false`, with inline acknowledge action.

---

## 4. Account Detail Template (used by Funded & Eval, Live Accounts)

This is the screen that most directly mirrors the reference screenshots —
reuse their density and structure, not their exact visuals.

**Header bar**: account label, status badge (`active`/`paused`/`failed`/
`closed` — closed accounts route status text through red only if `failed`;
a normal `closed` is neutral, not a failure state), program/type label,
account size, start date.

**Stat cards row**: Balance, Equity (same value today, diverges if intraday
open positions are tracked later), Win Rate (with the small donut-ring
treatment from the reference — `%` in the center, ring shows win vs loss
share), Trading Days (days since first trade in this account).

**Two-column chart row**:
- Left: Account Equity — area chart, hover tooltip showing exact date +
  value (matches reference behavior exactly, this interaction pattern is
  genuinely good UX, not a default to avoid).
- Right: Account Performance — cumulative P&L line from zero, same hover
  behavior.

Below charts: Highest/Lowest balance, "time since first trade" countup —
same information density as the reference's bottom-left card.

**Rules row** (funded/eval accounts only — omit entirely for personal live
accounts, which have no prop-firm rules): Profit Target, Daily Loss Limit,
Max Loss Limit as three cards, each showing current value against threshold
(reads from Phase 1 account data + a small `account_rules` concept — if this
table doesn't exist yet in the backend, flag it as a gap rather than
inventing numbers on the frontend).

**Most Traded**: small donut chart of trade count by symbol, from
`trades.symbol` grouped for this account.

**Statistics grid**: Average Win, Average Loss, Best Trade, Worst Trade,
Profit Factor, Win Ratio, Risk:Reward, Highest Realized Profit, Trades
Placed, Contracts, Total Approved Payouts (this last one reads from
`allocations WHERE type='payout'`, Phase 1 data — real, not invented).

**Daily / Weekly Summary toggle**: table matching the reference exactly —
Date, Balance, Equity, Realized P&L, paginated. Weekly Summary rolls the
same data up by ISO week.

**Funded/Eval-specific**: a "Credentials" action (opens whatever the person
uses to store platform login info — this is a link-out, never store
platform credentials in this app's own database) and a status badge that
reads `Breached` in red when `accounts.status = 'failed'`.

---

## 5. Portfolio Module

For `personal_portfolio` accounts (Phase 3 Track B). List view shows one
card per portfolio account with total value and period return. Detail view:

- **Holdings table**: symbol, quantity, cost basis, current value (needs a
  live/delayed price source — flag as an open decision, don't fake prices),
  unrealized gain/loss, % of portfolio (allocation).
- **Allocation donut**: holdings grouped by `asset_class`, or by symbol for
  a concentration view — toggle between the two.
- **Returns row**: Quarter / Year / 4-Year / 5-Year buttons, each pulling
  from `/portfolio/returns`. Windows with insufficient snapshot history show
  "Not enough history yet" rather than a misleading number.
- **Add/edit holding form**: uses the Instrument Picker (see §7) filtered to
  stocks/ETFs only.

---

## 6. Strategies Module

Uses `--accent-violet` as this module's identity color throughout (badges,
active nav item, primary buttons here specifically) — the one place the
palette departs from green/red, deliberately signaling "you are configuring
the system, not looking at money."

- **Strategy list**: cards showing name, status badge (`draft` /
  `backtesting` / `validated` / `live` / `retired`), last backtest's win
  rate and total P&L if one exists.
- **Strategy detail**: rules (rendered from the `rules` JSONB — build a
  structured form for common fields like entry/exit conditions and position
  sizing rather than a raw JSON editor, but allow an "advanced/raw" toggle
  for anything the structured form doesn't cover yet), backtest history
  list, and the validation gate: a strategy cannot be flipped to `live`
  status from this UI unless it has an approved `strategy_validations` row
  — the "Mark Live" button should be disabled with an explanit tooltip
  otherwise, not just silently fail on the backend.
- **Backtest run view**: form to pick date range + data source, triggers
  `POST /strategies/:id/backtests`, then shows results (win rate, P&L, max
  drawdown, Sharpe) once the job completes — poll or use a simple loading
  state, this doesn't need to be real-time streaming.

---

## 7. Calendar Module

Matches the reference screenshot's month-grid calendar closely — it's a
genuinely good pattern for this data, not a default to avoid.

- **View toggle**: Day / Month / Year, top-right.
- **Month view** (default): 7-column grid, each day cell shows realized P&L
  and trade count, color-scaled by magnitude (deeper green for bigger
  profit days, deeper red for bigger loss days, neutral gray for $0/no
  trades — not just binary green-or-red, so a $20 day and a $2,000 day are
  visually distinguishable). Each week's row ends with a weekly total
  summary cell, matching the reference's right-edge weekly rollup.
- **Year view**: 12 small month tiles (mini heatmaps, GitHub-contribution-
  graph style) so a full year's pattern is visible at once; click a month to
  drill into Month view.
- **Day view**: selecting a day opens a side panel or modal listing every
  trade that day (symbol, direction, entry/exit, P&L, tags), sourced from
  `trades` filtered by date — this is the drill-down the calendar's cells
  are teasing.
- **Account filter**: dropdown to scope the calendar to one account or all
  accounts combined (default: all, matching the Dashboard's cross-account
  framing).
- Data source: Phase 2's `pnl_by_day` view for month/day granularity,
  aggregated client-side or via a new `pnl_by_month`/`pnl_by_year` view if
  querying twelve months of daily rows client-side becomes a real
  performance issue — start simple, only add the extra view if it's
  actually needed.

---

## 8. Instrument Picker (contracts & stocks)

Shared component used anywhere a symbol needs to be selected — CSV import
review, manual trade entry (if ever added), holdings entry, strategy rules.

- **Futures contracts**: maintain a small local static list to start (your
  actual traded instruments — MNQ, NQ, MES, ES, CL, GC, etc. — expand as
  needed rather than trying to ship every CME symbol on day one). Each entry
  shows symbol, full name, and exchange.
- **Stocks/ETFs**: free-text search-as-you-type. Don't hardcode a stock
  list — either hit a free symbol-lookup API (evaluate options when this is
  actually built, since availability/rate limits change) or fall back to
  plain free-text entry with no validation if no API is wired up yet. Don't
  block someone from entering a holding just because symbol lookup isn't
  built yet.
- Selecting an instrument sets `asset_class` automatically (futures
  contracts vs. equity/ETF) so downstream filtering (e.g. Portfolio's
  allocation donut) works without manual tagging.

---

## 9. States, accessibility, responsiveness

- **Empty states**: every list/table has a specific empty message + one
  clear next action (e.g. Strategies with none yet: "No strategies yet —
  create one to start backtesting," with the create button right there, not
  a generic "No data").
- **Loading**: skeleton shapes matching final layout, never a bare spinner
  on a blank card.
- **Errors**: state what failed and what to do (e.g. "Couldn't load account
  balance — check your connection and retry" with a retry button), never a
  raw error code with no action.
- **Responsive**: sidebar nav collapses to icon rail under 1024px; stat card
  rows go from 4-across to 2-across to 1-across as width shrinks; tables
  scroll horizontally rather than compressing columns unreadably.
- **Keyboard/focus**: every interactive element reachable by keyboard,
  visible violet focus ring, no keyboard traps in modals.

---

## 10. Tech notes for this repo

- React + Vite (per `TECH_STACK.md`), Tailwind for styling using the tokens
  above as CSS variables / Tailwind theme extension — not hardcoded hex
  scattered through components.
- Charting: `lightweight-charts` for equity/performance time series,
  `recharts` for donuts/bar charts/calendar heatmap cells.
- All data access goes through the shared API client
  (`src/api/client.js`, per `FRONTEND_SETUP.md`) reading
  `VITE_API_BASE_URL` — no component fetches directly.
- Build the Account Detail template and the list-view template as shared,
  parameterized components first (§4) — building Funded/Eval and Live
  Accounts as two separate hand-built screens duplicates most of this spec
  for no reason.
