export type RouteIconKind = 'walk' | 'tube' | 'bus' | 'rail' | 'other'

export type RouteDisplayMode = RouteIconKind | 'overground'

export type RouteLeg = {
  mode: string
  lineName?: string
  directions?: string[]
  from: string
  to: string
  instructions?: {
    detailed?: string
  }
}

export type RouteChangeKind = 'branch' | 'line' | 'mode'

export interface RouteChange {
  kind: RouteChangeKind
  at: string
  title: string
  description: string
  nextDirection?: string
}

const lineColors: Record<string, string> = {
  bakerloo: '#b26300',
  central: '#e32017',
  circle: '#ffd300',
  district: '#00782a',
  'hammersmith & city': '#f3a9bb',
  jubilee: '#a0a5a9',
  metropolitan: '#9b0056',
  northern: '#000000',
  piccadilly: '#003688',
  victoria: '#0098d4',
  'waterloo & city': '#76d7c4',
}

export function formatLineName(lineName?: string) {
  const cleanLineName = lineName?.trim()
  if (!cleanLineName) return ''
  const suffix = cleanLineName.toLowerCase().endsWith(' line') ? '' : ' line'
  return `${cleanLineName}${suffix}`
}

export function formatRouteDirection(direction: string) {
  return direction.trim()
}

export function formatRouteDirectionText(
  directions?: string[],
  detailedInstruction?: string,
) {
  const detailed = detailedInstruction?.trim()
  if (
    detailed &&
    /\b(?:towards?|northbound|southbound|eastbound|westbound|via)\b/i.test(
      detailed,
    )
  ) {
    return detailed
  }

  const providerDirections = directions?.map(formatRouteDirection).filter(Boolean) ?? []
  return providerDirections.length > 0 ? providerDirections.join(' · ') : undefined
}

export function getRouteChange(
  previousLeg: RouteLeg,
  nextLeg: RouteLeg,
): RouteChange | undefined {
  const previousMode = getRouteDisplayMode(previousLeg.mode, previousLeg.lineName)
  const nextMode = getRouteDisplayMode(nextLeg.mode, nextLeg.lineName)
  const previousDirection = formatRouteDirectionText(
    previousLeg.directions,
    previousLeg.instructions?.detailed,
  )
  const nextDirection = formatRouteDirectionText(
    nextLeg.directions,
    nextLeg.instructions?.detailed,
  )
  const at = nextLeg.from || previousLeg.to

  if (!at || previousMode === 'walk' || nextMode === 'walk') return undefined

  if (previousMode === 'tube' && nextMode === 'tube') {
    const previousLine = normalizeLineName(previousLeg.lineName)
    const nextLine = normalizeLineName(nextLeg.lineName)
    if (previousLine === '' || nextLine === '') return undefined
    const sameLine = previousLine !== '' && previousLine === nextLine

    if (
      sameLine &&
      previousDirection &&
      nextDirection &&
      !sameText(previousDirection, nextDirection)
    ) {
      return {
        kind: 'branch',
        at,
        title: `Change trains at ${at}`,
        description:
          'Same line, different branch. Get off here and board the next train in the direction shown below.',
        nextDirection,
      }
    }

    if (!sameLine) {
      return {
        kind: 'line',
        at,
        title: `Change lines at ${at}`,
        description: `Get off here and follow signs for ${formatRouteService(nextLeg.mode, nextLeg.lineName)}.`,
        nextDirection,
      }
    }
  }

  if (previousMode !== nextMode) {
    return {
      kind: 'mode',
      at,
      title: `Change at ${at}`,
      description: `Get off here and continue by ${formatRouteService(nextLeg.mode, nextLeg.lineName)}.`,
      nextDirection,
    }
  }

  return undefined
}

function normalizeLineName(lineName?: string) {
  return lineName?.trim().toLowerCase().replace(/\s+line$/, '') ?? ''
}

function sameText(first: string, second: string) {
  return (
    first.trim().toLowerCase().replace(/\s+/g, ' ') ===
    second.trim().toLowerCase().replace(/\s+/g, ' ')
  )
}

export function providerScheduleMatchesItinerary(
  departureAt: string,
  arrivalAt: string,
  scheduledDepartureAt?: string,
  scheduledArrivalAt?: string,
) {
  if (scheduledDepartureAt === undefined || scheduledArrivalAt === undefined) {
    return false
  }

  return (
    Date.parse(departureAt) === Date.parse(scheduledDepartureAt) &&
    Date.parse(arrivalAt) === Date.parse(scheduledArrivalAt)
  )
}

export function getLineColor(lineName?: string) {
  const key = lineName
    ?.trim()
    .toLowerCase()
    .replace(/\s+line$/, '')
  return (key && lineColors[key]) || 'var(--accent)'
}

export function getRouteDisplayMode(
  mode: string,
  lineName?: string,
): RouteDisplayMode {
  const normalizedMode = mode.trim().toLowerCase()
  if (normalizedMode !== 'other') return getKnownRouteDisplayMode(normalizedMode)

  const normalizedLineName = lineName?.trim().toLowerCase() ?? ''
  const lineKey = normalizedLineName.replace(/\s+line$/, '')
  if (lineKey && lineColors[lineKey]) return 'tube'
  if (/\b(bus|coach)\b/.test(normalizedLineName)) return 'bus'
  if (/\b(overground|dlr)\b/.test(normalizedLineName)) return 'overground'
  if (/\b(rail|train)\b/.test(normalizedLineName)) return 'rail'
  return 'other'
}

function getKnownRouteDisplayMode(mode: string): RouteDisplayMode {
  switch (mode) {
    case 'walk':
      return 'walk'
    case 'tube':
      return 'tube'
    case 'bus':
      return 'bus'
    case 'rail':
      return 'rail'
    case 'overground':
      return 'overground'
    default:
      return 'other'
  }
}

export function formatRouteMode(mode: string, lineName?: string) {
  const displayMode = getRouteDisplayMode(mode, lineName)
  return displayMode === 'tube'
    ? 'Tube'
    : displayMode === 'walk'
      ? 'Walk'
      : displayMode === 'bus'
        ? 'Bus'
        : displayMode === 'rail'
          ? 'Rail'
          : displayMode === 'overground'
            ? 'Overground'
            : 'Other'
}

export function formatRouteService(mode: string, lineName?: string) {
  const serviceName = lineName?.trim()
  if (!serviceName) return formatRouteMode(mode)
  return `${formatRouteMode(mode, serviceName)}: ${
    getRouteDisplayMode(mode, serviceName) === 'tube'
      ? formatLineName(serviceName)
      : serviceName
  }`
}

export function getRouteIconKind(mode: string, lineName?: string): RouteIconKind {
  const displayMode = getRouteDisplayMode(mode, lineName)
  return displayMode === 'overground' ? 'rail' : displayMode
}

export function formatJourneyDuration(departureAt: string, arrivalAt: string) {
  const differenceMs = Date.parse(arrivalAt) - Date.parse(departureAt)
  if (!Number.isFinite(differenceMs) || differenceMs < 0) return 'duration unavailable'

  const totalSeconds = Math.round(differenceMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes} min ${seconds} sec`
}
