import type { ConditionGroup, RuleCondition } from '../../api'

export const EMPTY_CONDITION: RuleCondition = { indicator: '', operator: '>', value: 0 }

export function emptyConditionGroup(): ConditionGroup {
  return { logic: 'AND', conditions: [{ ...EMPTY_CONDITION }] }
}
