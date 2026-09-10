export type JourneyStatus =
  | 'viable'
  | 'tight'
  | 'not_viable'
  | 'unable_to_verify'

export interface JourneyResponse {
  contractVersion: 'journey-check.v0.2'
  status: JourneyStatus
  dataMode: 'fixture' | 'live' | 'cache'
  checkedAt: string
  summary: string
  nextAction: string
  stationOnly: true
  stationOnlyWarning: string
  deadline: { arriveBy: string }
  margin: {
    arrivalAt: string
    transferMinutes: number
    safetyBufferMinutes: number
    availableMinutes: number
    remainingAfterBufferMinutes: number
  } | null
  route: {
    arrivalAt: string
    walkingMinutes?: number
    fareWarning?: string
    legs: Array<{
      mode: string
      lineName?: string
      directions?: string[]
      from: string
      fromTflStopPointId?: string
      to: string
      toTflStopPointId?: string
      departureAt: string
      arrivalAt: string
      scheduledDepartureAt?: string
      scheduledArrivalAt?: string
      instructions?: {
        summary?: string
        detailed?: string
        steps?: string[]
      }
      durationMinutes: number
    }>
  } | null
  reasons: Array<{ code: string; message: string }>
  evidence: Array<{ source: string; capturedAt: string; ageSeconds: number | null }>
  warnings: string[]
}
