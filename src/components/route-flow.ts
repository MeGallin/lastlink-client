export type RouteIconKind = 'walk' | 'tube' | 'bus' | 'rail' | 'other'

export type RouteDisplayMode = RouteIconKind | 'overground'

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
