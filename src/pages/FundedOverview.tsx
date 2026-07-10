import { useEffect, useState } from 'react'
import { listAccounts, listAggregateRiskRules, listPayoutRules, listRiskRules, getAggregateRiskStatus } from '../api'
import { useApi } from '../hooks/useApi'
import { AccountsList } from './AccountsList'
import { PayoutsSection } from '../components/PayoutsSection'
import { AggregateRiskSection } from '../components/AggregateRiskSection'
import { RiskRulesSection } from '../components/RiskRulesSection'
import { Card } from '../components/ui/Card'
import { ErrorState } from '../components/ui/ErrorState'

export function FundedOverview() {
  const accounts = useApi(listAccounts, [])
  const payoutRules = useApi(listPayoutRules, [])
  const riskStatus = useApi(getAggregateRiskStatus, [])
  const riskRules = useApi(listAggregateRiskRules, [])
  const accountRiskRules = useApi(() => listRiskRules(), [])

  const [rulesState, setRulesState] = useState(payoutRules.data ?? [])
  useEffect(() => {
    if (payoutRules.data) setRulesState(payoutRules.data)
  }, [payoutRules.data])

  const [riskRulesState, setRiskRulesState] = useState(riskRules.data ?? [])
  useEffect(() => {
    if (riskRules.data) setRiskRulesState(riskRules.data)
  }, [riskRules.data])

  const [accountRiskRulesState, setAccountRiskRulesState] = useState(accountRiskRules.data ?? [])
  useEffect(() => {
    if (accountRiskRules.data) setAccountRiskRulesState(accountRiskRules.data)
  }, [accountRiskRules.data])

  const fundedAccounts = (accounts.data ?? []).filter((a) => a.account_type.startsWith('funded_'))

  return (
    <div className="space-y-8">
      <AccountsList
        title="Funded & Eval"
        accountTypes={['funded_lucid', 'funded_topstep']}
        basePath="/funded"
        emptyDescription="Funded and evaluation accounts (Lucid Flex, Topstep) will appear here once seeded on the backend."
        allowAdd
      />

      <Card>
        {payoutRules.error ? (
          <>
            <h2 className="text-sm text-text-muted mb-3">Payouts</h2>
            <ErrorState message="Couldn't load payout rules — check your connection and retry." onRetry={payoutRules.refetch} />
          </>
        ) : (
          <PayoutsSection
            accounts={fundedAccounts}
            rules={rulesState}
            onRuleCreated={(rule) => setRulesState((prev) => [rule, ...prev])}
            onRuleUpdated={(rule) => setRulesState((prev) => prev.map((r) => (r.id === rule.id ? rule : r)))}
            onRuleDeleted={(ruleId) => setRulesState((prev) => prev.filter((r) => r.id !== ruleId))}
          />
        )}
      </Card>

      <Card>
        {riskStatus.error || riskRules.error ? (
          <>
            <h2 className="text-sm text-text-muted mb-3">Aggregate Risk</h2>
            <ErrorState
              message="Couldn't load aggregate risk data — check your connection and retry."
              onRetry={() => {
                riskStatus.refetch()
                riskRules.refetch()
              }}
            />
          </>
        ) : (
          <AggregateRiskSection
            status={riskStatus.data}
            rules={riskRulesState}
            onRuleCreated={(rule) => setRiskRulesState((prev) => [rule, ...prev])}
            onRuleUpdated={(rule) => setRiskRulesState((prev) => prev.map((r) => (r.id === rule.id ? rule : r)))}
            onRuleDeleted={(ruleId) => setRiskRulesState((prev) => prev.filter((r) => r.id !== ruleId))}
          />
        )}
      </Card>

      <Card>
        {accountRiskRules.error ? (
          <>
            <h2 className="text-sm text-text-muted mb-3">Risk Rules</h2>
            <ErrorState message="Couldn't load risk rules — check your connection and retry." onRetry={accountRiskRules.refetch} />
          </>
        ) : (
          <RiskRulesSection
            accounts={accounts.data ?? []}
            rules={accountRiskRulesState}
            onRuleCreated={(rule) => setAccountRiskRulesState((prev) => [rule, ...prev])}
            onRuleUpdated={(rule) => setAccountRiskRulesState((prev) => prev.map((r) => (r.id === rule.id ? rule : r)))}
            onRuleDeleted={(ruleId) => setAccountRiskRulesState((prev) => prev.filter((r) => r.id !== ruleId))}
          />
        )}
      </Card>
    </div>
  )
}
