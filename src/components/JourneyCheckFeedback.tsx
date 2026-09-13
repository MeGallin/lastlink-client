import { useEffect } from 'react'
import type { JourneyInput } from '../journeys/journey-store'
import { routeName } from '../journeys/journey-presentation'

export interface JourneyCheckError {
  message: string
  field?: string
  input: JourneyInput
}
export function JourneyCheckFeedback({
  error,
  pending,
  previousName,
}: {
  error: JourneyCheckError | null
  pending: JourneyInput | null
  previousName?: string
}) {
  useEffect(() => {
    if (error)
      (
        document.getElementById(error.field ?? '') ?? document.getElementById('journey-check-error')
      )?.focus()
  }, [error])
  return (
    <>
      {error && (
        <div
          id="journey-check-error"
          className="form-message error-message"
          role="alert"
          tabIndex={-1}
        >
          <strong>Could not check {routeName(error.input)}</strong>
          <p>{error.message}</p>
          {previousName && <p>Your previous plan, {previousName}, is unchanged below.</p>}
        </div>
      )}
      {pending && (
        <p className="form-message" role="status">
          Checking TfL: {routeName(pending)}…
        </p>
      )}
    </>
  )
}
