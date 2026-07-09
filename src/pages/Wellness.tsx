import { useEffect, useState } from 'react'
import { listEmotionalStateLogs, listTradeReviews } from '../api'
import { useApi } from '../hooks/useApi'
import { WellnessSection } from '../components/WellnessSection'
import { ErrorState } from '../components/ui/ErrorState'

export function Wellness() {
  const logs = useApi(listEmotionalStateLogs, [])
  const reviews = useApi(listTradeReviews, [])

  const [logState, setLogState] = useState(logs.data ?? [])
  useEffect(() => {
    if (logs.data) setLogState(logs.data)
  }, [logs.data])

  const [reviewState, setReviewState] = useState(reviews.data ?? [])
  useEffect(() => {
    if (reviews.data) setReviewState(reviews.data)
  }, [reviews.data])

  if (logs.error || reviews.error) {
    return <ErrorState message="Couldn't load wellness data — check your connection and retry." onRetry={() => { logs.refetch(); reviews.refetch() }} />
  }

  return (
    <WellnessSection
      emotionalStateLogs={logState}
      tradeReviews={reviewState}
      onLogCreated={(log) => setLogState((prev) => [log, ...prev])}
      onReviewCreated={(review) => setReviewState((prev) => [review, ...prev])}
    />
  )
}
