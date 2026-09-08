import type { StationOption } from '../data/stations'
import { isJourneyResponse } from './journey-response'

export interface JourneyLocation {
  name: string
  tflStopPointId?: string
}

const requestTimeoutMs = 20_000
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')

export async function requestJourneyCheck(input: {
  destination: StationOption
  origin: JourneyLocation
  arriveBy: string
  safetyBufferMinutes: number
}) {
  const controller = new AbortController()
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
        arriveBy: new Date(input.arriveBy).toISOString(),
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
      throw new Error('The check took too long. Please try again.')
    }
    if (error instanceof TypeError) {
      throw new Error('The journey service could not be reached. Please try again.')
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
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
