import type { StationOption } from '../data/stations'
import { isJourneyResponse } from './journey-response'
import { toDeadlineIso } from '../components/journey-time'

export interface JourneyLocation {
  name: string
  tflStopPointId: string
}

// Render's free service can take about a minute to wake after idle time.
// Keep the request open long enough for that one-time platform delay while
// the UI explains what is happening to the traveller.
export const requestTimeoutMs = 75_000
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')

export async function requestJourneyCheck(
  input: {
    destination: StationOption
    origin: JourneyLocation
    arriveBy: string
    arriveByAtMs?: number
    safetyBufferMinutes: number
  },
  signal?: AbortSignal,
) {
  const controller = new AbortController()
  const abort = () => controller.abort()
  signal?.addEventListener('abort', abort, { once: true })
  if (signal?.aborted) controller.abort()
  const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs)

  try {
    const response = await fetch(`${apiBaseUrl}/v1/journey-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        origin: input.origin,
        destination: {
          name: input.destination.name,
          tflStopPointId: input.destination.id,
        },
        arriveBy: toDeadlineIso(input.arriveBy, input.arriveByAtMs),
        safetyBufferMinutes: input.safetyBufferMinutes,
      }),
    })

    const body = await readResponseBody(response)
    if (!response.ok) {
      throw new Error(readErrorMessage(body) ?? 'The journey check could not be completed.')
    }
    if (!isJourneyResponse(body)) {
      throw new Error('The journey service returned an invalid response. Please try again.')
    }
    return body
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('The journey service took too long to respond. It may still be waking up. Please try again.')
    }
    if (error instanceof TypeError) {
      throw new Error('The journey service could not be reached. It may be waking up. Please try again in a moment.')
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
    signal?.removeEventListener('abort', abort)
  }
}

async function readResponseBody(response: Response) {
  const text = await response.text()
  if (!text) return {}

  try {
    return JSON.parse(text) as unknown
  } catch {
    return {}
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readErrorMessage(value: unknown) {
  if (!isRecord(value) || !isRecord(value.error)) return undefined
  return typeof value.error.message === 'string' ? value.error.message : undefined
}
