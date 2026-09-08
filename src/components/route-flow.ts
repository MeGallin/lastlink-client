export type RouteIconKind = 'walk' | 'tube' | 'bus' | 'rail' | 'other'

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

export function getRouteIconKind(mode: string): RouteIconKind {
  switch (mode.trim().toLowerCase()) {
    case 'walk':
      return 'walk'
    case 'tube':
      return 'tube'
    case 'bus':
      return 'bus'
    case 'rail':
    case 'overground':
      return 'rail'
    default:
      return 'other'
  }
}

export function formatJourneyDuration(departureAt: string, arrivalAt: string) {
  const differenceMs = Date.parse(arrivalAt) - Date.parse(departureAt)
  if (!Number.isFinite(differenceMs) || differenceMs < 0) return 'duration unavailable'

  const totalSeconds = Math.round(differenceMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes} min ${seconds} sec`
}
