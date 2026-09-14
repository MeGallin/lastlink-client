import { useEffect, useState } from 'react'
import type { JourneyInput } from '../journeys/journey-store'
import { routeName } from '../journeys/journey-presentation'
import { pendingJourneyCopy, scheduleWakeNotice } from './journey-check-status'

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
          {previousName && <p>Your previous plan, {previousName}, is unchanged.</p>}
        </div>
      )}
      {pending && (
        <PendingJourneyMessage key={routeName(pending)} pending={pending} />
      )}
    </>
  )
}

function PendingJourneyMessage({ pending }: { pending: JourneyInput }) {
  const [serviceWaking, setServiceWaking] = useState(false)
  useEffect(() => {
    return scheduleWakeNotice(() => setServiceWaking(true))
  }, [])
  const copy = pendingJourneyCopy(pending)
  return (
    <div className="form-message" role="status">
      {serviceWaking ? (
        <>
          <strong>{copy.wakingHeading}</strong>
          <p>{copy.wakingBody}</p>
        </>
      ) : (
        <>{copy.checking}</>
      )}
    </div>
  )
}
