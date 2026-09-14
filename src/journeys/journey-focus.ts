export type JourneyFocusIntent = 'page' | 'form' | 'result'

/** Editing can remain true after a check; only an explicit form intent targets it. */
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
