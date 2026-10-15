export type JourneyFocusIntent = 'page' | 'form' | 'result'

export function savedJourneyReviewField(input: { timeMode?: 'leave_now' | 'arrive_by' }) {
  return input.timeMode === 'leave_now' ? 'origin' : 'arriveBy'
}

/** Explicit edit actions target the planner; checked results target their answer. */
export function journeyFocusTarget(
  intent: JourneyFocusIntent,
  editing: boolean,
  hasResult: boolean,
  isActive: boolean,
) {
  if (intent === 'form' && editing) return 'form'
  if (hasResult) return isActive && !editing ? 'current' : 'answer'
  return 'page'
}
